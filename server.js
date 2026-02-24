const express = require('express');
const initSqlJs = require('sql.js');
const crypto = require('crypto');
const path = require('path');
const fs = require('fs');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const app = express();
const PORT = process.env.PORT || 3000;

// Trust reverse proxy (Azure Container Apps) for correct protocol/IP
app.set('trust proxy', true);

// --- Database setup ---
const DB_PATH = process.env.DB_PATH || path.join(__dirname, 'data', 'layouts.db');
fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });

let db;

async function initDB() {
    const SQL = await initSqlJs();

    if (fs.existsSync(DB_PATH)) {
        const fileBuffer = fs.readFileSync(DB_PATH);
        db = new SQL.Database(fileBuffer);
    } else {
        db = new SQL.Database();
    }

    db.run(`
        CREATE TABLE IF NOT EXISTS layouts (
            id TEXT PRIMARY KEY,
            data TEXT NOT NULL,
            created_at TEXT DEFAULT (datetime('now')),
            ip_hash TEXT,
            size_bytes INTEGER
        )
    `);

    // Add thumbnail column if it doesn't exist
    try {
        db.run('ALTER TABLE layouts ADD COLUMN thumbnail BLOB');
    } catch (e) {
        // Column already exists
    }

    saveDB();
}

function saveDB() {
    const data = db.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(DB_PATH, buffer);
}

// --- Middleware ---

// Security headers
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
            fontSrc: ["'self'", "https://fonts.gstatic.com"],
            imgSrc: ["'self'", "data:", "blob:"],
            connectSrc: ["'self'"],
        },
    },
    crossOriginResourcePolicy: { policy: 'cross-origin' },
}));

// CORS — restrict to our domain in production
const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN || '*';
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', ALLOWED_ORIGIN);
    res.header('Access-Control-Allow-Methods', 'GET, POST');
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    next();
});

// Body parsing with size limit (includes base64 OG thumbnail)
app.use(express.json({ limit: '500kb' }));

// Rate limiting for layout saves
const saveLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 10,                   // 10 saves per hour per IP
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many saves. Please try again later.' },
});

// --- Dynamic OG tags for shared layouts (must precede static middleware) ---
app.get('/', (req, res, next) => {
    const layoutId = req.query.layout;
    if (!layoutId || !/^[a-zA-Z0-9]+$/.test(layoutId)) {
        return next(); // Fall through to static index.html
    }

    // Read index.html and inject layout-specific OG tags
    const indexPath = path.join(__dirname, 'public', 'index.html');
    fs.readFile(indexPath, 'utf8', (err, html) => {
        if (err) return next();

        const baseUrl = `${req.protocol}://${req.get('host')}`;
        const ogImageUrl = `${baseUrl}/api/layouts/${layoutId}/og-image.png`;
        const pageUrl = `${baseUrl}/?layout=${layoutId}`;

        // Replace OG meta tags with layout-specific values
        html = html.replace(
            /<meta property="og:image" content="[^"]*">/,
            `<meta property="og:image" content="${ogImageUrl}">`
        );
        html = html.replace(
            /<meta property="og:url" content="[^"]*">/,
            `<meta property="og:url" content="${pageUrl}">`
        );
        html = html.replace(
            /<meta name="twitter:image" content="[^"]*">/,
            `<meta name="twitter:image" content="${ogImageUrl}">`
        );
        html = html.replace(
            /<meta property="og:title" content="[^"]*">/,
            `<meta property="og:title" content="LCARS Layout — ${layoutId}">`
        );
        html = html.replace(
            /<meta name="twitter:title" content="[^"]*">/,
            `<meta name="twitter:title" content="LCARS Layout — ${layoutId}">`
        );

        res.set('Content-Type', 'text/html');
        res.send(html);
    });
});

// --- Static files ---
app.use(express.static(path.join(__dirname, 'public')));

// --- API Routes ---

// Save a layout
app.post('/api/layouts', saveLimiter, (req, res) => {
    try {
        const data = req.body;

        // Validate it's a proper layout
        if (!data || !Array.isArray(data.elements)) {
            return res.status(400).json({ error: 'Invalid layout format. Expected { elements: [...] }' });
        }

        // Extract and remove thumbnail from layout data before storing
        let thumbnailBuf = null;
        if (data.thumbnail && typeof data.thumbnail === 'string') {
            const match = data.thumbnail.match(/^data:image\/(png|jpeg);base64,(.+)$/);
            if (match) {
                thumbnailBuf = Buffer.from(match[2], 'base64');
            }
            delete data.thumbnail;
        }

        const json = JSON.stringify(data);
        const id = generateId();
        const ipHash = hashIP(req.ip || req.connection.remoteAddress || 'unknown');

        db.run('INSERT INTO layouts (id, data, ip_hash, size_bytes, thumbnail) VALUES (?, ?, ?, ?, ?)',
            [id, json, ipHash, Buffer.byteLength(json, 'utf8'), thumbnailBuf]);
        saveDB();

        res.json({ id });
    } catch (err) {
        console.error('Error saving layout:', err.message);
        res.status(500).json({ error: 'Failed to save layout.' });
    }
});

// Load a layout
app.get('/api/layouts/:id', (req, res) => {
    const id = req.params.id;

    // Validate ID format (alphanumeric only)
    if (!/^[a-zA-Z0-9]+$/.test(id)) {
        return res.status(400).json({ error: 'Invalid layout ID.' });
    }

    try {
        const stmt = db.prepare('SELECT data FROM layouts WHERE id = ?');
        stmt.bind([id]);

        if (stmt.step()) {
            const row = stmt.getAsObject();
            stmt.free();
            res.json(JSON.parse(row.data));
        } else {
            stmt.free();
            res.status(404).json({ error: 'Layout not found.' });
        }
    } catch (err) {
        console.error('Error loading layout:', err.message);
        res.status(500).json({ error: 'Failed to load layout.' });
    }
});

// Serve OG thumbnail for a shared layout
app.get('/api/layouts/:id/og-image.png', (req, res) => {
    const id = req.params.id;
    if (!/^[a-zA-Z0-9]+$/.test(id)) {
        return res.status(400).send('Invalid ID');
    }
    try {
        const stmt = db.prepare('SELECT thumbnail FROM layouts WHERE id = ?');
        stmt.bind([id]);
        if (stmt.step()) {
            const row = stmt.getAsObject();
            stmt.free();
            if (row.thumbnail) {
                res.set('Content-Type', 'image/jpeg');
                res.set('Cache-Control', 'public, max-age=31536000, immutable');
                res.send(Buffer.from(row.thumbnail));
            } else {
                // No thumbnail — redirect to default OG image
                res.redirect('/og-image.png');
            }
        } else {
            stmt.free();
            res.redirect('/og-image.png');
        }
    } catch (err) {
        console.error('Error serving OG image:', err.message);
        res.redirect('/og-image.png');
    }
});

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// SPA fallback — serve index.html for unknown routes
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// --- Helpers ---

function generateId() {
    const chars = 'abcdefghijkmnpqrstuvwxyz23456789'; // no ambiguous chars (0/O, 1/l)
    let id = '';
    const bytes = crypto.randomBytes(8);
    for (let i = 0; i < 8; i++) {
        id += chars[bytes[i] % chars.length];
    }
    // Check for collision
    const stmt = db.prepare('SELECT 1 FROM layouts WHERE id = ?');
    stmt.bind([id]);
    const exists = stmt.step();
    stmt.free();
    if (exists) return generateId();
    return id;
}

function hashIP(ip) {
    return crypto.createHash('sha256').update(ip + (process.env.IP_SALT || 'lcars-default-salt')).digest('hex').slice(0, 16);
}

// --- Start server ---
initDB().then(() => {
    app.listen(PORT, () => {
        console.log(`LCARS Generator running on port ${PORT}`);
        console.log(`Database: ${DB_PATH}`);
    });
}).catch(err => {
    console.error('Failed to initialize database:', err);
    process.exit(1);
});
