/* ============================================
   App — Main controller
   Wires together renderer, editor, UI panels,
   palette, properties, layers, and export modal.
   ============================================ */

(function () {
    'use strict';

    // ───── Bootstrap ─────
    const displayCanvas = document.getElementById('lcars-canvas');
    const interactionCanvas = document.getElementById('interaction-canvas');
    const renderer = new CanvasRenderer(displayCanvas, interactionCanvas);
    const editor = new Editor(renderer);
    const exporter = new Exporter(renderer);

    // ───── App State ─────
    let isViewMode = false;
    let isTabLocked = false;
    let viewLayoutData = null;  // shared layout being viewed

    function setReadOnly(value) {
        editor.readOnly = value;
        document.getElementById('app').classList.toggle('app-readonly', value);
    }

    function triggerAutosave() {
        if (!isViewMode && !isTabLocked) {
            LCARSStorage.scheduleAutosave(() => editor.getLayout());
        }
    }

    // ───── LCARS Confirm Dialog ─────
    function lcarsConfirm({ title, message, buttons }) {
        return new Promise(resolve => {
            const modal = document.getElementById('lcars-confirm');
            const titleEl = document.getElementById('confirm-title');
            const msgEl = document.getElementById('confirm-message');
            const btnsEl = document.getElementById('confirm-buttons');

            titleEl.textContent = title;
            msgEl.textContent = message;
            btnsEl.innerHTML = '';

            for (const btn of buttons) {
                const b = document.createElement('button');
                b.className = 'toolbar-btn';
                if (btn.accent) b.classList.add('accent');
                if (btn.danger) b.classList.add('danger-btn');
                b.textContent = btn.label;
                b.addEventListener('click', () => {
                    modal.style.display = 'none';
                    resolve(btn.key);
                });
                btnsEl.appendChild(b);
            }

            modal.style.display = '';
        });
    }

    // ───── Element Palette ─────
    function buildPalette() {
        const container = document.getElementById('element-categories');
        container.innerHTML = '';
        const cats = getElementCategories();

        for (const [catName, items] of Object.entries(cats)) {
            const catDiv = document.createElement('div');
            catDiv.className = 'element-category';

            const title = document.createElement('div');
            title.className = 'element-category-title';
            title.textContent = catName.toUpperCase();
            title.addEventListener('click', () => {
                catDiv.classList.toggle('collapsed');
            });
            catDiv.appendChild(title);

            const itemsDiv = document.createElement('div');
            itemsDiv.className = 'element-items';

            for (const item of items) {
                const el = document.createElement('div');
                el.className = 'element-item';
                el.setAttribute('data-type', item.typeId);
                el.title = item.name;

                // Thumbnail
                const thumbDiv = document.createElement('div');
                thumbDiv.className = 'element-thumb';
                const thumbCanvas = document.createElement('canvas');
                thumbDiv.appendChild(thumbCanvas);
                el.appendChild(thumbDiv);

                const nameSpan = document.createElement('span');
                nameSpan.className = 'element-name';
                nameSpan.textContent = item.name.toUpperCase();
                el.appendChild(nameSpan);

                // Drag to place
                el.draggable = true;
                el.addEventListener('dragstart', (e) => {
                    e.dataTransfer.setData('text/plain', item.typeId);
                    el.classList.add('dragging');
                    editor.startDragFromPalette(item.typeId);
                });
                el.addEventListener('dragend', () => {
                    el.classList.remove('dragging');
                });

                // Click to add at center
                el.addEventListener('click', () => {
                    const cx = renderer.displayWidth / 2 - item.defaultProps.w / 2;
                    const cy = renderer.displayHeight / 2 - item.defaultProps.h / 2;
                    editor.addElement(item.typeId, cx, cy);
                    updateLayers();
                });

                itemsDiv.appendChild(el);

                // Render thumbnail after DOM insertion
                requestAnimationFrame(() => {
                    renderer.renderThumbnail(thumbCanvas, item.typeId);
                });
            }

            catDiv.appendChild(itemsDiv);
            container.appendChild(catDiv);
        }
    }

    // Canvas drop target
    interactionCanvas.addEventListener('dragover', e => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'copy';
    });
    interactionCanvas.addEventListener('drop', e => {
        e.preventDefault();
        editor.handleDropOnCanvas(e);
        updateLayers();
    });

    // ───── Color Swatches ─────
    function buildColorSwatches() {
        const container = document.getElementById('color-swatches');
        container.innerHTML = '';
        for (const c of LCARS_PALETTE) {
            const swatch = document.createElement('div');
            swatch.className = 'color-swatch';
            swatch.style.backgroundColor = c.hex;
            swatch.title = c.name + ' (' + c.hex + ')';
            swatch.addEventListener('click', () => {
                // Set active color
                editor.activeColor = c.hex;
                container.querySelectorAll('.color-swatch').forEach(s => s.classList.remove('active'));
                swatch.classList.add('active');

                // If element(s) selected, apply color to them
                const selected = editor.getSelectedElements();
                if (selected.length > 0) {
                    for (const el of selected) {
                        if (el.props.color !== undefined) {
                            editor.updateElementProp(el.id, 'color', c.hex);
                        }
                    }
                    updateProperties();
                }
            });
            container.appendChild(swatch);
        }
    }

    // ───── Properties Panel ─────
    function updateProperties() {
        const sel = editor.getSelectedElement(); // exactly 1
        const selected = editor.getSelectedElements(); // all
        const displaySettings = document.getElementById('display-settings');
        const elementProps = document.getElementById('element-properties');

        if (selected.length === 0) {
            displaySettings.style.display = '';
            elementProps.style.display = 'none';
            return;
        }

        if (selected.length > 1) {
            // Multi-select: show summary, hide individual props
            displaySettings.style.display = 'none';
            elementProps.style.display = '';
            document.getElementById('prop-fields').innerHTML =
                `<div style="color: var(--text-secondary); font-size: 14px; padding: 8px 0;">${selected.length} ELEMENTS SELECTED</div>`;
            document.getElementById('prop-x').value = '';
            document.getElementById('prop-y').value = '';
            document.getElementById('prop-w').value = '';
            document.getElementById('prop-h').value = '';
            document.getElementById('prop-x').disabled = true;
            document.getElementById('prop-y').disabled = true;
            document.getElementById('prop-w').disabled = true;
            document.getElementById('prop-h').disabled = true;
            return;
        }

        // Exactly 1 selected
        document.getElementById('prop-x').disabled = false;
        document.getElementById('prop-y').disabled = false;
        document.getElementById('prop-w').disabled = false;
        document.getElementById('prop-h').disabled = false;

        displaySettings.style.display = 'none';
        elementProps.style.display = '';

        // Position fields
        document.getElementById('prop-x').value = Math.round(sel.props.x);
        document.getElementById('prop-y').value = Math.round(sel.props.y);
        document.getElementById('prop-w').value = Math.round(sel.props.w);
        document.getElementById('prop-h').value = Math.round(sel.props.h);

        // Custom fields
        const fieldsDiv = document.getElementById('prop-fields');
        fieldsDiv.innerHTML = '';

        const typeDef = LCARSElementTypes[sel.type];
        if (!typeDef) return;
        const propDefs = typeDef.getProperties();

        for (const pd of propDefs) {
            if (pd.type === 'colorlist') {
                // Special handler for color arrays
                const row = document.createElement('div');
                row.className = 'prop-row';
                row.style.flexDirection = 'column';
                row.style.alignItems = 'flex-start';

                const label = document.createElement('label');
                label.textContent = pd.label;
                row.appendChild(label);

                const colorsDiv = document.createElement('div');
                colorsDiv.style.display = 'flex';
                colorsDiv.style.gap = '4px';
                colorsDiv.style.flexWrap = 'wrap';
                colorsDiv.style.marginTop = '4px';

                const colors = sel.props[pd.key] || [];
                colors.forEach((c, i) => {
                    const inp = document.createElement('input');
                    inp.type = 'color';
                    inp.value = c;
                    inp.style.width = '24px';
                    inp.style.height = '24px';
                    inp.addEventListener('input', () => {
                        const arr = [...sel.props[pd.key]];
                        arr[i] = inp.value.toUpperCase();
                        editor.updateElementProp(sel.id, pd.key, arr);
                    });
                    colorsDiv.appendChild(inp);
                });

                // Add button
                const addBtn = document.createElement('button');
                addBtn.textContent = '+';
                addBtn.className = 'prop-btn';
                addBtn.style.width = '24px';
                addBtn.style.height = '24px';
                addBtn.style.padding = '0';
                addBtn.addEventListener('click', () => {
                    const arr = [...sel.props[pd.key], LCARS_COLORS.ORANGE];
                    editor.updateElementProp(sel.id, pd.key, arr);
                    updateProperties();
                });
                colorsDiv.appendChild(addBtn);

                // Remove button
                if (colors.length > 1) {
                    const rmBtn = document.createElement('button');
                    rmBtn.textContent = '−';
                    rmBtn.className = 'prop-btn';
                    rmBtn.style.width = '24px';
                    rmBtn.style.height = '24px';
                    rmBtn.style.padding = '0';
                    rmBtn.addEventListener('click', () => {
                        const arr = [...sel.props[pd.key]];
                        arr.pop();
                        editor.updateElementProp(sel.id, pd.key, arr);
                        updateProperties();
                    });
                    colorsDiv.appendChild(rmBtn);
                }

                row.appendChild(colorsDiv);
                fieldsDiv.appendChild(row);
                continue;
            }

            if (pd.type === 'textlist') {
                // Special handler for string arrays (labels, lines, etc.)
                const row = document.createElement('div');
                row.className = 'prop-row';
                row.style.flexDirection = 'column';
                row.style.alignItems = 'flex-start';

                const label = document.createElement('label');
                label.textContent = pd.label;
                row.appendChild(label);

                const listDiv = document.createElement('div');
                listDiv.style.display = 'flex';
                listDiv.style.flexDirection = 'column';
                listDiv.style.gap = '3px';
                listDiv.style.marginTop = '4px';
                listDiv.style.width = '100%';

                const items = sel.props[pd.key] || [];
                items.forEach((item, i) => {
                    const itemRow = document.createElement('div');
                    itemRow.style.display = 'flex';
                    itemRow.style.gap = '3px';

                    const inp = document.createElement('input');
                    inp.type = 'text';
                    inp.value = item;
                    inp.style.flex = '1';
                    inp.style.minWidth = '0';
                    inp.addEventListener('input', () => {
                        const arr = [...sel.props[pd.key]];
                        arr[i] = inp.value;
                        editor.updateElementProp(sel.id, pd.key, arr);
                    });
                    itemRow.appendChild(inp);

                    const rmBtn = document.createElement('button');
                    rmBtn.textContent = '×';
                    rmBtn.className = 'prop-btn danger';
                    rmBtn.style.padding = '2px 6px';
                    rmBtn.style.flexShrink = '0';
                    rmBtn.addEventListener('click', () => {
                        const arr = [...sel.props[pd.key]];
                        arr.splice(i, 1);
                        editor.updateElementProp(sel.id, pd.key, arr);
                        updateProperties();
                    });
                    itemRow.appendChild(rmBtn);

                    listDiv.appendChild(itemRow);
                });

                const addBtn = document.createElement('button');
                addBtn.textContent = '+ ADD';
                addBtn.className = 'prop-btn';
                addBtn.style.alignSelf = 'flex-start';
                addBtn.addEventListener('click', () => {
                    const arr = [...sel.props[pd.key], 'ITEM'];
                    editor.updateElementProp(sel.id, pd.key, arr);
                    updateProperties();
                });
                listDiv.appendChild(addBtn);

                row.appendChild(listDiv);
                fieldsDiv.appendChild(row);
                continue;
            }

            const row = document.createElement('div');
            row.className = 'prop-row';

            const label = document.createElement('label');
            label.textContent = pd.label;
            row.appendChild(label);

            if (pd.type === 'color') {
                const inp = document.createElement('input');
                inp.type = 'color';
                inp.value = sel.props[pd.key] || '#000000';
                inp.addEventListener('input', () => {
                    editor.updateElementProp(sel.id, pd.key, inp.value.toUpperCase());
                });
                row.appendChild(inp);
            } else if (pd.type === 'number') {
                const inp = document.createElement('input');
                inp.type = 'number';
                inp.value = sel.props[pd.key];
                if (pd.min !== undefined) inp.min = pd.min;
                if (pd.max !== undefined) inp.max = pd.max;
                inp.addEventListener('input', () => {
                    editor.updateElementProp(sel.id, pd.key, parseFloat(inp.value) || 0);
                });
                row.appendChild(inp);
            } else if (pd.type === 'text') {
                const inp = document.createElement('input');
                inp.type = 'text';
                inp.value = sel.props[pd.key];
                inp.addEventListener('input', () => {
                    editor.updateElementProp(sel.id, pd.key, inp.value);
                });
                row.appendChild(inp);
            } else if (pd.type === 'select') {
                const sel2 = document.createElement('select');
                for (const opt of pd.options) {
                    const o = document.createElement('option');
                    o.value = opt;
                    o.textContent = opt;
                    if (sel.props[pd.key] === opt) o.selected = true;
                    sel2.appendChild(o);
                }
                sel2.addEventListener('change', () => {
                    editor.updateElementProp(sel.id, pd.key, sel2.value);
                });
                row.appendChild(sel2);
            } else if (pd.type === 'checkbox') {
                const inp = document.createElement('input');
                inp.type = 'checkbox';
                inp.checked = !!sel.props[pd.key];
                inp.addEventListener('change', () => {
                    editor.updateElementProp(sel.id, pd.key, inp.checked);
                });
                row.appendChild(inp);
            }

            fieldsDiv.appendChild(row);
        }
    }

    // Position property inputs
    ['prop-x', 'prop-y', 'prop-w', 'prop-h'].forEach(id => {
        const inp = document.getElementById(id);
        inp.addEventListener('input', () => {
            const sel = editor.getSelectedElement();
            if (!sel) return;
            const key = { 'prop-x': 'x', 'prop-y': 'y', 'prop-w': 'w', 'prop-h': 'h' }[id];
            editor.updateElementProp(sel.id, key, parseFloat(inp.value) || 0);
        });
    });

    // Element action buttons
    document.getElementById('btn-duplicate').addEventListener('click', () => {
        const selected = editor.getSelectedElements();
        if (selected.length > 0) { editor.duplicateSelected(); updateLayers(); }
    });
    document.getElementById('btn-delete').addEventListener('click', () => {
        const selected = editor.getSelectedElements();
        if (selected.length > 0) { editor.deleteSelected(); updateLayers(); }
    });
    document.getElementById('btn-to-front').addEventListener('click', () => {
        const sel = editor.getSelectedElement();
        if (sel) { editor.bringToFront(sel.id); updateLayers(); }
    });
    document.getElementById('btn-to-back').addEventListener('click', () => {
        const sel = editor.getSelectedElement();
        if (sel) { editor.sendToBack(sel.id); updateLayers(); }
    });

    // ───── Display Settings ─────
    function syncDisplaySettings() {
        document.getElementById('display-width').value = renderer.displayWidth;
        document.getElementById('display-height').value = renderer.displayHeight;
        document.getElementById('display-corner-radius').value = renderer.cornerRadius;
        document.getElementById('display-bg-color').value = renderer.bgColor;
        document.getElementById('show-grid').checked = renderer.showGrid;
        document.getElementById('grid-size').value = renderer.gridSize;
        document.getElementById('snap-grid').checked = renderer.snapToGrid;
        document.getElementById('canvas-size').textContent = `${renderer.displayWidth} × ${renderer.displayHeight}`;
    }

    document.getElementById('display-width').addEventListener('input', function () {
        renderer.displayWidth = parseInt(this.value) || 280;
        document.getElementById('canvas-size').textContent = `${renderer.displayWidth} × ${renderer.displayHeight}`;
        renderer.render();
        triggerAutosave();
    });
    document.getElementById('display-height').addEventListener('input', function () {
        renderer.displayHeight = parseInt(this.value) || 240;
        document.getElementById('canvas-size').textContent = `${renderer.displayWidth} × ${renderer.displayHeight}`;
        renderer.render();
        triggerAutosave();
    });
    document.getElementById('display-corner-radius').addEventListener('input', function () {
        renderer.cornerRadius = parseInt(this.value) || 0;
        renderer.render();
        triggerAutosave();
    });
    document.getElementById('display-bg-color').addEventListener('input', function () {
        renderer.bgColor = this.value;
        renderer.render();
        triggerAutosave();
    });
    document.getElementById('show-grid').addEventListener('change', function () {
        renderer.showGrid = this.checked;
        renderer.render();
    });
    document.getElementById('grid-size').addEventListener('input', function () {
        renderer.gridSize = parseInt(this.value) || 10;
        renderer.render();
    });
    document.getElementById('snap-grid').addEventListener('change', function () {
        renderer.snapToGrid = this.checked;
    });

    // ───── Layers Panel ─────
    function updateLayers() {
        const list = document.getElementById('layers-list');
        list.innerHTML = '';

        // Show in reverse order (top element last in array, first in list)
        const els = [...renderer.elements].reverse();

        for (const el of els) {
            const item = document.createElement('div');
            item.className = 'layer-item' + (renderer.selectedIds.has(el.id) ? ' selected' : '');

            const dot = document.createElement('span');
            dot.className = 'layer-color-dot';
            dot.style.backgroundColor = el.props.color || LCARS_COLORS.GREY;
            item.appendChild(dot);

            const name = document.createElement('span');
            name.className = 'layer-name';
            name.textContent = el.name;
            item.appendChild(name);

            const vis = document.createElement('span');
            vis.className = 'layer-visibility';
            vis.textContent = el.visible ? '👁' : '—';
            vis.addEventListener('click', (e) => {
                e.stopPropagation();
                el.visible = !el.visible;
                renderer.render();
                updateLayers();
            });
            item.appendChild(vis);

            item.addEventListener('click', (e) => {
                if (e.shiftKey || e.ctrlKey) {
                    editor.toggleSelect(el.id);
                } else {
                    editor.selectOnly(el.id);
                }
                updateLayers();
            });

            list.appendChild(item);
        }
    }

    // ───── Toolbar ─────
    document.getElementById('btn-new').addEventListener('click', async () => {
        if (renderer.elements.length > 0 || LCARSStorage.hasAutosave()) {
            const result = await lcarsConfirm({
                title: 'NEW LAYOUT',
                message: 'This will clear all elements and your autosaved data. Continue?',
                buttons: [
                    { key: 'yes', label: 'CLEAR ALL', danger: true },
                    { key: 'cancel', label: 'CANCEL' },
                ]
            });
            if (result !== 'yes') return;
        }
        editor.clearAll();
        LCARSStorage.clearAutosave();
        updateLayers();
    });

    document.getElementById('btn-save').addEventListener('click', () => {
        const layout = editor.getLayout();
        const json = JSON.stringify(layout, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'lcars-layout.json';
        a.click();
        URL.revokeObjectURL(url);
    });

    // ───── Share ─────
    function generateOGThumbnail(layout) {
        // Render the layout to a 600x315 canvas (half OG Size, scaled up by scrapers)
        const ogW = 600, ogH = 315;
        const offscreen = document.createElement('canvas');
        offscreen.width = ogW;
        offscreen.height = ogH;
        const ctx = offscreen.getContext('2d');

        const dw = layout.display.width;
        const dh = layout.display.height;

        // Center the layout within the OG frame with padding
        const pad = 20;
        const availW = ogW - pad * 2;
        const availH = ogH - pad * 2;
        const scale = Math.min(availW / dw, availH / dh);
        const scaledW = dw * scale;
        const scaledH = dh * scale;
        const offsetX = (ogW - scaledW) / 2;
        const offsetY = (ogH - scaledH) / 2;

        // Dark background
        ctx.fillStyle = '#0A0A1A';
        ctx.fillRect(0, 0, ogW, ogH);

        // Translate and scale to draw the layout centered
        ctx.save();
        ctx.translate(offsetX, offsetY);
        ctx.scale(scale, scale);

        // Layout background
        ctx.fillStyle = layout.display.bgColor || '#000000';
        if (layout.display.cornerRadius > 0) {
            roundedRectPath(ctx, 0, 0, dw, dh, layout.display.cornerRadius);
            ctx.fill();
            ctx.save();
            roundedRectPath(ctx, 0, 0, dw, dh, layout.display.cornerRadius);
            ctx.clip();
        } else {
            ctx.fillRect(0, 0, dw, dh);
            ctx.save();
        }

        // Draw elements
        for (const el of layout.elements) {
            if (el.visible === false) continue;
            const typeDef = LCARSElementTypes[el.type];
            if (typeDef && typeDef.render) {
                ctx.save();
                try { typeDef.render(ctx, el.props); } catch (e) { /* skip */ }
                ctx.restore();
            }
        }
        ctx.restore(); // clip
        ctx.restore(); // translate+scale

        return offscreen.toDataURL('image/jpeg', 0.85);
    }

    document.getElementById('btn-share').addEventListener('click', async () => {
        const layout = editor.getLayout();
        if (!layout.elements.length) {
            alert('Nothing to share — add some elements first.');
            return;
        }
        const btn = document.getElementById('btn-share');
        btn.textContent = '...';
        btn.disabled = true;
        try {
            // Generate OG thumbnail
            const thumbnail = generateOGThumbnail(layout);

            const res = await fetch('/api/layouts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...layout, thumbnail }),
            });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.error || `Server error (${res.status})`);
            }
            const { id } = await res.json();
            // Add to recent
            LCARSStorage.addRecent({
                id: id,
                timestamp: Date.now(),
                elementCount: layout.elements.length,
                displaySize: `${layout.display.width}×${layout.display.height}`,
            });
            updateRecentIndicator();
            const shareUrl = `${window.location.origin}?layout=${id}`;
            await navigator.clipboard.writeText(shareUrl);
            btn.textContent = 'COPIED!';
            setTimeout(() => { btn.textContent = 'SHARE'; btn.disabled = false; }, 2000);
        } catch (err) {
            alert('Failed to share: ' + err.message);
            btn.textContent = 'SHARE';
            btn.disabled = false;
        }
    });

    // ───── Load shared layout handled in init ─────

    document.getElementById('btn-load').addEventListener('click', () => {
        document.getElementById('file-load-input').click();
    });

    document.getElementById('file-load-input').addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
            try {
                const data = JSON.parse(ev.target.result);
                editor.loadLayout(data);
                syncDisplaySettings();
                updateLayers();
            } catch (err) {
                alert('Failed to load layout: ' + err.message);
            }
        };
        reader.readAsText(file);
        e.target.value = ''; // Reset
    });

    document.getElementById('btn-undo').addEventListener('click', () => {
        editor.undo();
        updateLayers();
    });
    document.getElementById('btn-redo').addEventListener('click', () => {
        editor.redo();
        updateLayers();
    });

    // Zoom
    document.getElementById('btn-zoom-in').addEventListener('click', () => {
        renderer.zoom = Math.min(10, renderer.zoom * 1.25);
        renderer.render();
        document.getElementById('zoom-level').textContent = Math.round(renderer.zoom * 100) + '%';
    });
    document.getElementById('btn-zoom-out').addEventListener('click', () => {
        renderer.zoom = Math.max(0.25, renderer.zoom / 1.25);
        renderer.render();
        document.getElementById('zoom-level').textContent = Math.round(renderer.zoom * 100) + '%';
    });
    document.getElementById('btn-zoom-fit').addEventListener('click', () => {
        const cw = renderer.containerWidth - 40;
        const ch = renderer.containerHeight - 40;
        const zx = cw / renderer.displayWidth;
        const zy = ch / renderer.displayHeight;
        renderer.zoom = Math.min(zx, zy, 4);
        renderer.panX = 0;
        renderer.panY = 0;
        renderer.render();
        document.getElementById('zoom-level').textContent = Math.round(renderer.zoom * 100) + '%';
    });

    // ───── Export Modal ─────
    const modal = document.getElementById('export-modal');
    const exportPreview = document.getElementById('export-preview');
    const exportCode = document.getElementById('export-code');
    let currentExportContent = '';
    let currentExportType = '';

    document.getElementById('btn-export').addEventListener('click', () => {
        modal.style.display = '';
        exportPreview.style.display = 'none';
    });

    document.getElementById('modal-close').addEventListener('click', () => {
        modal.style.display = 'none';
    });

    modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.style.display = 'none';
    });

    document.getElementById('export-cpp').addEventListener('click', () => {
        currentExportContent = exporter.exportCpp();
        currentExportType = 'cpp';
        exportCode.textContent = currentExportContent;
        exportPreview.style.display = '';
    });

    document.getElementById('export-json').addEventListener('click', () => {
        currentExportContent = exporter.exportJson();
        currentExportType = 'json';
        exportCode.textContent = currentExportContent;
        exportPreview.style.display = '';
    });

    document.getElementById('export-png').addEventListener('click', () => {
        const dataUrl = exporter.exportPng();
        exporter.downloadPng(dataUrl, 'lcars-layout.png');
    });

    document.getElementById('export-copy').addEventListener('click', () => {
        exporter.copyToClipboard(currentExportContent);
    });

    document.getElementById('export-download').addEventListener('click', () => {
        const ext = currentExportType === 'cpp' ? 'h' : 'json';
        const filename = `lcars-layout.${ext}`;
        exporter.downloadText(currentExportContent, filename);
    });

    // ───── Editor callbacks ─────
    editor.onSelectionChange = () => {
        updateProperties();
        updateLayers();
    };

    editor.onChange = () => {
        updateLayers();
        triggerAutosave();
    };

    editor.onDisplayChange = () => {
        syncDisplaySettings();
    };

    // ───── Resize handling ─────
    window.addEventListener('resize', () => {
        renderer.resize();
    });

    // ───── Initialize ─────

    // Toolbar buttons to disable in read-only modes
    const EDIT_BUTTONS = ['btn-new', 'btn-save', 'btn-load', 'btn-undo', 'btn-redo', 'btn-share'];

    function disableEditButtons() {
        EDIT_BUTTONS.forEach(id => {
            const el = document.getElementById(id);
            el.disabled = true;
            el.style.opacity = '0.3';
        });
    }

    function enableEditButtons() {
        EDIT_BUTTONS.forEach(id => {
            const el = document.getElementById(id);
            el.disabled = false;
            el.style.opacity = '';
        });
    }

    // ───── Welcome Screen ─────

    function showWelcome() {
        document.getElementById('welcome-overlay').style.display = '';
    }

    document.getElementById('welcome-dismiss').addEventListener('click', () => {
        document.getElementById('welcome-overlay').style.display = 'none';
        LCARSStorage.markWelcomeSeen();
    });

    document.getElementById('welcome-overlay').addEventListener('click', (e) => {
        if (e.target.id === 'welcome-overlay') {
            document.getElementById('welcome-overlay').style.display = 'none';
            LCARSStorage.markWelcomeSeen();
        }
    });

    document.getElementById('btn-help').addEventListener('click', showWelcome);

    // ───── Recent Layouts ─────

    function updateRecentIndicator() {
        const btn = document.getElementById('btn-recent');
        const hasAny = LCARSStorage.getRecent().length > 0 || LCARSStorage.hasAutosave();
        btn.classList.toggle('has-history', hasAny);
    }

    function showRecent() {
        const modal = document.getElementById('recent-modal');
        const list = document.getElementById('recent-list');
        list.innerHTML = '';

        let hasContent = false;

        // Local draft
        const autosave = LCARSStorage.loadAutosave();
        if (autosave && autosave.layout && autosave.layout.elements && autosave.layout.elements.length > 0) {
            hasContent = true;
            const item = document.createElement('div');
            item.className = 'recent-item recent-item-draft';

            const info = document.createElement('div');
            info.className = 'recent-item-info';
            const id = document.createElement('div');
            id.className = 'recent-item-id';
            id.textContent = 'LOCAL DRAFT';
            info.appendChild(id);
            const meta = document.createElement('div');
            meta.className = 'recent-item-meta';
            const date = new Date(autosave.timestamp);
            meta.textContent = `${autosave.layout.elements.length} elements · ${autosave.layout.display.width}×${autosave.layout.display.height} · ${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;
            info.appendChild(meta);
            item.appendChild(info);

            const actions = document.createElement('div');
            actions.className = 'recent-item-actions';
            const resumeBtn = document.createElement('button');
            resumeBtn.className = 'toolbar-btn accent';
            resumeBtn.textContent = 'RESUME';
            resumeBtn.style.fontSize = '13px';
            resumeBtn.style.padding = '4px 14px';
            resumeBtn.addEventListener('click', () => {
                modal.style.display = 'none';
                if (isViewMode) {
                    switchToEditMode();
                }
                editor.loadLayout(autosave.layout);
                syncDisplaySettings();
                updateLayers();
            });
            actions.appendChild(resumeBtn);
            item.appendChild(actions);
            list.appendChild(item);
        }

        // Server layouts
        const recent = LCARSStorage.getRecent();
        if (recent.length > 0) {
            hasContent = true;
            for (const entry of recent) {
                const item = document.createElement('div');
                item.className = 'recent-item';

                const info = document.createElement('div');
                info.className = 'recent-item-info';
                const id = document.createElement('div');
                id.className = 'recent-item-id';
                id.textContent = entry.id;
                info.appendChild(id);
                const meta = document.createElement('div');
                meta.className = 'recent-item-meta';
                const date = new Date(entry.timestamp);
                meta.textContent = `${entry.elementCount} elements · ${entry.displaySize} · ${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;
                info.appendChild(meta);
                item.appendChild(info);

                const actions = document.createElement('div');
                actions.className = 'recent-item-actions';
                const viewBtn = document.createElement('button');
                viewBtn.className = 'toolbar-btn';
                viewBtn.textContent = 'VIEW';
                viewBtn.style.fontSize = '13px';
                viewBtn.style.padding = '4px 14px';
                viewBtn.addEventListener('click', () => {
                    window.location.href = `?layout=${entry.id}`;
                });
                actions.appendChild(viewBtn);
                item.appendChild(actions);
                list.appendChild(item);
            }
        }

        if (!hasContent) {
            list.innerHTML = '<p style="color: var(--text-muted); text-align: center; padding: 20px; font-size: 14px;">No recent layouts</p>';
        }

        // Clear history button
        if (recent.length > 0) {
            const clearDiv = document.createElement('div');
            clearDiv.style.textAlign = 'center';
            clearDiv.style.marginTop = '12px';
            const clearBtn = document.createElement('button');
            clearBtn.className = 'prop-btn danger';
            clearBtn.textContent = 'CLEAR HISTORY';
            clearBtn.addEventListener('click', () => {
                LCARSStorage.clearRecent();
                showRecent(); // Refresh
                updateRecentIndicator();
            });
            clearDiv.appendChild(clearBtn);
            list.appendChild(clearDiv);
        }

        modal.style.display = '';
    }

    document.getElementById('btn-recent').addEventListener('click', showRecent);

    document.getElementById('recent-modal-close').addEventListener('click', () => {
        document.getElementById('recent-modal').style.display = 'none';
    });

    document.getElementById('recent-modal').addEventListener('click', (e) => {
        if (e.target.id === 'recent-modal') {
            document.getElementById('recent-modal').style.display = 'none';
        }
    });

    // ───── Template Library ─────

    function renderTemplateThumbnail(templateData, canvas) {
        const ctx = canvas.getContext('2d');
        const dw = templateData.display.width;
        const dh = templateData.display.height;
        const maxW = canvas.parentElement.clientWidth || 200;
        const maxH = 100;
        const scale = Math.min(maxW / dw, maxH / dh, 1);
        canvas.width = Math.round(dw * scale);
        canvas.height = Math.round(dh * scale);
        ctx.scale(scale, scale);

        // Draw background
        ctx.fillStyle = templateData.display.bgColor || '#000000';
        ctx.fillRect(0, 0, dw, dh);

        // Draw each element using the element type definitions
        for (const el of templateData.elements) {
            if (!el.visible) continue;
            const typeDef = LCARSElementTypes[el.type];
            if (typeDef && typeDef.render) {
                ctx.save();
                try {
                    typeDef.render(ctx, el.props);
                } catch (e) {
                    // Skip elements that fail to render in thumbnail
                }
                ctx.restore();
            }
        }
    }

    function showTemplates(filterCategory) {
        const modal = document.getElementById('templates-modal');
        const tabsContainer = document.getElementById('templates-tabs');
        const grid = document.getElementById('templates-grid');

        // Build category list: "All", "Screen Presets", then template categories
        const templateCategories = [...new Set(LCARS_TEMPLATES.map(t => t.category))];
        const allCategories = ['All', ...templateCategories, 'Blank Canvas'];
        const activeCategory = filterCategory || 'All';

        // Render tabs
        tabsContainer.innerHTML = '';
        for (const cat of allCategories) {
            const tab = document.createElement('button');
            tab.className = 'templates-tab' + (cat === activeCategory ? ' active' : '');
            tab.textContent = cat.toUpperCase();
            tab.addEventListener('click', () => showTemplates(cat));
            tabsContainer.appendChild(tab);
        }

        // Render grid
        grid.innerHTML = '';

        if (activeCategory === 'Blank Canvas') {
            // Show screen size presets
            for (const preset of LCARS_SCREEN_PRESETS) {
                const card = document.createElement('div');
                card.className = 'template-card preset-card';
                card.innerHTML = `
                    <div class="template-card-name">${preset.name}</div>
                    <div class="template-card-desc">${preset.category}</div>
                `;
                card.addEventListener('click', async () => {
                    modal.style.display = 'none';
                    if (renderer.elements.length > 0) {
                        const result = await lcarsConfirm({
                            title: 'LOAD PRESET',
                            message: 'This will clear your current layout. Continue?',
                            buttons: [
                                { key: 'yes', label: 'CONTINUE', danger: true },
                                { key: 'cancel', label: 'CANCEL' },
                            ]
                        });
                        if (result !== 'yes') return;
                    }
                    const blankLayout = {
                        display: { width: preset.width, height: preset.height, cornerRadius: 20, bgColor: '#000000' },
                        elements: []
                    };
                    editor.loadLayout(blankLayout);
                    syncDisplaySettings();
                    updateLayers();
                    LCARSStorage.clearAutosave();
                });
                grid.appendChild(card);
            }
        } else {
            // Show templates
            const filtered = activeCategory === 'All'
                ? LCARS_TEMPLATES
                : LCARS_TEMPLATES.filter(t => t.category === activeCategory);

            for (const template of filtered) {
                const card = document.createElement('div');
                card.className = 'template-card';

                const previewDiv = document.createElement('div');
                previewDiv.className = 'template-card-preview';
                const thumbCanvas = document.createElement('canvas');
                previewDiv.appendChild(thumbCanvas);

                card.innerHTML = '';
                card.appendChild(previewDiv);

                const info = document.createElement('div');
                info.innerHTML = `
                    <div class="template-card-name">${template.name}</div>
                    <div class="template-card-size">${template.size}</div>
                    <div class="template-card-desc">${template.description}</div>
                `;
                card.appendChild(info);

                card.addEventListener('click', async () => {
                    modal.style.display = 'none';
                    if (renderer.elements.length > 0) {
                        const result = await lcarsConfirm({
                            title: 'LOAD TEMPLATE',
                            message: `Load "${template.name}"? This will replace your current layout.`,
                            buttons: [
                                { key: 'yes', label: 'LOAD', danger: true },
                                { key: 'cancel', label: 'CANCEL' },
                            ]
                        });
                        if (result !== 'yes') return;
                    }
                    // Deep clone the template data
                    const layoutData = JSON.parse(JSON.stringify(template.data));
                    editor.loadLayout(layoutData);
                    syncDisplaySettings();
                    updateLayers();
                    LCARSStorage.clearAutosave();
                });

                grid.appendChild(card);

                // Render thumbnail after card is in DOM
                requestAnimationFrame(() => {
                    renderTemplateThumbnail(template.data, thumbCanvas);
                });
            }
        }

        modal.style.display = '';
    }

    document.getElementById('btn-templates').addEventListener('click', () => showTemplates());

    document.getElementById('templates-modal-close').addEventListener('click', () => {
        document.getElementById('templates-modal').style.display = 'none';
    });

    document.getElementById('templates-modal').addEventListener('click', (e) => {
        if (e.target.id === 'templates-modal') {
            document.getElementById('templates-modal').style.display = 'none';
        }
    });

    // ───── View Mode (shared layouts) ─────

    async function initViewMode(layoutId) {
        try {
            const res = await fetch(`/api/layouts/${encodeURIComponent(layoutId)}`);
            if (!res.ok) throw new Error('Layout not found');
            const data = await res.json();

            isViewMode = true;
            viewLayoutData = data;
            setReadOnly(true);
            editor.loadLayout(data);
            syncDisplaySettings();
            updateLayers();

            // Show banner, disable edit buttons
            document.getElementById('viewonly-banner').style.display = '';
            disableEditButtons();

            // Add to recent
            LCARSStorage.addRecent({
                id: layoutId,
                timestamp: Date.now(),
                elementCount: data.elements.length,
                displaySize: `${data.display.width}×${data.display.height}`,
            });
            updateRecentIndicator();
        } catch (err) {
            console.warn('Failed to load shared layout:', err.message);
            initEditMode(); // fallback
        }
    }

    function switchToEditMode() {
        isViewMode = false;
        viewLayoutData = null;
        setReadOnly(false);

        document.getElementById('viewonly-banner').style.display = 'none';
        enableEditButtons();
        window.history.replaceState({}, '', window.location.pathname);

        // Acquire tab lock
        if (LCARSStorage.isLockedByOther()) {
            isTabLocked = true;
            setReadOnly(true);
            document.getElementById('tablock-banner').style.display = '';
            disableEditButtons();
        } else {
            LCARSStorage.acquireLock();
        }
    }

    // Copy-to-editor button
    document.getElementById('btn-copy-to-editor').addEventListener('click', async () => {
        if (LCARSStorage.hasAutosave()) {
            const result = await lcarsConfirm({
                title: 'EXISTING WORK DETECTED',
                message: 'You have an unsaved design in progress. What would you like to do with it?',
                buttons: [
                    { key: 'save', label: 'SAVE & CONTINUE', accent: true },
                    { key: 'replace', label: 'REPLACE', danger: true },
                    { key: 'cancel', label: 'CANCEL' },
                ]
            });

            if (result === 'cancel') return;

            if (result === 'save') {
                await saveCurrentWork();
            }
        }

        // Switch to edit mode with the viewed layout
        switchToEditMode();
        editor.loadLayout(viewLayoutData || editor.getLayout());
        syncDisplaySettings();
        updateLayers();
        triggerAutosave();
    });

    async function saveCurrentWork() {
        const autosave = LCARSStorage.loadAutosave();
        if (!autosave || !autosave.layout) return;

        try {
            const res = await fetch('/api/layouts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(autosave.layout),
            });
            if (!res.ok) throw new Error('Server error');
            const { id } = await res.json();

            LCARSStorage.addRecent({
                id: id,
                timestamp: Date.now(),
                elementCount: autosave.layout.elements.length,
                displaySize: `${autosave.layout.display.width}×${autosave.layout.display.height}`,
            });
            updateRecentIndicator();

            // Copy URL to clipboard
            const url = `${window.location.origin}?layout=${id}`;
            try { await navigator.clipboard.writeText(url); } catch { /* ignore */ }
        } catch (err) {
            console.warn('Failed to save current work:', err.message);
        }
    }

    // ───── Tab Locking ─────

    function initTabLock() {
        if (LCARSStorage.isLockedByOther()) {
            isTabLocked = true;
            setReadOnly(true);
            document.getElementById('tablock-banner').style.display = '';
            disableEditButtons();
        } else {
            LCARSStorage.acquireLock();
        }

        // Listen for lock changes from other tabs
        window.addEventListener('storage', (e) => {
            if (e.key !== LCARSStorage.KEYS.TAB_LOCK) return;

            if (LCARSStorage.isLockedByOther()) {
                // Another tab took control
                if (!isTabLocked && !isViewMode) {
                    isTabLocked = true;
                    setReadOnly(true);
                    document.getElementById('tablock-banner').style.display = '';
                    disableEditButtons();
                    LCARSStorage.releaseLock();
                }
            } else if (isTabLocked) {
                // Lock was released — can try to claim
                // Don't auto-claim, user can click TAKE CONTROL
            }
        });
    }

    document.getElementById('btn-take-control').addEventListener('click', () => {
        LCARSStorage.forceAcquireLock();
        isTabLocked = false;
        setReadOnly(false);
        document.getElementById('tablock-banner').style.display = 'none';
        enableEditButtons();

        // Restore autosave
        const autosave = LCARSStorage.loadAutosave();
        if (autosave && autosave.layout && autosave.layout.elements && autosave.layout.elements.length > 0) {
            editor.loadLayout(autosave.layout);
            syncDisplaySettings();
            updateLayers();
        }
    });

    // ───── Edit Mode Init ─────

    function initEditMode() {
        // Tab locking
        initTabLock();

        // Restore autosave (if we have the lock)
        if (!isTabLocked) {
            const autosave = LCARSStorage.loadAutosave();
            if (autosave && autosave.layout && autosave.layout.elements && autosave.layout.elements.length > 0) {
                editor.loadLayout(autosave.layout);
                syncDisplaySettings();
                updateLayers();
            }
        }

        // Welcome screen
        if (!LCARSStorage.hasSeenWelcome()) {
            showWelcome();
        }
    }

    // ───── Main Init ─────

    async function init() {
        buildPalette();
        buildColorSwatches();
        syncDisplaySettings();

        // Check URL for shared layout
        const params = new URLSearchParams(window.location.search);
        const layoutId = params.get('layout');

        if (layoutId) {
            await initViewMode(layoutId);
        } else {
            initEditMode();
        }

        updateRecentIndicator();

        // Initial zoom to fit
        requestAnimationFrame(() => {
            renderer.resize();
            const cw = renderer.containerWidth - 40;
            const ch = renderer.containerHeight - 40;
            const zx = cw / renderer.displayWidth;
            const zy = ch / renderer.displayHeight;
            renderer.zoom = Math.min(zx, zy, 3);
            renderer.render();
            document.getElementById('zoom-level').textContent = Math.round(renderer.zoom * 100) + '%';
        });
    }

    init();
})();
