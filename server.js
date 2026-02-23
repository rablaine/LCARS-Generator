const express = require('express');
const initSqlJs = require('sql.js');
const crypto = require('crypto');
const path = require('path');
const fs = require('fs');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const app = express();
const PORT = process.env.PORT || 3000;

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

// Body parsing with size limit
app.use(express.json({ limit: '50kb' }));

// Rate limiting for layout saves
const saveLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 10,                   // 10 saves per hour per IP
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many saves. Please try again later.' },
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

        const json = JSON.stringify(data);
        const id = generateId();
        const ipHash = hashIP(req.ip || req.connection.remoteAddress || 'unknown');

        db.run('INSERT INTO layouts (id, data, ip_hash, size_bytes) VALUES (?, ?, ?, ?)',
            [id, json, ipHash, Buffer.byteLength(json, 'utf8')]);
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
