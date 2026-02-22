# LCARS Generator — Design Decisions

> **Architecture and design decisions for the LCARS Generator project.**

---

## Hosting & Deployment

### Decision: Azure Container App + Azure File Share
- **Container App** on Consumption plan — 1 min replica always running (~$1-3/mo)
- **Azure File Share** mounted as volume — holds SQLite database, persists across redeploys
- **GitHub Container Registry (ghcr.io)** — stores Docker image (free for public repos)
- **GitHub Actions** — CI/CD pipeline builds image and deploys on push to main
- **Estimated cost**: ~$3-5/month against $250/mo credit subscription
- **Custom domain**: `lcars.techier.net` — free managed SSL certificate

### Why not other options?
| Rejected | Reason |
|----------|--------|
| Azure Container Registry | $5/mo — ghcr.io is free for public repos |
| Azure Static Web Apps | No server-side compute for SQLite/API |
| Azure App Service F1 (Free) | No custom domain SSL |
| Azure App Service B1 | $13/mo — overkill when Container Apps is nearly free |
| Fly.io | Not Azure ecosystem, user prefers Azure |
| Compressed URL (no backend) | Works but want persistent short share URLs |

---

## Share URL Feature

### Design
- `POST /api/layouts` — saves layout JSON to SQLite, returns short ID (e.g., `a7x3k`)
- `GET /api/layouts/:id` — returns layout JSON
- Frontend loads `?layout=a7x3k` on page open and reconstructs the layout
- Short IDs generated as random alphanumeric (6-8 chars)

### SQLite Schema
```sql
CREATE TABLE layouts (
    id TEXT PRIMARY KEY,        -- short random ID
    data TEXT NOT NULL,          -- JSON layout blob
    created_at TEXT DEFAULT (datetime('now')),
    ip_hash TEXT,               -- hashed IP for rate limiting (not raw IP)
    size_bytes INTEGER          -- payload size for monitoring
);
```

---

## Security Concerns & Mitigations

### Hardening Checklist
| Measure | Status | Implementation |
|---------|--------|----------------|
| HTTPS | ✅ | Azure managed cert on `lcars.techier.net` |
| Rate limiting | ✅ | `express-rate-limit` — 10 saves/hour per IP |
| Input validation | ✅ | Parameterized queries, 50 KB payload cap, JSON parse validation |
| SQL injection protection | ✅ | `better-sqlite3` `.prepare()` — parameterized only |
| XSS protection | ✅ | Canvas rendering only, no DOM insertion |
| Security headers | ✅ | `helmet` middleware (CSP, X-Frame-Options, HSTS, etc.) |
| CORS lockdown | ✅ | Restricted to `lcars.techier.net` only |
| CSRF protection | ✅ N/A | No auth, no cookies, no sessions — nothing to forge |
| PII storage | ✅ None | Hashed IPs only (SHA-256), no accounts |
| Secrets in repo | ✅ None | Azure creds in GitHub Actions secrets only |
| Non-root container | ✅ | Dockerfile uses `USER node` |
| Dependency auditing | ✅ | `npm audit` in CI pipeline |
| Cost controls | ✅ | Fixed replica count, File Share quota cap, budget alert |

### 1. Storage Spam / Abuse
**Threat**: Bad actor POSTs thousands of layouts to fill storage or run up costs.
**Mitigations**:
- Rate limit: **10 saves per hour per IP** (tracked via hashed IP in SQLite)
- Max payload size: **50 KB** per layout (Express body-parser limit)
- Max total DB size check: reject saves if DB exceeds a threshold (e.g., 100 MB)
- No authentication required (public tool), rate limiting is the main defense

### 2. Large Azure Bill
**Threat**: DDoS or abuse triggers unexpected compute/storage charges.
**Mitigations**:
- Azure budget alert set at $5/month on the subscription
- Container App has max replicas = 1 (no auto-scale surprise)
- Azure File Share is capped at 1 GB quota
- Consumption plan means zero cost at zero traffic

### 3. SQL Injection
**Threat**: Malicious input in API requests.
**Mitigations**:
- All queries use **parameterized statements** (better-sqlite3 `.prepare()`)
- Layout ID validated as alphanumeric only before query
- No dynamic SQL construction

### 4. XSS / Code Injection
**Threat**: Malicious JavaScript stored in layout JSON and executed on load.
**Mitigations**:
- Layout JSON is **parsed and fed to canvas drawing functions** — never inserted as HTML
- All text rendering goes through `ctx.fillText()` (canvas API), not DOM
- JSON is validated as parseable before storage
- Content-Type headers set correctly on API responses

### 5. Denial of Service
**Threat**: Flood of requests overwhelms the container.
**Mitigations**:
- Container App max replicas = 1, so cost is bounded
- Express rate limiting middleware (`express-rate-limit`)
- Request body size capped at 50 KB
- For 10 users, unlikely to be targeted — but mitigations are cheap to add

### 6. Data Privacy
**Threat**: Storing user IPs or personal data.
**Mitigations**:
- IPs are **hashed** (SHA-256) before storage — used only for rate limiting, not traceable
- No user accounts, no PII collected
- Layouts contain only element coordinates, colors, and labels — no personal data
- MIT license makes it clear: no warranty, no data guarantees

### 7. Insecure Direct Object Reference
**Threat**: Someone enumerates layout IDs to scrape all stored layouts.
**Mitigations**:
- IDs are random 8-char alphanumeric (~218 trillion combinations)
- Layouts are coordinates and colors — no sensitive data even if scraped
- No listing endpoint — you can only fetch by exact ID
- Acceptable risk given the data is non-sensitive

---

## Tech Stack

| Layer | Choice | Reason |
|-------|--------|--------|
| Frontend | Vanilla HTML/JS/CSS, Canvas API | No build step, simple, fast |
| Font | Antonio (Google Fonts) | Closest free match to LCARS Swiss 911 |
| Backend | Node.js + Express | Lightweight, same language as frontend |
| Database | SQLite (sql.js) | Pure JS (no native build), file-based, persists on Azure File Share |
| Container | Docker (Node.js alpine) | Required for Azure Container Apps |
| Registry | GitHub Container Registry (ghcr.io) | Free for public repos, no ACR cost |
| CI/CD | GitHub Actions | Free for public repos, auto-deploy on push |
| Export | C++ (TFT_eSPI), PNG, JSON | Target: ESP8266 + 280x240 TFT display |

---

## Git Repository
- **GitHub**: https://github.com/rablaine/LCARS-Generator.git
- **Custom domain**: `lcars.techier.net`
- **License**: MIT
- **Not yet pushed** — will push when deployment is ready

---

## Open Questions
- [x] What custom domain to use? → `lcars.techier.net`
- [x] Should shared layouts expire after N days? → **No, layouts never expire.**
- [x] Add a "report abuse" mechanism? → **No.**
- [x] Pre-built template layouts to include as examples? → **Yes.** Build realistic LCARS panels inspired by TNG reference images (Holodeck Programming, Home Automation style). Stored as JSON files, loadable from the editor.

---

## Azure File Share / Database Connection

The container accesses SQLite via a **volume mount**, not a connection string.

1. Create Storage Account + File Share in Azure
2. Container App config adds a volume mount with storage account name + key
3. Storage key stored as a **Container App secret** — not in code or repo
4. Container sees it as a local path: `/data/`
5. Node.js code: `new Database('/data/layouts.db')` — plain file access, no SDK

### Infrastructure Setup (CLI commands, run once)
```bash
# Resource group, storage account, file share, container app environment
# Will be documented when we build the deployment pipeline
```
