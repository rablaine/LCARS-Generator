/* ============================================
   LCARS Element Definitions
   ============================================
   Each element type defines:
     - category: grouping in palette
     - name: display name
     - defaultProps: initial properties
     - render(ctx, props): draw onto canvas context
     - getProperties(): property field definitions
   ============================================ */

const LCARSElementTypes = {};

// ========== Helper: draw rounded rect path ==========
function roundedRectPath(ctx, x, y, w, h, radii) {
    // radii = { tl, tr, br, bl } or a single number
    let r = typeof radii === 'number'
        ? { tl: radii, tr: radii, br: radii, bl: radii }
        : { tl: 0, tr: 0, br: 0, bl: 0, ...radii };

    ctx.beginPath();
    ctx.moveTo(x + r.tl, y);
    ctx.lineTo(x + w - r.tr, y);
    if (r.tr) ctx.arcTo(x + w, y, x + w, y + r.tr, r.tr);
    else ctx.lineTo(x + w, y);
    ctx.lineTo(x + w, y + h - r.br);
    if (r.br) ctx.arcTo(x + w, y + h, x + w - r.br, y + h, r.br);
    else ctx.lineTo(x + w, y + h);
    ctx.lineTo(x + r.bl, y + h);
    if (r.bl) ctx.arcTo(x, y + h, x, y + h - r.bl, r.bl);
    else ctx.lineTo(x, y + h);
    ctx.lineTo(x, y + r.tl);
    if (r.tl) ctx.arcTo(x, y, x + r.tl, y, r.tl);
    else ctx.lineTo(x, y);
    ctx.closePath();
}

// ========== Helper: draw LCARS elbow ==========
function drawElbow(ctx, x, y, w, h, color, corner, barW, barH, outerR, innerR) {
    ctx.fillStyle = color;
    // corner: 'tl' | 'tr' | 'bl' | 'br'
    // outerR: outer corner radius — stays fixed regardless of size
    // innerR: inner corner radius — stays fixed regardless of size
    const oR = outerR != null ? Math.max(0, Math.min(outerR, w, h)) : Math.min(barH, barW, w, h);
    const iR = innerR != null ? Math.max(0, Math.min(innerR, w - barW, h - barH)) : 0;

    ctx.beginPath();
    switch (corner) {
        case 'tl':
            ctx.moveTo(x, y + h);
            ctx.lineTo(x, y + oR);
            ctx.arcTo(x, y, x + oR, y, oR);
            ctx.lineTo(x + w, y);
            ctx.lineTo(x + w, y + barH);
            if (iR > 0) {
                ctx.lineTo(x + barW + iR, y + barH);
                ctx.arcTo(x + barW, y + barH, x + barW, y + barH + iR, iR);
            } else {
                ctx.lineTo(x + barW, y + barH);
            }
            ctx.lineTo(x + barW, y + h);
            break;
        case 'tr':
            ctx.moveTo(x, y);
            ctx.lineTo(x + w - oR, y);
            ctx.arcTo(x + w, y, x + w, y + oR, oR);
            ctx.lineTo(x + w, y + h);
            ctx.lineTo(x + w - barW, y + h);
            if (iR > 0) {
                ctx.lineTo(x + w - barW, y + barH + iR);
                ctx.arcTo(x + w - barW, y + barH, x + w - barW - iR, y + barH, iR);
            } else {
                ctx.lineTo(x + w - barW, y + barH);
            }
            ctx.lineTo(x, y + barH);
            break;
        case 'bl':
            ctx.moveTo(x, y);
            ctx.lineTo(x + barW, y);
            if (iR > 0) {
                ctx.lineTo(x + barW, y + h - barH - iR);
                ctx.arcTo(x + barW, y + h - barH, x + barW + iR, y + h - barH, iR);
            } else {
                ctx.lineTo(x + barW, y + h - barH);
            }
            ctx.lineTo(x + w, y + h - barH);
            ctx.lineTo(x + w, y + h);
            ctx.lineTo(x + oR, y + h);
            ctx.arcTo(x, y + h, x, y + h - oR, oR);
            break;
        case 'br':
            ctx.moveTo(x + w, y);
            ctx.lineTo(x + w, y + h - oR);
            ctx.arcTo(x + w, y + h, x + w - oR, y + h, oR);
            ctx.lineTo(x, y + h);
            ctx.lineTo(x, y + h - barH);
            if (iR > 0) {
                ctx.lineTo(x + w - barW - iR, y + h - barH);
                ctx.arcTo(x + w - barW, y + h - barH, x + w - barW, y + h - barH - iR, iR);
            } else {
                ctx.lineTo(x + w - barW, y + h - barH);
            }
            ctx.lineTo(x + w - barW, y);
            break;
    }
    ctx.closePath();
    ctx.fill();
}

// ───────────────────────────────────────────────
// CATEGORY: STRUCTURAL
// ───────────────────────────────────────────────

LCARSElementTypes['elbow-tl'] = {
    category: 'Structural',
    name: 'Elbow TL',
    defaultProps: {
        x: 0, y: 0, w: 100, h: 60,
        color: LCARS_COLORS.BUTTERSCOTCH,
        barW: 30,
        barH: 20,
        outerR: 30,
        innerR: 12,
        bottomGap: 0,
        label: '',
        labelColor: '#000000',
        labelFontSize: 10,
    },
    render(ctx, p) {
        const gap = p.bottomGap || 0;
        drawElbow(ctx, p.x, p.y, p.w, p.h - gap, p.color, 'tl', p.barW, p.barH, p.outerR, p.innerR);
        if (p.label) {
            ctx.fillStyle = p.labelColor;
            ctx.font = `bold ${p.labelFontSize}px Antonio, Arial, sans-serif`;
            ctx.textAlign = 'right';
            ctx.textBaseline = 'middle';
            ctx.fillText(p.label, p.x + p.w - 6, p.y + p.barH / 2 + 1);
        }
    },
    getProperties() {
        return [
            { key: 'color', label: 'Color', type: 'color' },
            { key: 'barW', label: 'Vert Width', type: 'number', min: 4, max: 200 },
            { key: 'barH', label: 'Horiz Height', type: 'number', min: 4, max: 200 },
            { key: 'outerR', label: 'Outer Radius', type: 'number', min: 0, max: 200 },
            { key: 'innerR', label: 'Inner Radius', type: 'number', min: 0, max: 200 },
            { key: 'bottomGap', label: 'Bottom Gap', type: 'number', min: 0, max: 40 },
            { key: 'label', label: 'Label', type: 'text' },
            { key: 'labelColor', label: 'Label Color', type: 'color' },
            { key: 'labelFontSize', label: 'Label Size', type: 'number', min: 6, max: 36 },
        ];
    }
};

LCARSElementTypes['elbow-tr'] = {
    category: 'Structural',
    name: 'Elbow TR',
    defaultProps: {
        x: 0, y: 0, w: 100, h: 60,
        color: LCARS_COLORS.BUTTERSCOTCH,
        barW: 30,
        barH: 20,
        outerR: 30,
        innerR: 12,
        bottomGap: 0,
        label: '',
        labelColor: '#000000',
        labelFontSize: 10,
    },
    render(ctx, p) {
        const gap = p.bottomGap || 0;
        drawElbow(ctx, p.x, p.y, p.w, p.h - gap, p.color, 'tr', p.barW, p.barH, p.outerR, p.innerR);
        if (p.label) {
            ctx.fillStyle = p.labelColor;
            ctx.font = `bold ${p.labelFontSize}px Antonio, Arial, sans-serif`;
            ctx.textAlign = 'left';
            ctx.textBaseline = 'middle';
            ctx.fillText(p.label, p.x + 6, p.y + p.barH / 2 + 1);
        }
    },
    getProperties() {
        return [
            { key: 'color', label: 'Color', type: 'color' },
            { key: 'barW', label: 'Vert Width', type: 'number', min: 4, max: 200 },
            { key: 'barH', label: 'Horiz Height', type: 'number', min: 4, max: 200 },
            { key: 'outerR', label: 'Outer Radius', type: 'number', min: 0, max: 200 },
            { key: 'innerR', label: 'Inner Radius', type: 'number', min: 0, max: 200 },
            { key: 'bottomGap', label: 'Bottom Gap', type: 'number', min: 0, max: 40 },
            { key: 'label', label: 'Label', type: 'text' },
            { key: 'labelColor', label: 'Label Color', type: 'color' },
            { key: 'labelFontSize', label: 'Label Size', type: 'number', min: 6, max: 36 },
        ];
    }
};

LCARSElementTypes['elbow-bl'] = {
    category: 'Structural',
    name: 'Elbow BL',
    defaultProps: {
        x: 0, y: 0, w: 100, h: 60,
        color: LCARS_COLORS.VIOLET,
        barW: 30,
        barH: 20,
        outerR: 30,
        innerR: 12,
        topGap: 0,
        label: '',
        labelColor: '#000000',
        labelFontSize: 10,
    },
    render(ctx, p) {
        const gap = p.topGap || 0;
        drawElbow(ctx, p.x, p.y + gap, p.w, p.h - gap, p.color, 'bl', p.barW, p.barH, p.outerR, p.innerR);
        if (p.label) {
            ctx.fillStyle = p.labelColor;
            ctx.font = `bold ${p.labelFontSize}px Antonio, Arial, sans-serif`;
            ctx.textAlign = 'right';
            ctx.textBaseline = 'middle';
            ctx.fillText(p.label, p.x + p.w - 6, p.y + p.h - p.barH / 2 + 1);
        }
    },
    getProperties() {
        return [
            { key: 'color', label: 'Color', type: 'color' },
            { key: 'barW', label: 'Vert Width', type: 'number', min: 4, max: 200 },
            { key: 'barH', label: 'Horiz Height', type: 'number', min: 4, max: 200 },
            { key: 'outerR', label: 'Outer Radius', type: 'number', min: 0, max: 200 },
            { key: 'innerR', label: 'Inner Radius', type: 'number', min: 0, max: 200 },
            { key: 'topGap', label: 'Top Gap', type: 'number', min: 0, max: 40 },
            { key: 'label', label: 'Label', type: 'text' },
            { key: 'labelColor', label: 'Label Color', type: 'color' },
            { key: 'labelFontSize', label: 'Label Size', type: 'number', min: 6, max: 36 },
        ];
    }
};

LCARSElementTypes['elbow-br'] = {
    category: 'Structural',
    name: 'Elbow BR',
    defaultProps: {
        x: 0, y: 0, w: 100, h: 60,
        color: LCARS_COLORS.VIOLET,
        barW: 30,
        barH: 20,
        outerR: 30,
        innerR: 12,
        topGap: 0,
        label: '',
        labelColor: '#000000',
        labelFontSize: 10,
    },
    render(ctx, p) {
        const gap = p.topGap || 0;
        drawElbow(ctx, p.x, p.y + gap, p.w, p.h - gap, p.color, 'br', p.barW, p.barH, p.outerR, p.innerR);
        if (p.label) {
            ctx.fillStyle = p.labelColor;
            ctx.font = `bold ${p.labelFontSize}px Antonio, Arial, sans-serif`;
            ctx.textAlign = 'left';
            ctx.textBaseline = 'middle';
            ctx.fillText(p.label, p.x + 6, p.y + p.h - p.barH / 2 + 1);
        }
    },
    getProperties() {
        return [
            { key: 'color', label: 'Color', type: 'color' },
            { key: 'barW', label: 'Vert Width', type: 'number', min: 4, max: 200 },
            { key: 'barH', label: 'Horiz Height', type: 'number', min: 4, max: 200 },
            { key: 'outerR', label: 'Outer Radius', type: 'number', min: 0, max: 200 },
            { key: 'innerR', label: 'Inner Radius', type: 'number', min: 0, max: 200 },
            { key: 'topGap', label: 'Top Gap', type: 'number', min: 0, max: 40 },
            { key: 'label', label: 'Label', type: 'text' },
            { key: 'labelColor', label: 'Label Color', type: 'color' },
            { key: 'labelFontSize', label: 'Label Size', type: 'number', min: 6, max: 36 },
        ];
    }
};

LCARSElementTypes['bar-horizontal'] = {
    category: 'Structural',
    name: 'H-Bar',
    defaultProps: {
        x: 0, y: 0, w: 120, h: 20,
        color: LCARS_COLORS.ORANGE,
        endCapLeft: 'flat',   // flat | round
        endCapRight: 'flat',
        topGap: 0,
        bottomGap: 0,
        leftGap: 0,
        rightGap: 0,
    },
    render(ctx, p) {
        const t = p.topGap || 0, b = p.bottomGap || 0, l = p.leftGap || 0, r = p.rightGap || 0;
        const bx = p.x + l, by = p.y + t;
        const bw = p.w - l - r, bh = p.h - t - b;
        if (bw <= 0 || bh <= 0) return;
        ctx.fillStyle = p.color;
        const hr = bh / 2;
        const rl = p.endCapLeft === 'round' ? hr : 0;
        const rr = p.endCapRight === 'round' ? hr : 0;
        roundedRectPath(ctx, bx, by, bw, bh, { tl: rl, bl: rl, tr: rr, br: rr });
        ctx.fill();
    },
    getProperties() {
        return [
            { key: 'color', label: 'Color', type: 'color' },
            { key: 'endCapLeft', label: 'Left Cap', type: 'select', options: ['flat', 'round'] },
            { key: 'endCapRight', label: 'Right Cap', type: 'select', options: ['flat', 'round'] },
            { key: 'topGap', label: 'Top Gap', type: 'number', min: 0, max: 40 },
            { key: 'bottomGap', label: 'Bottom Gap', type: 'number', min: 0, max: 40 },
            { key: 'leftGap', label: 'Left Gap', type: 'number', min: 0, max: 40 },
            { key: 'rightGap', label: 'Right Gap', type: 'number', min: 0, max: 40 },
        ];
    }
};

LCARSElementTypes['bar-vertical'] = {
    category: 'Structural',
    name: 'V-Bar',
    defaultProps: {
        x: 0, y: 0, w: 30, h: 100,
        color: LCARS_COLORS.ORANGE,
        endCapTop: 'flat',
        endCapBottom: 'flat',
        topGap: 0,
        bottomGap: 0,
        leftGap: 0,
        rightGap: 0,
    },
    render(ctx, p) {
        const t = p.topGap || 0, b = p.bottomGap || 0, l = p.leftGap || 0, r = p.rightGap || 0;
        const bx = p.x + l, by = p.y + t;
        const bw = p.w - l - r, bh = p.h - t - b;
        if (bw <= 0 || bh <= 0) return;
        ctx.fillStyle = p.color;
        const hr = bw / 2;
        const rt = p.endCapTop === 'round' ? hr : 0;
        const rb = p.endCapBottom === 'round' ? hr : 0;
        roundedRectPath(ctx, bx, by, bw, bh, { tl: rt, tr: rt, bl: rb, br: rb });
        ctx.fill();
    },
    getProperties() {
        return [
            { key: 'color', label: 'Color', type: 'color' },
            { key: 'endCapTop', label: 'Top Cap', type: 'select', options: ['flat', 'round'] },
            { key: 'endCapBottom', label: 'Bottom Cap', type: 'select', options: ['flat', 'round'] },
            { key: 'topGap', label: 'Top Gap', type: 'number', min: 0, max: 40 },
            { key: 'bottomGap', label: 'Bottom Gap', type: 'number', min: 0, max: 40 },
            { key: 'leftGap', label: 'Left Gap', type: 'number', min: 0, max: 40 },
            { key: 'rightGap', label: 'Right Gap', type: 'number', min: 0, max: 40 },
        ];
    }
};

LCARSElementTypes['separator'] = {
    category: 'Structural',
    name: 'Separator',
    defaultProps: {
        x: 0, y: 0, w: 120, h: 4,
        color: LCARS_COLORS.DARK_GREY,
    },
    render(ctx, p) {
        ctx.fillStyle = p.color;
        ctx.fillRect(p.x, p.y, p.w, p.h);
    },
    getProperties() {
        return [
            { key: 'color', label: 'Color', type: 'color' },
        ];
    }
};

// ───────────────────────────────────────────────
// CATEGORY: BUTTONS
// ───────────────────────────────────────────────

LCARSElementTypes['button-pill'] = {
    category: 'Buttons',
    name: 'Pill Button',
    defaultProps: {
        x: 0, y: 0, w: 80, h: 24,
        color: LCARS_COLORS.PEACH,
        label: 'LABEL',
        fontSize: 11,
        textColor: '#000000',
        textAlign: 'right', // left | center | right
    },
    render(ctx, p) {
        const r = p.h / 2;
        ctx.fillStyle = p.color;
        roundedRectPath(ctx, p.x, p.y, p.w, p.h, r);
        ctx.fill();

        // Label text
        ctx.fillStyle = p.textColor;
        ctx.font = `bold ${p.fontSize}px Antonio, Arial, sans-serif`;
        let tx;
        if (p.textAlign === 'left') {
            ctx.textAlign = 'left';
            tx = p.x + r;
        } else if (p.textAlign === 'center') {
            ctx.textAlign = 'center';
            tx = p.x + p.w / 2;
        } else {
            ctx.textAlign = 'right';
            tx = p.x + p.w - r;
        }
        ctx.textBaseline = 'middle';
        ctx.fillText(p.label, tx, p.y + p.h / 2 + 1);
    },
    getProperties() {
        return [
            { key: 'color', label: 'Color', type: 'color' },
            { key: 'label', label: 'Label', type: 'text' },
            { key: 'fontSize', label: 'Font Size', type: 'number', min: 6, max: 72 },
            { key: 'textColor', label: 'Text Color', type: 'color' },
            { key: 'textAlign', label: 'Text Align', type: 'select', options: ['left', 'center', 'right'] },
        ];
    }
};

LCARSElementTypes['button-rect'] = {
    category: 'Buttons',
    name: 'Rect Button',
    defaultProps: {
        x: 0, y: 0, w: 80, h: 24,
        color: LCARS_COLORS.LAVENDER,
        label: 'LABEL',
        fontSize: 11,
        textColor: '#000000',
        textAlign: 'right',
        radius: 4,
    },
    render(ctx, p) {
        ctx.fillStyle = p.color;
        roundedRectPath(ctx, p.x, p.y, p.w, p.h, p.radius);
        ctx.fill();

        ctx.fillStyle = p.textColor;
        ctx.font = `bold ${p.fontSize}px Antonio, Arial, sans-serif`;
        let tx;
        if (p.textAlign === 'left') {
            ctx.textAlign = 'left';
            tx = p.x + 8;
        } else if (p.textAlign === 'center') {
            ctx.textAlign = 'center';
            tx = p.x + p.w / 2;
        } else {
            ctx.textAlign = 'right';
            tx = p.x + p.w - 8;
        }
        ctx.textBaseline = 'middle';
        ctx.fillText(p.label, tx, p.y + p.h / 2 + 1);
    },
    getProperties() {
        return [
            { key: 'color', label: 'Color', type: 'color' },
            { key: 'label', label: 'Label', type: 'text' },
            { key: 'fontSize', label: 'Font Size', type: 'number', min: 6, max: 72 },
            { key: 'textColor', label: 'Text Color', type: 'color' },
            { key: 'textAlign', label: 'Text Align', type: 'select', options: ['left', 'center', 'right'] },
            { key: 'radius', label: 'Radius', type: 'number', min: 0, max: 50 },
        ];
    }
};

LCARSElementTypes['button-strip'] = {
    category: 'Buttons',
    name: 'Button Strip',
    defaultProps: {
        x: 0, y: 0, w: 160, h: 20,
        colors: [LCARS_COLORS.BUTTERSCOTCH, LCARS_COLORS.ORANGE, LCARS_COLORS.PEACH],
        gap: 3,
        capLeft: 'round',
        capRight: 'round',
    },
    render(ctx, p) {
        const n = p.colors.length;
        if (n === 0) return;
        const totalGap = p.gap * (n - 1);
        const segW = (p.w - totalGap) / n;
        const r = p.h / 2;

        for (let i = 0; i < n; i++) {
            ctx.fillStyle = p.colors[i];
            const sx = p.x + i * (segW + p.gap);
            const rl = (i === 0 && p.capLeft === 'round') ? r : 0;
            const rr = (i === n - 1 && p.capRight === 'round') ? r : 0;
            roundedRectPath(ctx, sx, p.y, segW, p.h, { tl: rl, bl: rl, tr: rr, br: rr });
            ctx.fill();
        }
    },
    getProperties() {
        return [
            { key: 'colors', label: 'Colors', type: 'colorlist' },
            { key: 'gap', label: 'Gap', type: 'number', min: 0, max: 20 },
            { key: 'capLeft', label: 'Left Cap', type: 'select', options: ['flat', 'round'] },
            { key: 'capRight', label: 'Right Cap', type: 'select', options: ['flat', 'round'] },
        ];
    }
};

// ───────────────────────────────────────────────
// CATEGORY: DATA PANELS
// ───────────────────────────────────────────────

LCARSElementTypes['text-label'] = {
    category: 'Data Panels',
    name: 'Text Label',
    defaultProps: {
        x: 0, y: 0, w: 80, h: 20,
        text: 'LABEL',
        color: LCARS_COLORS.ORANGE,
        fontSize: 14,
        textAlign: 'left',
        fontWeight: 'bold',
    },
    render(ctx, p) {
        ctx.fillStyle = p.color;
        ctx.font = `${p.fontWeight} ${p.fontSize}px Antonio, Arial, sans-serif`;
        ctx.textBaseline = 'top';
        if (p.textAlign === 'center') {
            ctx.textAlign = 'center';
            ctx.fillText(p.text, p.x + p.w / 2, p.y);
        } else if (p.textAlign === 'right') {
            ctx.textAlign = 'right';
            ctx.fillText(p.text, p.x + p.w, p.y);
        } else {
            ctx.textAlign = 'left';
            ctx.fillText(p.text, p.x, p.y);
        }
    },
    getProperties() {
        return [
            { key: 'text', label: 'Text', type: 'text' },
            { key: 'color', label: 'Color', type: 'color' },
            { key: 'fontSize', label: 'Font Size', type: 'number', min: 6, max: 72 },
            { key: 'textAlign', label: 'Align', type: 'select', options: ['left', 'center', 'right'] },
            { key: 'fontWeight', label: 'Weight', type: 'select', options: ['normal', 'bold'] },
        ];
    }
};

LCARSElementTypes['data-readout'] = {
    category: 'Data Panels',
    name: 'Data Readout',
    defaultProps: {
        x: 0, y: 0, w: 100, h: 36,
        label: 'TEMP',
        value: '72°F',
        labelColor: LCARS_COLORS.LAVENDER,
        valueColor: LCARS_COLORS.ORANGE,
        labelFontSize: 9,
        valueFontSize: 18,
        bgColor: '',
        borderColor: '',
    },
    render(ctx, p) {
        // Optional background
        if (p.bgColor) {
            ctx.fillStyle = p.bgColor;
            roundedRectPath(ctx, p.x, p.y, p.w, p.h, 4);
            ctx.fill();
        }
        if (p.borderColor) {
            ctx.strokeStyle = p.borderColor;
            ctx.lineWidth = 1;
            roundedRectPath(ctx, p.x, p.y, p.w, p.h, 4);
            ctx.stroke();
        }

        // Label
        ctx.fillStyle = p.labelColor;
        ctx.font = `bold ${p.labelFontSize}px Antonio, Arial, sans-serif`;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        ctx.fillText(p.label, p.x + 6, p.y + 4);

        // Value
        ctx.fillStyle = p.valueColor;
        ctx.font = `bold ${p.valueFontSize}px Antonio, Arial, sans-serif`;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'bottom';
        ctx.fillText(p.value, p.x + 6, p.y + p.h - 3);
    },
    getProperties() {
        return [
            { key: 'label', label: 'Label', type: 'text' },
            { key: 'value', label: 'Value', type: 'text' },
            { key: 'labelColor', label: 'Label Color', type: 'color' },
            { key: 'valueColor', label: 'Value Color', type: 'color' },
            { key: 'labelFontSize', label: 'Label Size', type: 'number', min: 6, max: 36 },
            { key: 'valueFontSize', label: 'Value Size', type: 'number', min: 8, max: 72 },
            { key: 'bgColor', label: 'Background', type: 'color' },
            { key: 'borderColor', label: 'Border', type: 'color' },
        ];
    }
};

LCARSElementTypes['clock-display'] = {
    category: 'Data Panels',
    name: 'Clock',
    defaultProps: {
        x: 0, y: 0, w: 100, h: 28,
        timeText: '14:37',
        color: LCARS_COLORS.ORANGE,
        fontSize: 24,
        textAlign: 'center',
    },
    render(ctx, p) {
        ctx.fillStyle = p.color;
        ctx.font = `bold ${p.fontSize}px Antonio, Arial, sans-serif`;
        ctx.textBaseline = 'middle';
        if (p.textAlign === 'center') {
            ctx.textAlign = 'center';
            ctx.fillText(p.timeText, p.x + p.w / 2, p.y + p.h / 2);
        } else if (p.textAlign === 'right') {
            ctx.textAlign = 'right';
            ctx.fillText(p.timeText, p.x + p.w, p.y + p.h / 2);
        } else {
            ctx.textAlign = 'left';
            ctx.fillText(p.timeText, p.x, p.y + p.h / 2);
        }
    },
    getProperties() {
        return [
            { key: 'timeText', label: 'Time Text', type: 'text' },
            { key: 'color', label: 'Color', type: 'color' },
            { key: 'fontSize', label: 'Font Size', type: 'number', min: 8, max: 72 },
            { key: 'textAlign', label: 'Align', type: 'select', options: ['left', 'center', 'right'] },
        ];
    }
};

LCARSElementTypes['date-display'] = {
    category: 'Data Panels',
    name: 'Date',
    defaultProps: {
        x: 0, y: 0, w: 120, h: 18,
        dateText: 'STARDATE 79145.2',
        color: LCARS_COLORS.BUTTERSCOTCH,
        fontSize: 12,
        textAlign: 'center',
    },
    render(ctx, p) {
        ctx.fillStyle = p.color;
        ctx.font = `bold ${p.fontSize}px Antonio, Arial, sans-serif`;
        ctx.textBaseline = 'middle';
        if (p.textAlign === 'center') {
            ctx.textAlign = 'center';
            ctx.fillText(p.dateText, p.x + p.w / 2, p.y + p.h / 2);
        } else if (p.textAlign === 'right') {
            ctx.textAlign = 'right';
            ctx.fillText(p.dateText, p.x + p.w, p.y + p.h / 2);
        } else {
            ctx.textAlign = 'left';
            ctx.fillText(p.dateText, p.x, p.y + p.h / 2);
        }
    },
    getProperties() {
        return [
            { key: 'dateText', label: 'Date Text', type: 'text' },
            { key: 'color', label: 'Color', type: 'color' },
            { key: 'fontSize', label: 'Font Size', type: 'number', min: 8, max: 72 },
            { key: 'textAlign', label: 'Align', type: 'select', options: ['left', 'center', 'right'] },
        ];
    }
};

// ───────────────────────────────────────────────
// CATEGORY: VISUALIZERS
// ───────────────────────────────────────────────

LCARSElementTypes['fft-area'] = {
    category: 'Visualizers',
    name: 'FFT Area',
    defaultProps: {
        x: 0, y: 0, w: 120, h: 50,
        barCount: 16,
        barColor: LCARS_COLORS.BLUE,
        barHighColor: LCARS_COLORS.MARS,
        bgColor: '#111122',
        gap: 2,
        borderRadius: 4,
        showBorder: true,
        borderColor: LCARS_COLORS.SKY,
    },
    render(ctx, p) {
        // Background
        ctx.fillStyle = p.bgColor;
        roundedRectPath(ctx, p.x, p.y, p.w, p.h, p.borderRadius);
        ctx.fill();

        if (p.showBorder) {
            ctx.strokeStyle = p.borderColor;
            ctx.lineWidth = 1;
            roundedRectPath(ctx, p.x, p.y, p.w, p.h, p.borderRadius);
            ctx.stroke();
        }

        // Demo bars
        ctx.save();
        ctx.beginPath();
        roundedRectPath(ctx, p.x + 1, p.y + 1, p.w - 2, p.h - 2, Math.max(0, p.borderRadius - 1));
        ctx.clip();

        const pad = 4;
        const innerW = p.w - pad * 2;
        const innerH = p.h - pad * 2;
        const barW = (innerW - (p.barCount - 1) * p.gap) / p.barCount;

        for (let i = 0; i < p.barCount; i++) {
            // Fake FFT shape: higher in middle
            const t = i / (p.barCount - 1);
            const h = innerH * (0.3 + 0.6 * Math.sin(t * Math.PI) * (0.5 + 0.5 * Math.sin(i * 1.7)));
            const bx = p.x + pad + i * (barW + p.gap);
            const by = p.y + pad + innerH - h;

            // Gradient from bar color to high color
            const ratio = h / innerH;
            const bc = hexToRgb(p.barColor);
            const hc = hexToRgb(p.barHighColor);
            const cr = Math.round(bc.r + (hc.r - bc.r) * ratio);
            const cg = Math.round(bc.g + (hc.g - bc.g) * ratio);
            const cb = Math.round(bc.b + (hc.b - bc.b) * ratio);

            ctx.fillStyle = rgbToHex(cr, cg, cb);
            ctx.fillRect(bx, by, barW, h);
        }
        ctx.restore();
    },
    getProperties() {
        return [
            { key: 'barCount', label: 'Bars', type: 'number', min: 2, max: 64 },
            { key: 'barColor', label: 'Bar Color', type: 'color' },
            { key: 'barHighColor', label: 'High Color', type: 'color' },
            { key: 'bgColor', label: 'Background', type: 'color' },
            { key: 'gap', label: 'Gap', type: 'number', min: 0, max: 10 },
            { key: 'borderRadius', label: 'Radius', type: 'number', min: 0, max: 30 },
            { key: 'showBorder', label: 'Border', type: 'checkbox' },
            { key: 'borderColor', label: 'Border Color', type: 'color' },
        ];
    }
};

LCARSElementTypes['progress-bar'] = {
    category: 'Visualizers',
    name: 'Progress Bar',
    defaultProps: {
        x: 0, y: 0, w: 120, h: 14,
        fillPercent: 65,
        fillColor: LCARS_COLORS.ORANGE,
        bgColor: LCARS_COLORS.DARK_GREY,
        capLeft: 'round',
        capRight: 'round',
    },
    render(ctx, p) {
        const r = p.h / 2;
        const rl = p.capLeft === 'round' ? r : 0;
        const rr = p.capRight === 'round' ? r : 0;

        // Background track
        ctx.fillStyle = p.bgColor;
        roundedRectPath(ctx, p.x, p.y, p.w, p.h, { tl: rl, bl: rl, tr: rr, br: rr });
        ctx.fill();

        // Fill
        const fw = p.w * Math.max(0, Math.min(100, p.fillPercent)) / 100;
        if (fw > 0) {
            ctx.fillStyle = p.fillColor;
            const fillRr = fw >= p.w ? rr : 0;
            roundedRectPath(ctx, p.x, p.y, fw, p.h, { tl: rl, bl: rl, tr: fillRr, br: fillRr });
            ctx.fill();
        }
    },
    getProperties() {
        return [
            { key: 'fillPercent', label: 'Fill %', type: 'number', min: 0, max: 100 },
            { key: 'fillColor', label: 'Fill Color', type: 'color' },
            { key: 'bgColor', label: 'Bg Color', type: 'color' },
            { key: 'capLeft', label: 'Left Cap', type: 'select', options: ['flat', 'round'] },
            { key: 'capRight', label: 'Right Cap', type: 'select', options: ['flat', 'round'] },
        ];
    }
};

// ───────────────────────────────────────────────
// CATEGORY: INDICATORS
// ───────────────────────────────────────────────

LCARSElementTypes['status-dot'] = {
    category: 'Indicators',
    name: 'Status Dot',
    defaultProps: {
        x: 0, y: 0, w: 10, h: 10,
        color: LCARS_COLORS.RED,
        shape: 'circle', // circle | square
    },
    render(ctx, p) {
        ctx.fillStyle = p.color;
        if (p.shape === 'circle') {
            const r = Math.min(p.w, p.h) / 2;
            ctx.beginPath();
            ctx.arc(p.x + p.w / 2, p.y + p.h / 2, r, 0, Math.PI * 2);
            ctx.fill();
        } else {
            ctx.fillRect(p.x, p.y, p.w, p.h);
        }
    },
    getProperties() {
        return [
            { key: 'color', label: 'Color', type: 'color' },
            { key: 'shape', label: 'Shape', type: 'select', options: ['circle', 'square'] },
        ];
    }
};

LCARSElementTypes['status-row'] = {
    category: 'Indicators',
    name: 'Status Row',
    defaultProps: {
        x: 0, y: 0, w: 100, h: 8,
        colors: [LCARS_COLORS.RED, LCARS_COLORS.SUNFLOWER, LCARS_COLORS.ORANGE, LCARS_COLORS.BLUE, LCARS_COLORS.BLUE],
        gap: 3,
        shape: 'square', // circle | square
    },
    render(ctx, p) {
        const n = p.colors.length;
        if (n === 0) return;
        const size = p.h;
        const totalW = n * size + (n - 1) * p.gap;
        const startX = p.x;

        for (let i = 0; i < n; i++) {
            ctx.fillStyle = p.colors[i];
            const sx = startX + i * (size + p.gap);
            if (p.shape === 'circle') {
                const r = size / 2;
                ctx.beginPath();
                ctx.arc(sx + r, p.y + r, r, 0, Math.PI * 2);
                ctx.fill();
            } else {
                ctx.fillRect(sx, p.y, size, size);
            }
        }
    },
    getProperties() {
        return [
            { key: 'colors', label: 'Colors', type: 'colorlist' },
            { key: 'gap', label: 'Gap', type: 'number', min: 0, max: 20 },
            { key: 'shape', label: 'Shape', type: 'select', options: ['circle', 'square'] },
        ];
    }
};

LCARSElementTypes['filled-rect'] = {
    category: 'Indicators',
    name: 'Filled Rect',
    defaultProps: {
        x: 0, y: 0, w: 40, h: 30,
        color: LCARS_COLORS.ORANGE,
        radius: 0,
    },
    render(ctx, p) {
        ctx.fillStyle = p.color;
        if (p.radius > 0) {
            roundedRectPath(ctx, p.x, p.y, p.w, p.h, p.radius);
            ctx.fill();
        } else {
            ctx.fillRect(p.x, p.y, p.w, p.h);
        }
    },
    getProperties() {
        return [
            { key: 'color', label: 'Color', type: 'color' },
            { key: 'radius', label: 'Radius', type: 'number', min: 0, max: 50 },
        ];
    }
};

LCARSElementTypes['outline-rect'] = {
    category: 'Indicators',
    name: 'Outline Rect',
    defaultProps: {
        x: 0, y: 0, w: 60, h: 40,
        color: LCARS_COLORS.BLUE,
        radius: 4,
        lineWidth: 2,
    },
    render(ctx, p) {
        ctx.strokeStyle = p.color;
        ctx.lineWidth = p.lineWidth;
        if (p.radius > 0) {
            roundedRectPath(ctx, p.x + p.lineWidth/2, p.y + p.lineWidth/2,
                p.w - p.lineWidth, p.h - p.lineWidth, p.radius);
            ctx.stroke();
        } else {
            ctx.strokeRect(p.x + p.lineWidth/2, p.y + p.lineWidth/2,
                p.w - p.lineWidth, p.h - p.lineWidth);
        }
    },
    getProperties() {
        return [
            { key: 'color', label: 'Color', type: 'color' },
            { key: 'radius', label: 'Radius', type: 'number', min: 0, max: 50 },
            { key: 'lineWidth', label: 'Stroke', type: 'number', min: 1, max: 10 },
        ];
    }
};

// ───────────────────────────────────────────────
// CATEGORY: DECORATIVE
// ───────────────────────────────────────────────

LCARSElementTypes['sweep-arc'] = {
    category: 'Decorative',
    name: 'Sweep Arc',
    defaultProps: {
        x: 0, y: 0, w: 60, h: 60,
        color: LCARS_COLORS.BUTTERSCOTCH,
        startAngle: 0,
        endAngle: 90,
        thickness: 10,
    },
    render(ctx, p) {
        const cx = p.x + p.w / 2;
        const cy = p.y + p.h / 2;
        const outerR = Math.min(p.w, p.h) / 2;
        const innerR = outerR - p.thickness;
        const sa = (p.startAngle - 90) * Math.PI / 180;
        const ea = (p.endAngle - 90) * Math.PI / 180;

        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(cx, cy, outerR, sa, ea);
        ctx.arc(cx, cy, Math.max(0, innerR), ea, sa, true);
        ctx.closePath();
        ctx.fill();
    },
    getProperties() {
        return [
            { key: 'color', label: 'Color', type: 'color' },
            { key: 'startAngle', label: 'Start °', type: 'number', min: 0, max: 360 },
            { key: 'endAngle', label: 'End °', type: 'number', min: 0, max: 360 },
            { key: 'thickness', label: 'Thickness', type: 'number', min: 2, max: 100 },
        ];
    }
};

LCARSElementTypes['bracket-frame'] = {
    category: 'Decorative',
    name: 'Bracket Frame',
    defaultProps: {
        x: 0, y: 0, w: 140, h: 80,
        color: LCARS_COLORS.BUTTERSCOTCH,
        barH: 16,
        barW: 24,
        elbowR: 20,
        innerR: 8,
        gap: 40,
        showBottom: true,
    },
    render(ctx, p) {
        const oR = p.elbowR;
        const iR = p.innerR || 0;
        const cW = Math.max(oR, p.barW + iR);
        const cH = Math.max(oR, p.barH + iR);

        // Top-left elbow
        drawElbow(ctx, p.x, p.y, cW, cH, p.color, 'tl', p.barW, p.barH, oR, iR);
        // Top bar extension
        ctx.fillStyle = p.color;
        if (p.w > cW * 2) ctx.fillRect(p.x + cW, p.y, p.w - cW * 2, p.barH);
        // Top-right elbow
        drawElbow(ctx, p.x + p.w - cW, p.y, cW, cH, p.color, 'tr', p.barW, p.barH, oR, iR);

        // Side bar extensions
        const sideH = p.h - cH * (p.showBottom ? 2 : 1);
        if (sideH > 0) {
            ctx.fillStyle = p.color;
            ctx.fillRect(p.x, p.y + cH, p.barW, sideH);
            ctx.fillRect(p.x + p.w - p.barW, p.y + cH, p.barW, sideH);
        }

        if (p.showBottom) {
            // Bottom-left elbow
            drawElbow(ctx, p.x, p.y + p.h - cH, cW, cH, p.color, 'bl', p.barW, p.barH, oR, iR);
            // Bottom-right elbow
            drawElbow(ctx, p.x + p.w - cW, p.y + p.h - cH, cW, cH, p.color, 'br', p.barW, p.barH, oR, iR);
            // Bottom bar with gap
            ctx.fillStyle = p.color;
            const bottomW = p.w - cW * 2;
            if (bottomW > 0) {
                const halfW = (bottomW - p.gap) / 2;
                if (halfW > 0 && p.gap > 0) {
                    ctx.fillRect(p.x + cW, p.y + p.h - p.barH, halfW, p.barH);
                    ctx.fillRect(p.x + cW + halfW + p.gap, p.y + p.h - p.barH, halfW, p.barH);
                } else {
                    ctx.fillRect(p.x + cW, p.y + p.h - p.barH, bottomW, p.barH);
                }
            }
        }
    },
    getProperties() {
        return [
            { key: 'color', label: 'Color', type: 'color' },
            { key: 'barH', label: 'Bar Height', type: 'number', min: 4, max: 200 },
            { key: 'barW', label: 'Bar Width', type: 'number', min: 4, max: 200 },
            { key: 'elbowR', label: 'Outer Radius', type: 'number', min: 0, max: 200 },
            { key: 'innerR', label: 'Inner Radius', type: 'number', min: 0, max: 200 },
            { key: 'gap', label: 'Bottom Gap', type: 'number', min: 0, max: 200 },
            { key: 'showBottom', label: 'Bottom', type: 'checkbox' },
        ];
    }
};

// ───────────────────────────────────────────────
// CATEGORY: BLOCKS (individual stackable menu items)
// ───────────────────────────────────────────────

LCARSElementTypes['menu-block'] = {
    category: 'Blocks',
    name: 'Menu Block',
    defaultProps: {
        x: 0, y: 0, w: 100, h: 28,
        color: LCARS_COLORS.BUTTERSCOTCH,
        label: 'OVERVIEW',
        fontSize: 11,
        textColor: '#000000',
        textAlign: 'center',
        endCapLeft: 'flat',   // flat | round
        endCapRight: 'round', // flat | round
        bottomGap: 0,         // transparent gap at bottom of bounding box
        topGap: 0,            // transparent gap at top of bounding box
    },
    render(ctx, p) {
        // The colored block draws INSIDE the bounding box, minus the gaps.
        // topGap = transparent space at top, bottomGap = transparent space at bottom.
        // When you stack blocks, their bounding boxes tile and gaps appear naturally.
        const blockY = p.y + (p.topGap || 0);
        const blockH = p.h - (p.topGap || 0) - (p.bottomGap || 0);
        if (blockH <= 0) return;

        const r = blockH / 2;
        const rl = p.endCapLeft === 'round' ? r : 0;
        const rr = p.endCapRight === 'round' ? r : 0;

        ctx.fillStyle = p.color;
        roundedRectPath(ctx, p.x, blockY, p.w, blockH, { tl: rl, bl: rl, tr: rr, br: rr });
        ctx.fill();

        // Label text
        if (p.label) {
            ctx.fillStyle = p.textColor;
            ctx.font = `bold ${p.fontSize}px Antonio, Arial, sans-serif`;
            ctx.textBaseline = 'middle';
            const cy = blockY + blockH / 2 + 1;
            if (p.textAlign === 'left') {
                ctx.textAlign = 'left';
                ctx.fillText(p.label, p.x + (rl > 0 ? rl : 8), cy);
            } else if (p.textAlign === 'right') {
                ctx.textAlign = 'right';
                ctx.fillText(p.label, p.x + p.w - (rr > 0 ? rr : 8), cy);
            } else {
                ctx.textAlign = 'center';
                ctx.fillText(p.label, p.x + p.w / 2, cy);
            }
        }
    },
    getProperties() {
        return [
            { key: 'color', label: 'Color', type: 'color' },
            { key: 'label', label: 'Label', type: 'text' },
            { key: 'fontSize', label: 'Font Size', type: 'number', min: 6, max: 36 },
            { key: 'textColor', label: 'Text Color', type: 'color' },
            { key: 'textAlign', label: 'Text Align', type: 'select', options: ['left', 'center', 'right'] },
            { key: 'endCapLeft', label: 'Left Cap', type: 'select', options: ['flat', 'round'] },
            { key: 'endCapRight', label: 'Right Cap', type: 'select', options: ['flat', 'round'] },
            { key: 'bottomGap', label: 'Bottom Gap', type: 'number', min: 0, max: 40 },
            { key: 'topGap', label: 'Top Gap', type: 'number', min: 0, max: 40 },
        ];
    }
};

// ───────────────────────────────────────────────
// CATEGORY: DATA DISPLAYS
// ───────────────────────────────────────────────

LCARSElementTypes['large-number'] = {
    category: 'Data Displays',
    name: 'Large Number',
    defaultProps: {
        x: 0, y: 0, w: 80, h: 36,
        value: '157',
        label: 'LABORATORY',
        valueColor: LCARS_COLORS.ORANGE,
        labelColor: LCARS_COLORS.LAVENDER,
        valueFontSize: 28,
        labelFontSize: 10,
        bgColor: '',
        bgRadius: 4,
        layout: 'side', // side | stacked
    },
    render(ctx, p) {
        if (p.bgColor) {
            ctx.fillStyle = p.bgColor;
            roundedRectPath(ctx, p.x, p.y, p.w, p.h, p.bgRadius);
            ctx.fill();
        }

        if (p.layout === 'stacked') {
            // Value on top, label below
            ctx.fillStyle = p.valueColor;
            ctx.font = `bold ${p.valueFontSize}px Antonio, Arial, sans-serif`;
            ctx.textAlign = 'left';
            ctx.textBaseline = 'top';
            ctx.fillText(p.value, p.x + 4, p.y + 2);

            ctx.fillStyle = p.labelColor;
            ctx.font = `bold ${p.labelFontSize}px Antonio, Arial, sans-serif`;
            ctx.textAlign = 'left';
            ctx.textBaseline = 'bottom';
            ctx.fillText(p.label, p.x + 4, p.y + p.h - 2);
        } else {
            // Number on left, label on right
            ctx.fillStyle = p.valueColor;
            ctx.font = `bold ${p.valueFontSize}px Antonio, Arial, sans-serif`;
            ctx.textAlign = 'right';
            ctx.textBaseline = 'middle';
            const numW = ctx.measureText(p.value).width;
            ctx.fillText(p.value, p.x + Math.min(numW + 8, p.w * 0.5), p.y + p.h / 2);

            ctx.fillStyle = p.labelColor;
            ctx.font = `bold ${p.labelFontSize}px Antonio, Arial, sans-serif`;
            ctx.textAlign = 'left';
            ctx.textBaseline = 'middle';
            ctx.fillText(p.label, p.x + Math.min(numW + 14, p.w * 0.5 + 6), p.y + p.h / 2);
        }
    },
    getProperties() {
        return [
            { key: 'value', label: 'Value', type: 'text' },
            { key: 'label', label: 'Label', type: 'text' },
            { key: 'valueColor', label: 'Value Color', type: 'color' },
            { key: 'labelColor', label: 'Label Color', type: 'color' },
            { key: 'valueFontSize', label: 'Value Size', type: 'number', min: 10, max: 72 },
            { key: 'labelFontSize', label: 'Label Size', type: 'number', min: 6, max: 36 },
            { key: 'bgColor', label: 'Background', type: 'color' },
            { key: 'layout', label: 'Layout', type: 'select', options: ['side', 'stacked'] },
        ];
    }
};

LCARSElementTypes['number-grid'] = {
    category: 'Data Displays',
    name: 'Number Grid',
    defaultProps: {
        x: 0, y: 0, w: 140, h: 50,
        cols: 7,
        rows: 4,
        cellGap: 2,
        color: LCARS_COLORS.BUTTERSCOTCH,
        fontSize: 7,
        textColor: '#000000',
    },
    render(ctx, p) {
        const cellW = (p.w - (p.cols - 1) * p.cellGap) / p.cols;
        const cellH = (p.h - (p.rows - 1) * p.cellGap) / p.rows;

        ctx.font = `bold ${p.fontSize}px Antonio, Consolas, monospace`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        for (let row = 0; row < p.rows; row++) {
            for (let col = 0; col < p.cols; col++) {
                const cx = p.x + col * (cellW + p.cellGap);
                const cy = p.y + row * (cellH + p.cellGap);

                ctx.fillStyle = p.color;
                ctx.fillRect(cx, cy, cellW, cellH);

                // Random-looking number for display
                const num = ((row * 7 + col * 13 + 47) * 97 % 9000 + 1000).toString();
                ctx.fillStyle = p.textColor;
                ctx.fillText(num, cx + cellW / 2, cy + cellH / 2 + 1);
            }
        }
    },
    getProperties() {
        return [
            { key: 'cols', label: 'Columns', type: 'number', min: 1, max: 20 },
            { key: 'rows', label: 'Rows', type: 'number', min: 1, max: 20 },
            { key: 'cellGap', label: 'Gap', type: 'number', min: 0, max: 10 },
            { key: 'color', label: 'Cell Color', type: 'color' },
            { key: 'fontSize', label: 'Font Size', type: 'number', min: 4, max: 24 },
            { key: 'textColor', label: 'Text Color', type: 'color' },
        ];
    }
};

LCARSElementTypes['title-bar'] = {
    category: 'Data Displays',
    name: 'Title Bar',
    defaultProps: {
        x: 0, y: 0, w: 180, h: 22,
        text: 'WEATHER SENSORS SUBSYSTEM',
        color: LCARS_COLORS.ORANGE,
        fontSize: 13,
        bgColor: '',
        bgHeight: 2,
        textAlign: 'center',
        underline: true,
        underlineColor: LCARS_COLORS.ORANGE,
    },
    render(ctx, p) {
        if (p.bgColor) {
            ctx.fillStyle = p.bgColor;
            ctx.fillRect(p.x, p.y, p.w, p.h);
        }

        // Underline
        if (p.underline) {
            ctx.fillStyle = p.underlineColor;
            ctx.fillRect(p.x, p.y + p.h - p.bgHeight, p.w, p.bgHeight);
        }

        // Text
        ctx.fillStyle = p.color;
        ctx.font = `bold ${p.fontSize}px Antonio, Arial, sans-serif`;
        ctx.textBaseline = 'middle';
        if (p.textAlign === 'center') {
            ctx.textAlign = 'center';
            ctx.fillText(p.text, p.x + p.w / 2, p.y + (p.h - p.bgHeight) / 2);
        } else if (p.textAlign === 'right') {
            ctx.textAlign = 'right';
            ctx.fillText(p.text, p.x + p.w - 4, p.y + (p.h - p.bgHeight) / 2);
        } else {
            ctx.textAlign = 'left';
            ctx.fillText(p.text, p.x + 4, p.y + (p.h - p.bgHeight) / 2);
        }
    },
    getProperties() {
        return [
            { key: 'text', label: 'Text', type: 'text' },
            { key: 'color', label: 'Color', type: 'color' },
            { key: 'fontSize', label: 'Font Size', type: 'number', min: 8, max: 48 },
            { key: 'textAlign', label: 'Align', type: 'select', options: ['left', 'center', 'right'] },
            { key: 'underline', label: 'Underline', type: 'checkbox' },
            { key: 'underlineColor', label: 'Line Color', type: 'color' },
            { key: 'bgColor', label: 'Background', type: 'color' },
        ];
    }
};

LCARSElementTypes['inner-panel'] = {
    category: 'Data Displays',
    name: 'Inner Panel',
    defaultProps: {
        x: 0, y: 0, w: 140, h: 80,
        borderColor: LCARS_COLORS.LAVENDER,
        borderWidth: 3,
        borderRadius: 16,
        bgColor: '#000000',
        headerText: 'INTERNAL SENSOR STATUS',
        headerColor: LCARS_COLORS.LAVENDER,
        headerFontSize: 8,
    },
    render(ctx, p) {
        // Fill background
        ctx.fillStyle = p.bgColor;
        roundedRectPath(ctx, p.x, p.y, p.w, p.h, p.borderRadius);
        ctx.fill();

        // Border
        ctx.strokeStyle = p.borderColor;
        ctx.lineWidth = p.borderWidth;
        roundedRectPath(ctx, p.x + p.borderWidth / 2, p.y + p.borderWidth / 2,
            p.w - p.borderWidth, p.h - p.borderWidth, Math.max(0, p.borderRadius - p.borderWidth / 2));
        ctx.stroke();

        // Header text (top center, inside border)
        if (p.headerText) {
            // Header background stripe
            const hh = p.headerFontSize + 6;
            ctx.save();
            roundedRectPath(ctx, p.x + p.borderWidth, p.y + p.borderWidth,
                p.w - p.borderWidth * 2, p.h - p.borderWidth * 2,
                Math.max(0, p.borderRadius - p.borderWidth));
            ctx.clip();

            // Divider line under header
            ctx.fillStyle = p.borderColor;
            ctx.fillRect(p.x + p.borderWidth + 8, p.y + p.borderWidth + hh, p.w - p.borderWidth * 2 - 16, 1);

            ctx.fillStyle = p.headerColor;
            ctx.font = `bold ${p.headerFontSize}px Antonio, Arial, sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(p.headerText, p.x + p.w / 2, p.y + p.borderWidth + hh / 2);
            ctx.restore();
        }
    },
    getProperties() {
        return [
            { key: 'borderColor', label: 'Border Color', type: 'color' },
            { key: 'borderWidth', label: 'Border Width', type: 'number', min: 1, max: 10 },
            { key: 'borderRadius', label: 'Radius', type: 'number', min: 0, max: 40 },
            { key: 'bgColor', label: 'Background', type: 'color' },
            { key: 'headerText', label: 'Header', type: 'text' },
            { key: 'headerColor', label: 'Header Color', type: 'color' },
            { key: 'headerFontSize', label: 'Header Size', type: 'number', min: 6, max: 24 },
        ];
    }
};

LCARSElementTypes['hatched-bar'] = {
    category: 'Data Displays',
    name: 'Hatched Bar',
    defaultProps: {
        x: 0, y: 0, w: 140, h: 16,
        fillPercent: 70,
        fillColor: LCARS_COLORS.PEACH,
        bgColor: LCARS_COLORS.DARK_GREY,
        hatchSpacing: 3,
        hatchWidth: 1,
        hatchColor: '#000000',
        label: 'INSIDE',
        labelColor: LCARS_COLORS.ORANGE,
        labelFontSize: 11,
        valueText: '22 DEGREES',
        valueColor: LCARS_COLORS.ORANGE,
        valueFontSize: 11,
    },
    render(ctx, p) {
        // Background track
        ctx.fillStyle = p.bgColor;
        ctx.fillRect(p.x, p.y, p.w, p.h);

        // Fill portion
        const fw = p.w * Math.max(0, Math.min(100, p.fillPercent)) / 100;
        if (fw > 0) {
            ctx.fillStyle = p.fillColor;
            ctx.fillRect(p.x, p.y, fw, p.h);

            // Hatch lines
            ctx.save();
            ctx.beginPath();
            ctx.rect(p.x, p.y, fw, p.h);
            ctx.clip();
            ctx.fillStyle = p.hatchColor;
            for (let hx = p.x; hx < p.x + fw; hx += p.hatchSpacing + p.hatchWidth) {
                ctx.fillRect(hx, p.y, p.hatchWidth, p.h);
            }
            ctx.restore();
        }

        // Label (left of bar)
        if (p.label) {
            ctx.fillStyle = p.labelColor;
            ctx.font = `bold ${p.labelFontSize}px Antonio, Arial, sans-serif`;
            ctx.textAlign = 'right';
            ctx.textBaseline = 'middle';
            ctx.fillText(p.label, p.x - 8, p.y + p.h / 2 + 1);
        }

        // Value text (right of bar)
        if (p.valueText) {
            ctx.fillStyle = p.valueColor;
            ctx.font = `bold ${p.valueFontSize}px Antonio, Arial, sans-serif`;
            ctx.textAlign = 'left';
            ctx.textBaseline = 'middle';
            ctx.fillText(p.valueText, p.x + p.w + 8, p.y + p.h / 2 + 1);
        }
    },
    getProperties() {
        return [
            { key: 'fillPercent', label: 'Fill %', type: 'number', min: 0, max: 100 },
            { key: 'fillColor', label: 'Fill Color', type: 'color' },
            { key: 'bgColor', label: 'Bg Color', type: 'color' },
            { key: 'hatchSpacing', label: 'Hatch Gap', type: 'number', min: 1, max: 20 },
            { key: 'hatchWidth', label: 'Hatch Width', type: 'number', min: 1, max: 5 },
            { key: 'hatchColor', label: 'Hatch Color', type: 'color' },
            { key: 'label', label: 'Label', type: 'text' },
            { key: 'labelColor', label: 'Label Color', type: 'color' },
            { key: 'valueText', label: 'Value Text', type: 'text' },
            { key: 'valueColor', label: 'Value Color', type: 'color' },
        ];
    }
};

// ───────────────────────────────────────────────
// CATEGORY: DECORATIVE (additional)
// ───────────────────────────────────────────────

LCARSElementTypes['chip-strip'] = {
    category: 'Decorative',
    name: 'Chip Strip',
    defaultProps: {
        x: 0, y: 0, w: 150, h: 12,
        colors: [LCARS_COLORS.BUTTERSCOTCH, LCARS_COLORS.SUNFLOWER, LCARS_COLORS.PEACH,
                 LCARS_COLORS.MAGENTA, LCARS_COLORS.BLUE, LCARS_COLORS.ICE],
        widths: [30, 20, 25, 15, 30, 30],
        gap: 3,
        radius: 0,
    },
    render(ctx, p) {
        const n = p.colors.length;
        let cx = p.x;
        for (let i = 0; i < n; i++) {
            const cw = p.widths[i % p.widths.length] || 20;
            ctx.fillStyle = p.colors[i % p.colors.length];
            if (p.radius > 0) {
                roundedRectPath(ctx, cx, p.y, cw, p.h, p.radius);
                ctx.fill();
            } else {
                ctx.fillRect(cx, p.y, cw, p.h);
            }
            cx += cw + p.gap;
        }
    },
    getProperties() {
        return [
            { key: 'colors', label: 'Colors', type: 'colorlist' },
            { key: 'gap', label: 'Gap', type: 'number', min: 0, max: 20 },
            { key: 'radius', label: 'Radius', type: 'number', min: 0, max: 20 },
        ];
    }
};

LCARSElementTypes['pill-row'] = {
    category: 'Decorative',
    name: 'Pill Row',
    defaultProps: {
        x: 0, y: 0, w: 200, h: 20,
        labels: ['INTERNAL', 'EXTERNAL LOW RANGE', 'EXTERNAL WIDE RANGE'],
        colors: [LCARS_COLORS.ICE, LCARS_COLORS.ICE, LCARS_COLORS.ICE],
        gap: 8,
        fontSize: 8,
        textColor: '#000000',
    },
    render(ctx, p) {
        const n = p.labels.length;
        if (n === 0) return;

        // Measure labels to compute widths
        ctx.font = `bold ${p.fontSize}px Antonio, Arial, sans-serif`;
        const padX = p.h * 0.75;
        const widths = p.labels.map(l => ctx.measureText(l).width + padX * 2);
        let cx = p.x;

        for (let i = 0; i < n; i++) {
            const color = p.colors[i % p.colors.length];
            ctx.fillStyle = color;
            roundedRectPath(ctx, cx, p.y, widths[i], p.h, p.h / 2);
            ctx.fill();

            ctx.fillStyle = p.textColor;
            ctx.font = `bold ${p.fontSize}px Antonio, Arial, sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(p.labels[i], cx + widths[i] / 2, p.y + p.h / 2 + 1);

            cx += widths[i] + p.gap;
        }
    },
    getProperties() {
        return [
            { key: 'labels', label: 'Labels', type: 'textlist' },
            { key: 'colors', label: 'Colors', type: 'colorlist' },
            { key: 'gap', label: 'Gap', type: 'number', min: 0, max: 30 },
            { key: 'fontSize', label: 'Font Size', type: 'number', min: 6, max: 24 },
            { key: 'textColor', label: 'Text Color', type: 'color' },
        ];
    }
};

LCARSElementTypes['crosshatch-block'] = {
    category: 'Decorative',
    name: 'Crosshatch',
    defaultProps: {
        x: 0, y: 0, w: 60, h: 40,
        color: LCARS_COLORS.ORANGE,
        lineSpacing: 4,
        lineWidth: 1,
        radius: 0,
    },
    render(ctx, p) {
        ctx.save();
        if (p.radius > 0) {
            roundedRectPath(ctx, p.x, p.y, p.w, p.h, p.radius);
            ctx.clip();
        } else {
            ctx.beginPath();
            ctx.rect(p.x, p.y, p.w, p.h);
            ctx.clip();
        }

        ctx.strokeStyle = p.color;
        ctx.lineWidth = p.lineWidth;

        // Diagonal lines (/)
        for (let d = -p.h; d < p.w + p.h; d += p.lineSpacing) {
            ctx.beginPath();
            ctx.moveTo(p.x + d, p.y + p.h);
            ctx.lineTo(p.x + d + p.h, p.y);
            ctx.stroke();
        }
        ctx.restore();
    },
    getProperties() {
        return [
            { key: 'color', label: 'Color', type: 'color' },
            { key: 'lineSpacing', label: 'Spacing', type: 'number', min: 2, max: 20 },
            { key: 'lineWidth', label: 'Line Width', type: 'number', min: 0.5, max: 5 },
            { key: 'radius', label: 'Radius', type: 'number', min: 0, max: 30 },
        ];
    }
};

LCARSElementTypes['starship-silhouette'] = {
    category: 'Decorative',
    name: 'Grid Pattern',
    defaultProps: {
        x: 0, y: 0, w: 80, h: 60,
        cols: 4,
        rows: 3,
        gap: 3,
        colors: [LCARS_COLORS.ORANGE, LCARS_COLORS.BUTTERSCOTCH, LCARS_COLORS.PEACH,
                 LCARS_COLORS.LAVENDER, LCARS_COLORS.VIOLET, LCARS_COLORS.BLUE,
                 LCARS_COLORS.ORANGE, LCARS_COLORS.SUNFLOWER, LCARS_COLORS.MAGENTA,
                 LCARS_COLORS.BUTTERSCOTCH, LCARS_COLORS.ORANGE, LCARS_COLORS.PEACH],
        radius: 2,
    },
    render(ctx, p) {
        const cw = (p.w - (p.cols - 1) * p.gap) / p.cols;
        const ch = (p.h - (p.rows - 1) * p.gap) / p.rows;
        let idx = 0;

        for (let row = 0; row < p.rows; row++) {
            for (let col = 0; col < p.cols; col++) {
                const cx = p.x + col * (cw + p.gap);
                const cy = p.y + row * (ch + p.gap);
                ctx.fillStyle = p.colors[idx % p.colors.length];
                if (p.radius > 0) {
                    roundedRectPath(ctx, cx, cy, cw, ch, p.radius);
                    ctx.fill();
                } else {
                    ctx.fillRect(cx, cy, cw, ch);
                }
                idx++;
            }
        }
    },
    getProperties() {
        return [
            { key: 'cols', label: 'Columns', type: 'number', min: 1, max: 12 },
            { key: 'rows', label: 'Rows', type: 'number', min: 1, max: 12 },
            { key: 'gap', label: 'Gap', type: 'number', min: 0, max: 10 },
            { key: 'colors', label: 'Colors', type: 'colorlist' },
            { key: 'radius', label: 'Radius', type: 'number', min: 0, max: 20 },
        ];
    }
};

LCARSElementTypes['event-log'] = {
    category: 'Data Displays',
    name: 'Event Log',
    defaultProps: {
        x: 0, y: 0, w: 160, h: 80,
        lines: [
            'STAR DATE 2013-09-00',
            'LAVALAMP SWITCHED ON',
            'STAR DATE 2013-08-00',
            'DESKLAMP SWITCHED OFF',
            'STAR DATE 2013-08-00',
            'LAVALAMP SWITCHED ON',
        ],
        color: LCARS_COLORS.ORANGE,
        fontSize: 7,
        lineHeight: 10,
    },
    render(ctx, p) {
        ctx.fillStyle = p.color;
        ctx.font = `${p.fontSize}px Antonio, Arial, sans-serif`;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';

        const maxLines = Math.floor(p.h / p.lineHeight);
        for (let i = 0; i < Math.min(p.lines.length, maxLines); i++) {
            ctx.fillText(p.lines[i], p.x + 2, p.y + i * p.lineHeight);
        }
    },
    getProperties() {
        return [
            { key: 'color', label: 'Color', type: 'color' },
            { key: 'fontSize', label: 'Font Size', type: 'number', min: 5, max: 18 },
            { key: 'lineHeight', label: 'Line Height', type: 'number', min: 6, max: 30 },
        ];
    }
};

LCARSElementTypes['labeled-value-row'] = {
    category: 'Data Displays',
    name: 'Label-Value Row',
    defaultProps: {
        x: 0, y: 0, w: 200, h: 16,
        label: 'ONE WIRE BUS STATUS',
        value: 'CONNECTED',
        labelColor: LCARS_COLORS.WHITE,
        valueColor: LCARS_COLORS.WHITE,
        fontSize: 10,
        valueFontSize: 10,
        separator: '',
    },
    render(ctx, p) {
        ctx.textBaseline = 'middle';
        const cy = p.y + p.h / 2;

        // Label
        ctx.fillStyle = p.labelColor;
        ctx.font = `bold ${p.fontSize}px Antonio, Arial, sans-serif`;
        ctx.textAlign = 'left';
        ctx.fillText(p.label, p.x, cy);

        // Value (right-aligned)
        ctx.fillStyle = p.valueColor;
        ctx.font = `bold ${p.valueFontSize}px Antonio, Arial, sans-serif`;
        ctx.textAlign = 'right';
        ctx.fillText(p.value, p.x + p.w, cy);
    },
    getProperties() {
        return [
            { key: 'label', label: 'Label', type: 'text' },
            { key: 'value', label: 'Value', type: 'text' },
            { key: 'labelColor', label: 'Label Color', type: 'color' },
            { key: 'valueColor', label: 'Value Color', type: 'color' },
            { key: 'fontSize', label: 'Font Size', type: 'number', min: 6, max: 36 },
            { key: 'valueFontSize', label: 'Value Size', type: 'number', min: 6, max: 36 },
        ];
    }
};

// Helper: build categories from element types
function getElementCategories() {
    const cats = {};
    const categoryOrder = ['Structural', 'Blocks', 'Buttons', 'Data Displays', 'Data Panels', 'Visualizers', 'Indicators', 'Decorative'];
    for (const [typeId, def] of Object.entries(LCARSElementTypes)) {
        if (!cats[def.category]) cats[def.category] = [];
        cats[def.category].push({ typeId, ...def });
    }
    // Return in desired order
    const ordered = {};
    for (const cat of categoryOrder) {
        if (cats[cat]) ordered[cat] = cats[cat];
    }
    // Any remaining categories
    for (const [cat, items] of Object.entries(cats)) {
        if (!ordered[cat]) ordered[cat] = items;
    }
    return ordered;
}
