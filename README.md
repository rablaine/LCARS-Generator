# LCARS Generator

A visual layout editor for designing [LCARS](https://en.wikipedia.org/wiki/LCARS)-style interfaces in the browser. Export your layouts as C++ (TFT_eSPI), PNG, or JSON.

> **Alpha** — This project is in active development. [Report issues on GitHub.](https://github.com/rablaine/LCARS-Generator/issues)

## Features

- **Visual drag-and-drop editor** — Design LCARS layouts on a canvas with real-time preview
- **13+ element types** — Elbows (all orientations), horizontal/vertical bars, buttons, pill buttons, header bars, text labels, rectangles, circles, menu blocks, bracket caps, and data blocks
- **20 TNG-era LCARS colors** with automatic RGB565 conversion for TFT displays
- **Multi-select** — Shift+click, Ctrl+A, or marquee box selection for bulk move/delete/duplicate
- **Undo/Redo** — Full history with Ctrl+Z / Ctrl+Y
- **Export formats:**
  - **C++ (TFT_eSPI)** — Ready-to-compile Arduino sketch
  - **PNG** — Screenshot of your layout
  - **JSON** — Save/load layout data
- **Share URL** — Save layouts to the server and share via link
- **Autosave** — Layouts persist in localStorage with 1-second debounce
- **Tab locking** — Prevents conflicts when multiple tabs are open
- **Zoom & pan** — Mouse wheel zoom, middle-click or Space+drag to pan
- **Grid snap** — Configurable grid with snap-to-grid support

## Live Site

[https://lcars.techier.net](https://lcars.techier.net)

## Running Locally

```bash
npm install
node server.js
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Vanilla HTML/CSS/JS, Canvas API |
| Backend | Node.js, Express |
| Database | sql.js (SQLite compiled to WebAssembly) |
| Font | [Antonio](https://fonts.google.com/specimen/Antonio) (Google Fonts) |
| Deployment | Docker (Node 20 Alpine) → GitHub Container Registry → Azure Container App |
| CI/CD | GitHub Actions |

## Project Structure

```
├── server.js                  # Express server + sql.js SQLite API
├── Dockerfile                 # Production container image
├── containerapp.yaml          # Azure Container App volume mount config
├── .github/workflows/
│   └── deploy.yml             # CI/CD: build → ghcr.io → Azure
└── public/
    ├── index.html             # Main application page
    ├── css/
    │   └── lcars.css          # LCARS dark theme styles
    └── js/
        ├── app.js             # Main controller & event wiring
        ├── editor.js          # Selection, move, resize, undo/redo
        ├── canvas-renderer.js # Canvas drawing & hit testing
        ├── lcars-elements.js  # Element type definitions & rendering
        ├── lcars-colors.js    # LCARS color palette & RGB565
        ├── lcars-storage.js   # localStorage: autosave, recent, tab lock
        └── export.js          # C++/PNG/JSON export
```

## C++ Export

The C++ export generates Arduino-compatible code for the [TFT_eSPI](https://github.com/Bodmer/TFT_eSPI) library, targeting ESP8266/ESP32 boards with TFT displays (ILI9341, ST7789, etc.). The default canvas size is 280×240 but is configurable in the editor.

> **Note:** The C++ export has not yet been validated on hardware. Use at your own risk and expect adjustments may be needed.

## License

MIT
