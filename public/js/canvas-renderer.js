/* ============================================
   Canvas Renderer
   Handles drawing the display frame, grid,
   all elements, and selection overlays.
   ============================================ */

class CanvasRenderer {
    constructor(displayCanvas, interactionCanvas) {
        this.displayCanvas = displayCanvas;
        this.interactionCanvas = interactionCanvas;
        this.ctx = displayCanvas.getContext('2d');
        this.ictx = interactionCanvas.getContext('2d');

        // Display settings
        this.displayWidth = 280;
        this.displayHeight = 240;
        this.cornerRadius = 20;
        this.bgColor = '#000000';

        // View
        this.zoom = 2; // Start at 2x so small screens are workable
        this.panX = 0;
        this.panY = 0;

        // Grid
        this.showGrid = true;
        this.gridSize = 10;
        this.snapToGrid = true;

        // Elements
        this.elements = [];
        this.selectedIds = new Set();
        this.hoveredId = null;

        // Marquee (box selection)
        this.marquee = null; // { x1, y1, x2, y2 } in display coords

        this._resizeCanvases();
    }

    // ---- Canvas sizing ----
    _resizeCanvases() {
        const container = this.displayCanvas.parentElement;
        if (!container) return;

        const cw = container.clientWidth;
        const ch = container.clientHeight;

        // Canvas covers container at device pixel ratio
        const dpr = window.devicePixelRatio || 1;
        this.displayCanvas.width = cw * dpr;
        this.displayCanvas.height = ch * dpr;
        this.displayCanvas.style.width = cw + 'px';
        this.displayCanvas.style.height = ch + 'px';

        this.interactionCanvas.width = cw * dpr;
        this.interactionCanvas.height = ch * dpr;
        this.interactionCanvas.style.width = cw + 'px';
        this.interactionCanvas.style.height = ch + 'px';

        this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        this.ictx.setTransform(dpr, 0, 0, dpr, 0, 0);

        this.containerWidth = cw;
        this.containerHeight = ch;
    }

    resize() {
        this._resizeCanvases();
        this.render();
    }

    // ---- Coordinate transforms ----
    // Screen (CSS px in container) → Display (element coordinates)
    screenToDisplay(sx, sy) {
        const ox = (this.containerWidth - this.displayWidth * this.zoom) / 2 + this.panX;
        const oy = (this.containerHeight - this.displayHeight * this.zoom) / 2 + this.panY;
        return {
            x: (sx - ox) / this.zoom,
            y: (sy - oy) / this.zoom,
        };
    }

    displayToScreen(dx, dy) {
        const ox = (this.containerWidth - this.displayWidth * this.zoom) / 2 + this.panX;
        const oy = (this.containerHeight - this.displayHeight * this.zoom) / 2 + this.panY;
        return {
            x: dx * this.zoom + ox,
            y: dy * this.zoom + oy,
        };
    }

    snapValue(v) {
        if (!this.snapToGrid) return Math.round(v);
        return Math.round(v / this.gridSize) * this.gridSize;
    }

    // ---- Hit testing ----
    hitTest(sx, sy) {
        const { x, y } = this.screenToDisplay(sx, sy);
        // Check elements from top (last) to bottom (first)
        for (let i = this.elements.length - 1; i >= 0; i--) {
            const el = this.elements[i];
            if (!el.visible) continue;
            const p = el.props;
            if (x >= p.x && x <= p.x + p.w && y >= p.y && y <= p.y + p.h) {
                return el.id;
            }
        }
        return null;
    }

    // Test if screen point is on a resize handle of the selected element
    // Only works when exactly one element is selected
    hitTestHandle(sx, sy) {
        if (this.selectedIds.size !== 1) return null;
        const selId = [...this.selectedIds][0];
        const el = this.elements.find(e => e.id === selId);
        if (!el) return null;

        const p = el.props;
        const handles = this._getHandles(p);
        const { x, y } = this.screenToDisplay(sx, sy);
        const hr = 5 / this.zoom; // handle radius in display coords

        for (const [name, hx, hy] of handles) {
            if (Math.abs(x - hx) <= hr && Math.abs(y - hy) <= hr) {
                return name;
            }
        }
        return null;
    }

    _getHandles(p) {
        return [
            ['nw', p.x, p.y],
            ['ne', p.x + p.w, p.y],
            ['sw', p.x, p.y + p.h],
            ['se', p.x + p.w, p.y + p.h],
            ['n', p.x + p.w / 2, p.y],
            ['s', p.x + p.w / 2, p.y + p.h],
            ['w', p.x, p.y + p.h / 2],
            ['e', p.x + p.w, p.y + p.h / 2],
        ];
    }

    // ---- Rendering ----
    render() {
        const ctx = this.ctx;
        const cw = this.containerWidth;
        const ch = this.containerHeight;

        // Clear
        ctx.clearRect(0, 0, cw, ch);

        // Display origin (centered with pan)
        const ox = (cw - this.displayWidth * this.zoom) / 2 + this.panX;
        const oy = (ch - this.displayHeight * this.zoom) / 2 + this.panY;

        ctx.save();
        ctx.translate(ox, oy);
        ctx.scale(this.zoom, this.zoom);

        // ---- Display background ----
        ctx.fillStyle = this.bgColor;
        if (this.cornerRadius > 0) {
            roundedRectPath(ctx, 0, 0, this.displayWidth, this.displayHeight, this.cornerRadius);
            ctx.fill();
        } else {
            ctx.fillRect(0, 0, this.displayWidth, this.displayHeight);
        }

        // Clip to display bounds (with corner radius)
        ctx.save();
        if (this.cornerRadius > 0) {
            roundedRectPath(ctx, 0, 0, this.displayWidth, this.displayHeight, this.cornerRadius);
            ctx.clip();
        } else {
            ctx.beginPath();
            ctx.rect(0, 0, this.displayWidth, this.displayHeight);
            ctx.clip();
        }

        // ---- Grid ----
        if (this.showGrid) {
            ctx.strokeStyle = 'rgba(255,255,255,0.06)';
            ctx.lineWidth = 0.5 / this.zoom;
            ctx.beginPath();
            for (let gx = this.gridSize; gx < this.displayWidth; gx += this.gridSize) {
                ctx.moveTo(gx, 0);
                ctx.lineTo(gx, this.displayHeight);
            }
            for (let gy = this.gridSize; gy < this.displayHeight; gy += this.gridSize) {
                ctx.moveTo(0, gy);
                ctx.lineTo(this.displayWidth, gy);
            }
            ctx.stroke();
        }

        // ---- Elements ----
        for (const el of this.elements) {
            if (!el.visible) continue;
            const typeDef = LCARSElementTypes[el.type];
            if (!typeDef) continue;
            ctx.save();
            typeDef.render(ctx, el.props);
            ctx.restore();
        }

        ctx.restore(); // clip

        // ---- Display border (thin outline) ----
        ctx.strokeStyle = 'rgba(255,255,255,0.15)';
        ctx.lineWidth = 1 / this.zoom;
        if (this.cornerRadius > 0) {
            roundedRectPath(ctx, 0, 0, this.displayWidth, this.displayHeight, this.cornerRadius);
            ctx.stroke();
        } else {
            ctx.strokeRect(0, 0, this.displayWidth, this.displayHeight);
        }

        ctx.restore(); // translate+scale

        // ---- Interaction overlay (selection, hover) ----
        this._renderInteraction();
    }

    _renderInteraction() {
        const ictx = this.ictx;
        const cw = this.containerWidth;
        const ch = this.containerHeight;
        ictx.clearRect(0, 0, cw, ch);

        const ox = (cw - this.displayWidth * this.zoom) / 2 + this.panX;
        const oy = (ch - this.displayHeight * this.zoom) / 2 + this.panY;

        // Hover highlight
        if (this.hoveredId && !this.selectedIds.has(this.hoveredId)) {
            const el = this.elements.find(e => e.id === this.hoveredId);
            if (el && el.visible) {
                const p = el.props;
                ictx.strokeStyle = 'rgba(255, 153, 0, 0.4)';
                ictx.lineWidth = 1;
                ictx.strokeRect(
                    ox + p.x * this.zoom,
                    oy + p.y * this.zoom,
                    p.w * this.zoom,
                    p.h * this.zoom
                );
            }
        }

        // Selection
        for (const selId of this.selectedIds) {
            const el = this.elements.find(e => e.id === selId);
            if (!el || !el.visible) continue;
            const p = el.props;
            const sx = ox + p.x * this.zoom;
            const sy = oy + p.y * this.zoom;
            const sw = p.w * this.zoom;
            const sh = p.h * this.zoom;

            // Selection rect
            ictx.strokeStyle = '#FF9900';
            ictx.lineWidth = 1.5;
            ictx.setLineDash([4, 3]);
            ictx.strokeRect(sx, sy, sw, sh);
            ictx.setLineDash([]);

            // Resize handles only when exactly 1 selected
            if (this.selectedIds.size === 1) {
                const handles = this._getHandles(p);
                const hs = 5;
                ictx.fillStyle = '#FF9900';
                ictx.strokeStyle = '#000';
                ictx.lineWidth = 1;
                for (const [name, hx, hy] of handles) {
                    const hsx = ox + hx * this.zoom;
                    const hsy = oy + hy * this.zoom;
                    ictx.fillRect(hsx - hs, hsy - hs, hs * 2, hs * 2);
                    ictx.strokeRect(hsx - hs, hsy - hs, hs * 2, hs * 2);
                }
            }
        }

        // Marquee rectangle
        if (this.marquee) {
            const m = this.marquee;
            const mx = ox + Math.min(m.x1, m.x2) * this.zoom;
            const my = oy + Math.min(m.y1, m.y2) * this.zoom;
            const mw = Math.abs(m.x2 - m.x1) * this.zoom;
            const mh = Math.abs(m.y2 - m.y1) * this.zoom;
            ictx.fillStyle = 'rgba(255, 153, 0, 0.08)';
            ictx.fillRect(mx, my, mw, mh);
            ictx.strokeStyle = 'rgba(255, 153, 0, 0.6)';
            ictx.lineWidth = 1;
            ictx.setLineDash([4, 3]);
            ictx.strokeRect(mx, my, mw, mh);
            ictx.setLineDash([]);
        }
    }

    // ---- Thumbnail rendering (for palette) ----
    renderThumbnail(canvas, typeId) {
        const typeDef = LCARSElementTypes[typeId];
        if (!typeDef) return;

        const ctx = canvas.getContext('2d');
        const dpr = window.devicePixelRatio || 1;
        const w = canvas.clientWidth || 56;
        const h = canvas.clientHeight || 36;
        canvas.width = w * dpr;
        canvas.height = h * dpr;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

        // Dark background
        ctx.fillStyle = '#111';
        ctx.fillRect(0, 0, w, h);

        // Scale element to fit with padding
        const dp = typeDef.defaultProps;
        const pad = 4;
        const scaleX = (w - pad * 2) / dp.w;
        const scaleY = (h - pad * 2) / dp.h;
        const scale = Math.min(scaleX, scaleY);

        ctx.save();
        ctx.translate(pad + (w - pad * 2 - dp.w * scale) / 2,
                      pad + (h - pad * 2 - dp.h * scale) / 2);
        ctx.scale(scale, scale);

        const thumbProps = { ...dp, x: 0, y: 0 };
        typeDef.render(ctx, thumbProps);
        ctx.restore();
    }
}
