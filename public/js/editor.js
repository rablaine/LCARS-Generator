/* ============================================
   Editor — handles user interaction:
   drag-to-place, selection, move, resize,
   property editing, undo/redo, layers, etc.
   ============================================ */

class Editor {
    constructor(renderer) {
        this.renderer = renderer;
        this.nextId = 1;

        // Undo/Redo
        this.undoStack = [];
        this.redoStack = [];
        this.maxUndo = 50;

        // Interaction state
        this.mode = 'idle'; // idle | dragging-new | moving | resizing | panning | marquee
        this.dragData = null;

        // Currently active color (for quick-applying to new elements)
        this.activeColor = null;

        // Read-only mode (view-only or tab-locked)
        this.readOnly = false;

        this._bindEvents();
    }

    // ───── Element CRUD ─────

    addElement(typeId, x, y) {
        if (this.readOnly) return null;
        const typeDef = LCARSElementTypes[typeId];
        if (!typeDef) return null;

        const props = { ...typeDef.defaultProps };
        props.x = this.renderer.snapValue(x != null ? x : 10);
        props.y = this.renderer.snapValue(y != null ? y : 10);

        // If user has an active palette color, apply it
        if (this.activeColor && props.color !== undefined) {
            props.color = this.activeColor;
        }

        const el = {
            id: this.nextId++,
            type: typeId,
            name: typeDef.name + ' ' + (this.nextId - 1),
            props: props,
            visible: true,
            locked: false,
        };

        this._pushUndo();
        this.renderer.elements.push(el);
        this.selectElement(el.id);
        this.renderer.render();
        return el;
    }

    deleteElement(id) {
        const idx = this.renderer.elements.findIndex(e => e.id === id);
        if (idx < 0) return;
        this._pushUndo();
        this.renderer.elements.splice(idx, 1);
        this.renderer.selectedIds.delete(id);
        this.renderer.render();
        this._notifyChange();
    }

    deleteSelected() {
        const ids = [...this.renderer.selectedIds];
        if (ids.length === 0) return;
        this._pushUndo();
        for (const id of ids) {
            const idx = this.renderer.elements.findIndex(e => e.id === id);
            if (idx >= 0) this.renderer.elements.splice(idx, 1);
        }
        this.renderer.selectedIds.clear();
        this.renderer.render();
        this._notifyChange();
        this._notifySelectionChange();
    }

    duplicateElement(id) {
        const el = this.renderer.elements.find(e => e.id === id);
        if (!el) return;
        this._pushUndo();
        const newEl = {
            id: this.nextId++,
            type: el.type,
            name: el.name + ' copy',
            props: JSON.parse(JSON.stringify(el.props)),
            visible: true,
            locked: false,
        };
        newEl.props.x += 10;
        newEl.props.y += 10;
        this.renderer.elements.push(newEl);
        this.selectOnly(newEl.id);
        this.renderer.render();
        this._notifyChange();
    }

    duplicateSelected() {
        const ids = [...this.renderer.selectedIds];
        if (ids.length === 0) return;
        this._pushUndo();
        const newIds = [];
        for (const id of ids) {
            const el = this.renderer.elements.find(e => e.id === id);
            if (!el) continue;
            const newEl = {
                id: this.nextId++,
                type: el.type,
                name: el.name + ' copy',
                props: JSON.parse(JSON.stringify(el.props)),
                visible: true,
                locked: false,
            };
            newEl.props.x += 10;
            newEl.props.y += 10;
            this.renderer.elements.push(newEl);
            newIds.push(newEl.id);
        }
        this.renderer.selectedIds = new Set(newIds);
        this.renderer.render();
        this._notifyChange();
        this._notifySelectionChange();
    }

    updateElementProp(id, key, value) {
        const el = this.renderer.elements.find(e => e.id === id);
        if (!el) return;
        this._pushUndo();
        el.props[key] = value;
        this.renderer.render();
        this._notifyChange();
    }

    bringToFront(id) {
        const idx = this.renderer.elements.findIndex(e => e.id === id);
        if (idx < 0) return;
        this._pushUndo();
        const [el] = this.renderer.elements.splice(idx, 1);
        this.renderer.elements.push(el);
        this.renderer.render();
        this._notifyChange();
    }

    sendToBack(id) {
        const idx = this.renderer.elements.findIndex(e => e.id === id);
        if (idx < 0) return;
        this._pushUndo();
        const [el] = this.renderer.elements.splice(idx, 1);
        this.renderer.elements.unshift(el);
        this.renderer.render();
        this._notifyChange();
    }

    selectOnly(id) {
        this.renderer.selectedIds.clear();
        if (id != null) this.renderer.selectedIds.add(id);
        this.renderer.render();
        this._notifySelectionChange();
    }

    selectElement(id) {
        // Legacy compat — selects one, clears others
        this.selectOnly(id);
    }

    toggleSelect(id) {
        if (this.renderer.selectedIds.has(id)) {
            this.renderer.selectedIds.delete(id);
        } else {
            this.renderer.selectedIds.add(id);
        }
        this.renderer.render();
        this._notifySelectionChange();
    }

    selectAll() {
        this.renderer.selectedIds = new Set(this.renderer.elements.filter(e => e.visible && !e.locked).map(e => e.id));
        this.renderer.render();
        this._notifySelectionChange();
    }

    getSelectedElement() {
        if (this.renderer.selectedIds.size !== 1) return null;
        const id = [...this.renderer.selectedIds][0];
        return this.renderer.elements.find(e => e.id === id) || null;
    }

    getSelectedElements() {
        return this.renderer.elements.filter(e => this.renderer.selectedIds.has(e.id));
    }

    // ───── Undo / Redo ─────

    _pushUndo() {
        const snapshot = JSON.stringify(this.renderer.elements);
        this.undoStack.push(snapshot);
        if (this.undoStack.length > this.maxUndo) this.undoStack.shift();
        this.redoStack = [];
    }

    undo() {
        if (this.undoStack.length === 0) return;
        const redoSnapshot = JSON.stringify(this.renderer.elements);
        this.redoStack.push(redoSnapshot);
        const snapshot = this.undoStack.pop();
        this.renderer.elements = JSON.parse(snapshot);
        this.renderer.selectedIds.clear();
        this.renderer.render();
        this._notifyChange();
        this._notifySelectionChange();
    }

    redo() {
        if (this.redoStack.length === 0) return;
        const undoSnapshot = JSON.stringify(this.renderer.elements);
        this.undoStack.push(undoSnapshot);
        const snapshot = this.redoStack.pop();
        this.renderer.elements = JSON.parse(snapshot);
        this.renderer.selectedIds.clear();
        this.renderer.render();
        this._notifyChange();
        this._notifySelectionChange();
    }

    // ───── Serialization ─────

    getLayout() {
        return {
            display: {
                width: this.renderer.displayWidth,
                height: this.renderer.displayHeight,
                cornerRadius: this.renderer.cornerRadius,
                bgColor: this.renderer.bgColor,
            },
            elements: this.renderer.elements.map(el => ({
                id: el.id,
                type: el.type,
                name: el.name,
                props: { ...el.props },
                visible: el.visible,
                locked: el.locked,
            })),
        };
    }

    loadLayout(data) {
        this._pushUndo();
        this.renderer.displayWidth = data.display.width;
        this.renderer.displayHeight = data.display.height;
        this.renderer.cornerRadius = data.display.cornerRadius;
        this.renderer.bgColor = data.display.bgColor;
        this.renderer.elements = data.elements.map(el => ({ ...el, props: { ...el.props } }));
        this.nextId = Math.max(...this.renderer.elements.map(e => e.id), 0) + 1;
        this.renderer.selectedIds.clear();
        this.renderer.render();
        this._notifyChange();
        this._notifySelectionChange();
        this._notifyDisplayChange();
    }

    clearAll() {
        this._pushUndo();
        this.renderer.elements = [];
        this.renderer.selectedIds.clear();
        this.nextId = 1;
        this.renderer.render();
        this._notifyChange();
        this._notifySelectionChange();
    }

    // ───── Event callbacks (set by App) ─────
    onChange = null;           // elements changed
    onSelectionChange = null;  // selection changed
    onDisplayChange = null;    // display settings changed

    _notifyChange() { if (this.onChange) this.onChange(); }
    _notifySelectionChange() { if (this.onSelectionChange) this.onSelectionChange(); }
    _notifyDisplayChange() { if (this.onDisplayChange) this.onDisplayChange(); }

    // ───── Mouse/Keyboard interaction ─────

    _bindEvents() {
        const ic = this.renderer.interactionCanvas;

        ic.addEventListener('mousedown', e => this._onMouseDown(e));
        ic.addEventListener('mousemove', e => this._onMouseMove(e));
        ic.addEventListener('mouseup', e => this._onMouseUp(e));
        ic.addEventListener('mouseleave', e => this._onMouseUp(e));
        ic.addEventListener('wheel', e => this._onWheel(e), { passive: false });
        ic.addEventListener('dblclick', e => this._onDblClick(e));

        // Keyboard
        document.addEventListener('keydown', e => this._onKeyDown(e));

        // Prevent context menu on canvas
        ic.addEventListener('contextmenu', e => e.preventDefault());
    }

    _getCanvasPos(e) {
        const rect = this.renderer.interactionCanvas.getBoundingClientRect();
        return { x: e.clientX - rect.left, y: e.clientY - rect.top };
    }

    _onMouseDown(e) {
        const pos = this._getCanvasPos(e);

        // Right-click or middle-click: pan
        if (e.button === 1 || e.button === 2) {
            this.mode = 'panning';
            this.dragData = { startX: e.clientX, startY: e.clientY, startPanX: this.renderer.panX, startPanY: this.renderer.panY };
            return;
        }

        // Alt+click: pan
        if (e.altKey) {
            this.mode = 'panning';
            this.dragData = { startX: e.clientX, startY: e.clientY, startPanX: this.renderer.panX, startPanY: this.renderer.panY };
            return;
        }

        // Read-only: allow selection for inspection but no move/resize
        if (this.readOnly) {
            const hitId = this.renderer.hitTest(pos.x, pos.y);
            if (hitId) {
                if (e.shiftKey || e.ctrlKey) {
                    this.toggleSelect(hitId);
                } else {
                    this.selectOnly(hitId);
                }
            } else {
                this.selectOnly(null);
            }
            return;
        }

        // Check resize handle first (only when 1 selected)
        const handle = this.renderer.hitTestHandle(pos.x, pos.y);
        if (handle) {
            const sel = this.getSelectedElement();
            if (sel && !sel.locked) {
                this.mode = 'resizing';
                this.dragData = {
                    handle,
                    startX: pos.x,
                    startY: pos.y,
                    origProps: { ...sel.props },
                };
                this._pushUndo();
                return;
            }
        }

        // Hit test elements
        const hitId = this.renderer.hitTest(pos.x, pos.y);
        if (hitId) {
            const el = this.renderer.elements.find(e => e.id === hitId);

            if (e.shiftKey || e.ctrlKey) {
                // Toggle selection
                this.toggleSelect(hitId);
            } else if (!this.renderer.selectedIds.has(hitId)) {
                // Click on unselected element — select only it
                this.selectOnly(hitId);
            }
            // If clicking on already-selected element without modifier, keep multi-selection

            // Start moving all selected (non-locked) elements
            const selected = this.getSelectedElements().filter(e => !e.locked);
            if (selected.length > 0) {
                const dp = this.renderer.screenToDisplay(pos.x, pos.y);
                this.mode = 'moving';
                this.dragData = {
                    startDisplayX: dp.x,
                    startDisplayY: dp.y,
                    origPositions: selected.map(el => ({ id: el.id, x: el.props.x, y: el.props.y })),
                };
                this._pushUndo();
            }
        } else {
            if (e.shiftKey || e.ctrlKey) {
                // Shift+click on empty: start marquee additive
                const dp = this.renderer.screenToDisplay(pos.x, pos.y);
                this.mode = 'marquee';
                this.dragData = {
                    startX: dp.x,
                    startY: dp.y,
                    additive: true,
                    priorSelection: new Set(this.renderer.selectedIds),
                };
                this.renderer.marquee = { x1: dp.x, y1: dp.y, x2: dp.x, y2: dp.y };
            } else {
                // Click on empty: deselect all, start marquee
                this.selectOnly(null);
                const dp = this.renderer.screenToDisplay(pos.x, pos.y);
                this.mode = 'marquee';
                this.dragData = {
                    startX: dp.x,
                    startY: dp.y,
                    additive: false,
                    priorSelection: new Set(),
                };
                this.renderer.marquee = { x1: dp.x, y1: dp.y, x2: dp.x, y2: dp.y };
            }
        }
    }

    _onMouseMove(e) {
        const pos = this._getCanvasPos(e);

        if (this.mode === 'panning') {
            this.renderer.panX = this.dragData.startPanX + (e.clientX - this.dragData.startX);
            this.renderer.panY = this.dragData.startPanY + (e.clientY - this.dragData.startY);
            this.renderer.render();
            return;
        }

        if (this.mode === 'moving') {
            const dp = this.renderer.screenToDisplay(pos.x, pos.y);
            const dx = dp.x - this.dragData.startDisplayX;
            const dy = dp.y - this.dragData.startDisplayY;
            for (const orig of this.dragData.origPositions) {
                const el = this.renderer.elements.find(e => e.id === orig.id);
                if (!el) continue;
                el.props.x = this.renderer.snapValue(orig.x + dx);
                el.props.y = this.renderer.snapValue(orig.y + dy);
            }
            this.renderer.render();
            this._notifySelectionChange();
            return;
        }

        if (this.mode === 'resizing') {
            const el = this.getSelectedElement();
            if (!el) return;
            const dp = this.renderer.screenToDisplay(pos.x, pos.y);
            const startDp = this.renderer.screenToDisplay(this.dragData.startX, this.dragData.startY);
            const dx = dp.x - startDp.x;
            const dy = dp.y - startDp.y;
            const orig = this.dragData.origProps;
            const h = this.dragData.handle;

            let nx = orig.x, ny = orig.y, nw = orig.w, nh = orig.h;

            if (h.includes('e')) { nw = orig.w + dx; }
            if (h.includes('w')) { nx = orig.x + dx; nw = orig.w - dx; }
            if (h.includes('s')) { nh = orig.h + dy; }
            if (h.includes('n')) { ny = orig.y + dy; nh = orig.h - dy; }

            // Enforce minimum size
            if (nw < 4) { nw = 4; if (h.includes('w')) nx = orig.x + orig.w - 4; }
            if (nh < 4) { nh = 4; if (h.includes('n')) ny = orig.y + orig.h - 4; }

            el.props.x = this.renderer.snapValue(nx);
            el.props.y = this.renderer.snapValue(ny);
            el.props.w = this.renderer.snapValue(nw);
            el.props.h = this.renderer.snapValue(nh);
            this.renderer.render();
            this._notifySelectionChange();
            return;
        }

        if (this.mode === 'marquee') {
            const dp = this.renderer.screenToDisplay(pos.x, pos.y);
            this.renderer.marquee = {
                x1: this.dragData.startX,
                y1: this.dragData.startY,
                x2: dp.x,
                y2: dp.y,
            };

            // Compute which elements are inside the marquee rect
            const mx1 = Math.min(this.dragData.startX, dp.x);
            const my1 = Math.min(this.dragData.startY, dp.y);
            const mx2 = Math.max(this.dragData.startX, dp.x);
            const my2 = Math.max(this.dragData.startY, dp.y);

            const newSel = new Set(this.dragData.additive ? this.dragData.priorSelection : []);
            for (const el of this.renderer.elements) {
                if (!el.visible) continue;
                const p = el.props;
                // Element intersects marquee if they overlap
                if (p.x + p.w > mx1 && p.x < mx2 && p.y + p.h > my1 && p.y < my2) {
                    newSel.add(el.id);
                }
            }
            this.renderer.selectedIds = newSel;
            this.renderer.render();
            this._notifySelectionChange();
            return;
        }

        // Idle — update hover & cursor
        const handle = this.renderer.hitTestHandle(pos.x, pos.y);
        if (handle) {
            const cursors = {
                nw: 'nw-resize', ne: 'ne-resize', sw: 'sw-resize', se: 'se-resize',
                n: 'n-resize', s: 's-resize', w: 'w-resize', e: 'e-resize',
            };
            this.renderer.interactionCanvas.style.cursor = cursors[handle] || 'crosshair';
        } else {
            const hitId = this.renderer.hitTest(pos.x, pos.y);
            this.renderer.interactionCanvas.style.cursor = hitId ? 'move' : 'crosshair';
            if (this.renderer.hoveredId !== hitId) {
                this.renderer.hoveredId = hitId;
                this.renderer.render();
            }
        }

        // Update mouse position display
        const dp = this.renderer.screenToDisplay(pos.x, pos.y);
        const mpEl = document.getElementById('mouse-pos');
        if (mpEl) {
            const dx = Math.round(dp.x);
            const dy = Math.round(dp.y);
            mpEl.textContent = `X: ${dx}  Y: ${dy}`;
        }
    }

    _onMouseUp(e) {
        if (this.mode === 'moving' || this.mode === 'resizing') {
            this._notifyChange();
        }
        if (this.mode === 'marquee') {
            this.renderer.marquee = null;
            this.renderer.render();
        }
        this.mode = 'idle';
        this.dragData = null;
    }

    _onWheel(e) {
        e.preventDefault();
        const delta = e.deltaY > 0 ? -0.15 : 0.15;
        const newZoom = Math.max(0.25, Math.min(10, this.renderer.zoom + delta * this.renderer.zoom));

        // Zoom toward cursor
        const pos = this._getCanvasPos(e);
        const dpBefore = this.renderer.screenToDisplay(pos.x, pos.y);
        this.renderer.zoom = newZoom;
        const dpAfter = this.renderer.screenToDisplay(pos.x, pos.y);
        this.renderer.panX += (dpAfter.x - dpBefore.x) * this.renderer.zoom;
        this.renderer.panY += (dpAfter.y - dpBefore.y) * this.renderer.zoom;

        this.renderer.render();

        // Update zoom display
        const zlEl = document.getElementById('zoom-level');
        if (zlEl) zlEl.textContent = Math.round(this.renderer.zoom * 100) + '%';
    }

    _onDblClick(e) {
        // Double-click could be used for inline text editing in the future
    }

    _onKeyDown(e) {
        // Don't capture if user is typing in an input
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') return;

        // Read-only: no editing shortcuts
        if (this.readOnly) return;

        const selected = this.getSelectedElements();

        if (e.key === 'Delete' || e.key === 'Backspace') {
            if (selected.length > 0) { this.deleteSelected(); e.preventDefault(); }
        }
        if (e.key === 'z' && (e.ctrlKey || e.metaKey) && !e.shiftKey) {
            this.undo(); e.preventDefault();
        }
        if ((e.key === 'y' && (e.ctrlKey || e.metaKey)) || (e.key === 'z' && (e.ctrlKey || e.metaKey) && e.shiftKey)) {
            this.redo(); e.preventDefault();
        }
        if (e.key === 'd' && (e.ctrlKey || e.metaKey)) {
            if (selected.length > 0) { this.duplicateSelected(); e.preventDefault(); }
        }
        if (e.key === 'a' && (e.ctrlKey || e.metaKey)) {
            this.selectAll(); e.preventDefault();
        }

        // Arrow key nudge — moves all selected
        if (selected.length > 0 && ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
            e.preventDefault();
            const step = e.shiftKey ? 10 : 1;
            this._pushUndo();
            for (const el of selected) {
                if (el.locked) continue;
                if (e.key === 'ArrowUp') el.props.y -= step;
                if (e.key === 'ArrowDown') el.props.y += step;
                if (e.key === 'ArrowLeft') el.props.x -= step;
                if (e.key === 'ArrowRight') el.props.x += step;
            }
            this.renderer.render();
            this._notifySelectionChange();
            this._notifyChange();
        }

        // Escape: deselect
        if (e.key === 'Escape') {
            this.selectOnly(null);
        }
    }

    // ───── Drag from palette ─────

    startDragFromPalette(typeId) {
        this._pendingDragType = typeId;
    }

    handleDropOnCanvas(e) {
        if (this.readOnly || !this._pendingDragType) return;
        const pos = this._getCanvasPos(e);
        const dp = this.renderer.screenToDisplay(pos.x, pos.y);
        const typeDef = LCARSElementTypes[this._pendingDragType];
        if (typeDef) {
            this.addElement(this._pendingDragType,
                dp.x - typeDef.defaultProps.w / 2,
                dp.y - typeDef.defaultProps.h / 2);
        }
        this._pendingDragType = null;
        this._notifyChange();
    }
}
