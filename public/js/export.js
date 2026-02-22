/* ============================================
   Export Module
   Generates C/C++ header, PNG, and JSON
   from the current layout.
   ============================================ */

class Exporter {
    constructor(renderer) {
        this.renderer = renderer;
    }

    // ───── C/C++ Header Export ─────
    // Generates TFT_eSPI / Adafruit GFX compatible draw calls

    exportCpp() {
        const r = this.renderer;
        const lines = [];
        const indent = '    ';

        lines.push('// ============================================');
        lines.push('// LCARS UI Layout — Auto-generated');
        lines.push(`// Display: ${r.displayWidth}x${r.displayHeight}, corner radius: ${r.cornerRadius}`);
        lines.push('// ============================================');
        lines.push('');
        lines.push('#pragma once');
        lines.push('#include <TFT_eSPI.h>');
        lines.push('');

        // Color definitions
        lines.push('// LCARS Colors (RGB565)');
        const usedColors = new Set();
        for (const el of r.elements) {
            this._collectColors(el.props, usedColors);
        }
        usedColors.add(r.bgColor);

        let colorIndex = 0;
        const colorNames = {};
        for (const hex of usedColors) {
            const name = 'LCARS_COLOR_' + colorIndex;
            const rgb565 = hexToRgb565(hex);
            lines.push(`#define ${name} 0x${rgb565.toString(16).toUpperCase().padStart(4, '0')}  // ${hex}`);
            colorNames[hex] = name;
            colorIndex++;
        }
        lines.push('');

        // LCARS elbow helper function
        lines.push('// Helper: Draw LCARS elbow with rounded outer and inner corners');
        lines.push('// corner: 0=TL, 1=TR, 2=BL, 3=BR');
        lines.push('void drawLCARSElbow(TFT_eSPI &tft, int16_t x, int16_t y, int16_t w, int16_t h,');
        lines.push('                    uint16_t color, uint8_t corner,');
        lines.push('                    int16_t barW, int16_t barH, int16_t oR, int16_t iR) {');
        lines.push('    // Outer corner via scanline-filled quarter circle');
        lines.push('    auto quarterArc = [&](int cx, int cy, int r, uint16_t c, int qx, int qy) {');
        lines.push('        for (int j = 0; j <= r; j++) {');
        lines.push('            int d = (int)sqrt((float)r*r - (float)j*j);');
        lines.push('            if (qx < 0 && qy < 0) tft.drawFastHLine(cx - d, cy - j, d, c);');
        lines.push('            else if (qx > 0 && qy < 0) tft.drawFastHLine(cx, cy - j, d, c);');
        lines.push('            else if (qx < 0 && qy > 0) tft.drawFastHLine(cx - d, cy + j, d, c);');
        lines.push('            else tft.drawFastHLine(cx, cy + j, d, c);');
        lines.push('        }');
        lines.push('    };');
        lines.push('    switch (corner) {');
        lines.push('        case 0: // TL');
        lines.push('            quarterArc(x + oR, y + oR, oR, color, -1, -1);');
        lines.push('            tft.fillRect(x + oR, y, w - oR, barH, color);');
        lines.push('            tft.fillRect(x, y + oR, barW, h - oR, color);');
        lines.push('            if (iR > 0) {');
        lines.push('                tft.fillRect(x+barW, y+barH, iR, iR, TFT_BLACK);');
        lines.push('                quarterArc(x+barW+iR, y+barH+iR, iR, color, -1, -1);');
        lines.push('            }');
        lines.push('            break;');
        lines.push('        case 1: // TR');
        lines.push('            quarterArc(x + w - 1 - oR, y + oR, oR, color, 1, -1);');
        lines.push('            tft.fillRect(x, y, w - oR, barH, color);');
        lines.push('            tft.fillRect(x + w - barW, y + oR, barW, h - oR, color);');
        lines.push('            if (iR > 0) {');
        lines.push('                tft.fillRect(x+w-barW-iR, y+barH, iR, iR, TFT_BLACK);');
        lines.push('                quarterArc(x+w-barW-iR, y+barH+iR, iR, color, 1, -1);');
        lines.push('            }');
        lines.push('            break;');
        lines.push('        case 2: // BL');
        lines.push('            quarterArc(x + oR, y + h - 1 - oR, oR, color, -1, 1);');
        lines.push('            tft.fillRect(x + oR, y + h - barH, w - oR, barH, color);');
        lines.push('            tft.fillRect(x, y, barW, h - oR, color);');
        lines.push('            if (iR > 0) {');
        lines.push('                tft.fillRect(x+barW, y+h-barH-iR, iR, iR, TFT_BLACK);');
        lines.push('                quarterArc(x+barW+iR, y+h-barH-iR, iR, color, -1, 1);');
        lines.push('            }');
        lines.push('            break;');
        lines.push('        case 3: // BR');
        lines.push('            quarterArc(x + w - 1 - oR, y + h - 1 - oR, oR, color, 1, 1);');
        lines.push('            tft.fillRect(x, y + h - barH, w - oR, barH, color);');
        lines.push('            tft.fillRect(x + w - barW, y, barW, h - oR, color);');
        lines.push('            if (iR > 0) {');
        lines.push('                tft.fillRect(x+w-barW-iR, y+h-barH-iR, iR, iR, TFT_BLACK);');
        lines.push('                quarterArc(x+w-barW-iR, y+h-barH-iR, iR, color, 1, 1);');
        lines.push('            }');
        lines.push('            break;');
        lines.push('    }');
        lines.push('}');
        lines.push('');

        lines.push('void drawLCARSLayout(TFT_eSPI &tft) {');

        // Background
        if (r.cornerRadius > 0) {
            lines.push(`${indent}// Background with rounded corners`);
            lines.push(`${indent}tft.fillScreen(TFT_BLACK);`);
            lines.push(`${indent}tft.fillRoundRect(0, 0, ${r.displayWidth}, ${r.displayHeight}, ${r.cornerRadius}, ${colorNames[r.bgColor]});`);
        } else {
            lines.push(`${indent}tft.fillScreen(${colorNames[r.bgColor]});`);
        }
        lines.push('');

        // Elements
        for (const el of r.elements) {
            if (!el.visible) continue;
            lines.push(`${indent}// ${el.name} (${el.type})`);
            const cmds = this._elementToCpp(el, colorNames, indent);
            lines.push(...cmds);
            lines.push('');
        }

        lines.push('}');
        lines.push('');

        // Dynamic data draw function stub
        lines.push('// Call this function to update dynamic data (time, temp, FFT, etc.)');
        lines.push('void updateLCARSData(TFT_eSPI &tft) {');
        lines.push(`${indent}// TODO: Update dynamic elements here`);

        for (const el of r.elements) {
            if (!el.visible) continue;
            const p = el.props;
            if (el.type === 'clock-display') {
                lines.push(`${indent}// Clock at (${p.x}, ${p.y}): tft.drawString(timeStr, ${p.x}, ${p.y});`);
            } else if (el.type === 'date-display') {
                lines.push(`${indent}// Date at (${p.x}, ${p.y}): tft.drawString(dateStr, ${p.x}, ${p.y});`);
            } else if (el.type === 'data-readout') {
                lines.push(`${indent}// Data "${p.label}" at (${p.x}, ${p.y}): update value text`);
            } else if (el.type === 'fft-area') {
                lines.push(`${indent}// FFT area at (${p.x}, ${p.y}, ${p.w}x${p.h}): draw bars from spectrum data`);
            } else if (el.type === 'progress-bar') {
                lines.push(`${indent}// Progress bar at (${p.x}, ${p.y}, ${p.w}x${p.h}): update fill width`);
            }
        }

        lines.push('}');

        return lines.join('\n');
    }

    _collectColors(props, set) {
        for (const [k, v] of Object.entries(props)) {
            if (typeof v === 'string' && v.match(/^#[0-9A-Fa-f]{6}$/)) {
                set.add(v);
            }
            if (Array.isArray(v)) {
                for (const item of v) {
                    if (typeof item === 'string' && item.match(/^#[0-9A-Fa-f]{6}$/)) {
                        set.add(item);
                    }
                }
            }
        }
    }

    _elementToCpp(el, colorNames, indent) {
        const p = el.props;
        const lines = [];
        const cn = (hex) => colorNames[hex] || `0x${hexToRgb565(hex).toString(16).toUpperCase().padStart(4, '0')}`;

        switch (el.type) {
            case 'elbow-tl':
            case 'elbow-tr': {
                const ci1 = el.type === 'elbow-tl' ? 0 : 1;
                const oR1 = p.outerR || 30;
                const iR1 = p.innerR || 0;
                const bGap = p.bottomGap || 0;
                lines.push(`${indent}drawLCARSElbow(tft, ${p.x}, ${p.y}, ${p.w}, ${p.h - bGap}, ${cn(p.color)}, ${ci1}, ${p.barW}, ${p.barH}, ${oR1}, ${iR1});`);
                break;
            }
            case 'elbow-bl':
            case 'elbow-br': {
                const ci2 = el.type === 'elbow-bl' ? 2 : 3;
                const oR2 = p.outerR || 30;
                const iR2 = p.innerR || 0;
                const tGap = p.topGap || 0;
                lines.push(`${indent}drawLCARSElbow(tft, ${p.x}, ${p.y + tGap}, ${p.w}, ${p.h - tGap}, ${cn(p.color)}, ${ci2}, ${p.barW}, ${p.barH}, ${oR2}, ${iR2});`);
                break;
            }

            case 'bar-horizontal': {
                const ht = p.topGap || 0, hb = p.bottomGap || 0, hl = p.leftGap || 0, hr = p.rightGap || 0;
                const hx = p.x + hl, hy = p.y + ht, hw = p.w - hl - hr, hh = p.h - ht - hb;
                if (p.endCapLeft === 'round' || p.endCapRight === 'round') {
                    const r = Math.floor(hh / 2);
                    lines.push(`${indent}tft.fillRoundRect(${hx}, ${hy}, ${hw}, ${hh}, ${r}, ${cn(p.color)});`);
                    if (p.endCapLeft === 'flat') {
                        lines.push(`${indent}tft.fillRect(${hx}, ${hy}, ${r}, ${hh}, ${cn(p.color)});`);
                    }
                    if (p.endCapRight === 'flat') {
                        lines.push(`${indent}tft.fillRect(${hx + hw - r}, ${hy}, ${r}, ${hh}, ${cn(p.color)});`);
                    }
                } else {
                    lines.push(`${indent}tft.fillRect(${hx}, ${hy}, ${hw}, ${hh}, ${cn(p.color)});`);
                }
                break;
            }

            case 'bar-vertical': {
                const vt = p.topGap || 0, vb = p.bottomGap || 0, vl = p.leftGap || 0, vr = p.rightGap || 0;
                const vx = p.x + vl, vy = p.y + vt, vw = p.w - vl - vr, vh = p.h - vt - vb;
                if (p.endCapTop === 'round' || p.endCapBottom === 'round') {
                    const r = Math.floor(vw / 2);
                    lines.push(`${indent}tft.fillRoundRect(${vx}, ${vy}, ${vw}, ${vh}, ${r}, ${cn(p.color)});`);
                    if (p.endCapTop === 'flat') {
                        lines.push(`${indent}tft.fillRect(${vx}, ${vy}, ${vw}, ${r}, ${cn(p.color)});`);
                    }
                    if (p.endCapBottom === 'flat') {
                        lines.push(`${indent}tft.fillRect(${vx}, ${vy + vh - r}, ${vw}, ${r}, ${cn(p.color)});`);
                    }
                } else {
                    lines.push(`${indent}tft.fillRect(${vx}, ${vy}, ${vw}, ${vh}, ${cn(p.color)});`);
                }
                break;
            }



            case 'separator':
                lines.push(`${indent}tft.fillRect(${p.x}, ${p.y}, ${p.w}, ${p.h}, ${cn(p.color)});`);
                break;

            case 'button-pill': {
                const r = Math.floor(p.h / 2);
                lines.push(`${indent}tft.fillRoundRect(${p.x}, ${p.y}, ${p.w}, ${p.h}, ${r}, ${cn(p.color)});`);
                lines.push(`${indent}tft.setTextColor(${cn(p.textColor)});`);
                lines.push(`${indent}tft.setTextSize(1);`);
                lines.push(`${indent}tft.setTextDatum(MC_DATUM);`);
                lines.push(`${indent}tft.drawString("${p.label}", ${p.x + Math.round(p.w / 2)}, ${p.y + Math.round(p.h / 2)});`);
                break;
            }

            case 'button-rect': {
                if (p.radius > 0) {
                    lines.push(`${indent}tft.fillRoundRect(${p.x}, ${p.y}, ${p.w}, ${p.h}, ${p.radius}, ${cn(p.color)});`);
                } else {
                    lines.push(`${indent}tft.fillRect(${p.x}, ${p.y}, ${p.w}, ${p.h}, ${cn(p.color)});`);
                }
                lines.push(`${indent}tft.setTextColor(${cn(p.textColor)});`);
                lines.push(`${indent}tft.setTextDatum(MC_DATUM);`);
                lines.push(`${indent}tft.drawString("${p.label}", ${p.x + Math.round(p.w / 2)}, ${p.y + Math.round(p.h / 2)});`);
                break;
            }

            case 'button-strip': {
                const n = p.colors.length;
                const totalGap = p.gap * (n - 1);
                const segW = Math.floor((p.w - totalGap) / n);
                for (let i = 0; i < n; i++) {
                    const sx = p.x + i * (segW + p.gap);
                    const isFirst = i === 0;
                    const isLast = i === n - 1;
                    const hasRound = (isFirst && p.capLeft === 'round') || (isLast && p.capRight === 'round');
                    if (hasRound) {
                        const r = Math.floor(p.h / 2);
                        lines.push(`${indent}tft.fillRoundRect(${sx}, ${p.y}, ${segW}, ${p.h}, ${r}, ${cn(p.colors[i])});`);
                        if (isFirst && p.capLeft !== 'round') {
                            lines.push(`${indent}tft.fillRect(${sx}, ${p.y}, ${r}, ${p.h}, ${cn(p.colors[i])});`);
                        }
                        if (isLast && p.capRight !== 'round') {
                            lines.push(`${indent}tft.fillRect(${sx + segW - r}, ${p.y}, ${r}, ${p.h}, ${cn(p.colors[i])});`);
                        }
                    } else {
                        lines.push(`${indent}tft.fillRect(${sx}, ${p.y}, ${segW}, ${p.h}, ${cn(p.colors[i])});`);
                    }
                }
                break;
            }

            case 'text-label':
                lines.push(`${indent}tft.setTextColor(${cn(p.color)});`);
                lines.push(`${indent}tft.setTextDatum(TL_DATUM);`);
                lines.push(`${indent}tft.drawString("${p.text}", ${p.x}, ${p.y});`);
                break;

            case 'data-readout':
                if (p.bgColor) {
                    lines.push(`${indent}tft.fillRoundRect(${p.x}, ${p.y}, ${p.w}, ${p.h}, 4, ${cn(p.bgColor)});`);
                }
                if (p.borderColor) {
                    lines.push(`${indent}tft.drawRoundRect(${p.x}, ${p.y}, ${p.w}, ${p.h}, 4, ${cn(p.borderColor)});`);
                }
                lines.push(`${indent}tft.setTextColor(${cn(p.labelColor)});`);
                lines.push(`${indent}tft.setTextDatum(TL_DATUM);`);
                lines.push(`${indent}tft.drawString("${p.label}", ${p.x + 6}, ${p.y + 4});`);
                lines.push(`${indent}tft.setTextColor(${cn(p.valueColor)});`);
                lines.push(`${indent}tft.drawString("${p.value}", ${p.x + 6}, ${p.y + p.h - 18});`);
                break;

            case 'clock-display':
                lines.push(`${indent}tft.setTextColor(${cn(p.color)});`);
                lines.push(`${indent}tft.setTextDatum(${p.textAlign === 'center' ? 'MC' : p.textAlign === 'right' ? 'MR' : 'ML'}_DATUM);`);
                lines.push(`${indent}tft.drawString("${p.timeText}", ${p.x + (p.textAlign === 'center' ? Math.round(p.w / 2) : p.textAlign === 'right' ? p.w : 0)}, ${p.y + Math.round(p.h / 2)});`);
                break;

            case 'date-display':
                lines.push(`${indent}tft.setTextColor(${cn(p.color)});`);
                lines.push(`${indent}tft.setTextDatum(${p.textAlign === 'center' ? 'MC' : p.textAlign === 'right' ? 'MR' : 'ML'}_DATUM);`);
                lines.push(`${indent}tft.drawString("${p.dateText}", ${p.x + (p.textAlign === 'center' ? Math.round(p.w / 2) : p.textAlign === 'right' ? p.w : 0)}, ${p.y + Math.round(p.h / 2)});`);
                break;

            case 'fft-area': {
                if (p.bgColor) {
                    lines.push(`${indent}tft.fillRoundRect(${p.x}, ${p.y}, ${p.w}, ${p.h}, ${p.borderRadius}, ${cn(p.bgColor)});`);
                }
                if (p.showBorder) {
                    lines.push(`${indent}tft.drawRoundRect(${p.x}, ${p.y}, ${p.w}, ${p.h}, ${p.borderRadius}, ${cn(p.borderColor)});`);
                }
                lines.push(`${indent}// FFT bars drawn dynamically — see updateLCARSData()`);
                break;
            }

            case 'progress-bar': {
                const r = Math.floor(p.h / 2);
                const hasRound = p.capLeft === 'round' || p.capRight === 'round';
                if (hasRound) {
                    lines.push(`${indent}tft.fillRoundRect(${p.x}, ${p.y}, ${p.w}, ${p.h}, ${r}, ${cn(p.bgColor)});`);
                    lines.push(`${indent}// Fill portion (compute fillW from percentage):`);
                    lines.push(`${indent}// int fillW = map(percent, 0, 100, 0, ${p.w});`);
                    lines.push(`${indent}// tft.fillRoundRect(${p.x}, ${p.y}, fillW, ${p.h}, ${r}, ${cn(p.fillColor)});`);
                } else {
                    lines.push(`${indent}tft.fillRect(${p.x}, ${p.y}, ${p.w}, ${p.h}, ${cn(p.bgColor)});`);
                    lines.push(`${indent}// int fillW = map(percent, 0, 100, 0, ${p.w});`);
                    lines.push(`${indent}// tft.fillRect(${p.x}, ${p.y}, fillW, ${p.h}, ${cn(p.fillColor)});`);
                }
                break;
            }

            case 'status-dot':
                if (p.shape === 'circle') {
                    const r = Math.min(p.w, p.h) / 2;
                    lines.push(`${indent}tft.fillCircle(${p.x + Math.round(p.w / 2)}, ${p.y + Math.round(p.h / 2)}, ${Math.round(r)}, ${cn(p.color)});`);
                } else {
                    lines.push(`${indent}tft.fillRect(${p.x}, ${p.y}, ${p.w}, ${p.h}, ${cn(p.color)});`);
                }
                break;

            case 'status-row': {
                const size = p.h;
                for (let i = 0; i < p.colors.length; i++) {
                    const sx = p.x + i * (size + p.gap);
                    if (p.shape === 'circle') {
                        const r = Math.round(size / 2);
                        lines.push(`${indent}tft.fillCircle(${sx + r}, ${p.y + r}, ${r}, ${cn(p.colors[i])});`);
                    } else {
                        lines.push(`${indent}tft.fillRect(${sx}, ${p.y}, ${size}, ${size}, ${cn(p.colors[i])});`);
                    }
                }
                break;
            }

            case 'filled-rect':
                if (p.radius > 0) {
                    lines.push(`${indent}tft.fillRoundRect(${p.x}, ${p.y}, ${p.w}, ${p.h}, ${p.radius}, ${cn(p.color)});`);
                } else {
                    lines.push(`${indent}tft.fillRect(${p.x}, ${p.y}, ${p.w}, ${p.h}, ${cn(p.color)});`);
                }
                break;

            case 'outline-rect':
                if (p.radius > 0) {
                    lines.push(`${indent}tft.drawRoundRect(${p.x}, ${p.y}, ${p.w}, ${p.h}, ${p.radius}, ${cn(p.color)});`);
                } else {
                    lines.push(`${indent}tft.drawRect(${p.x}, ${p.y}, ${p.w}, ${p.h}, ${cn(p.color)});`);
                }
                break;

            case 'sweep-arc': {
                lines.push(`${indent}// Sweep arc — use drawArc or custom function`);
                const cx = p.x + Math.round(p.w / 2);
                const cy = p.y + Math.round(p.h / 2);
                const outerR = Math.round(Math.min(p.w, p.h) / 2);
                const innerR = Math.max(0, outerR - p.thickness);
                lines.push(`${indent}// tft.drawArc(${cx}, ${cy}, ${outerR}, ${innerR}, ${p.startAngle}, ${p.endAngle}, ${cn(p.color)}, TFT_BLACK);`);
                break;
            }

            case 'bracket-frame': {
                const oR = p.elbowR || 20;
                const iR = p.innerR || 0;
                const cW = Math.max(oR, p.barW + iR);
                const cH = Math.max(oR, p.barH + iR);
                lines.push(`${indent}// Bracket frame — 4 elbows + bar extensions`);
                lines.push(`${indent}drawLCARSElbow(tft, ${p.x}, ${p.y}, ${cW}, ${cH}, ${cn(p.color)}, 0, ${p.barW}, ${p.barH}, ${oR}, ${iR});`);
                lines.push(`${indent}drawLCARSElbow(tft, ${p.x + p.w - cW}, ${p.y}, ${cW}, ${cH}, ${cn(p.color)}, 1, ${p.barW}, ${p.barH}, ${oR}, ${iR});`);
                if (p.w > cW * 2) {
                    lines.push(`${indent}tft.fillRect(${p.x + cW}, ${p.y}, ${p.w - cW * 2}, ${p.barH}, ${cn(p.color)});`);
                }
                const sH = p.h - cH * (p.showBottom ? 2 : 1);
                if (sH > 0) {
                    lines.push(`${indent}tft.fillRect(${p.x}, ${p.y + cH}, ${p.barW}, ${sH}, ${cn(p.color)});`);
                    lines.push(`${indent}tft.fillRect(${p.x + p.w - p.barW}, ${p.y + cH}, ${p.barW}, ${sH}, ${cn(p.color)});`);
                }
                if (p.showBottom) {
                    lines.push(`${indent}drawLCARSElbow(tft, ${p.x}, ${p.y + p.h - cH}, ${cW}, ${cH}, ${cn(p.color)}, 2, ${p.barW}, ${p.barH}, ${oR}, ${iR});`);
                    lines.push(`${indent}drawLCARSElbow(tft, ${p.x + p.w - cW}, ${p.y + p.h - cH}, ${cW}, ${cH}, ${cn(p.color)}, 3, ${p.barW}, ${p.barH}, ${oR}, ${iR});`);
                    const bW = p.w - cW * 2;
                    if (bW > 0) {
                        const halfW = Math.floor((bW - p.gap) / 2);
                        if (halfW > 0 && p.gap > 0) {
                            lines.push(`${indent}tft.fillRect(${p.x + cW}, ${p.y + p.h - p.barH}, ${halfW}, ${p.barH}, ${cn(p.color)});`);
                            lines.push(`${indent}tft.fillRect(${p.x + cW + halfW + p.gap}, ${p.y + p.h - p.barH}, ${halfW}, ${p.barH}, ${cn(p.color)});`);
                        } else {
                            lines.push(`${indent}tft.fillRect(${p.x + cW}, ${p.y + p.h - p.barH}, ${bW}, ${p.barH}, ${cn(p.color)});`);
                        }
                    }
                }
                break;
            }

            // ── New element types ──

            case 'menu-block': {
                const topGap = p.topGap || 0;
                const bottomGap = p.bottomGap || 0;
                const blockY = p.y + topGap;
                const blockH = p.h - topGap - bottomGap;
                const r = Math.floor(blockH / 2);
                const hasRoundL = p.endCapLeft === 'round';
                const hasRoundR = p.endCapRight === 'round';
                if (hasRoundL || hasRoundR) {
                    lines.push(`${indent}tft.fillRoundRect(${p.x}, ${blockY}, ${p.w}, ${blockH}, ${r}, ${cn(p.color)});`);
                    if (!hasRoundL) {
                        lines.push(`${indent}tft.fillRect(${p.x}, ${blockY}, ${r}, ${blockH}, ${cn(p.color)});`);
                    }
                    if (!hasRoundR) {
                        lines.push(`${indent}tft.fillRect(${p.x + p.w - r}, ${blockY}, ${r}, ${blockH}, ${cn(p.color)});`);
                    }
                } else {
                    lines.push(`${indent}tft.fillRect(${p.x}, ${blockY}, ${p.w}, ${blockH}, ${cn(p.color)});`);
                }
                if (p.label) {
                    lines.push(`${indent}tft.setTextColor(${cn(p.textColor)});`);
                    lines.push(`${indent}tft.setTextDatum(MC_DATUM);`);
                    lines.push(`${indent}tft.drawString("${p.label}", ${p.x + Math.round(p.w / 2)}, ${blockY + Math.round(blockH / 2)});`);
                }
                break;
            }

            case 'large-number':
                lines.push(`${indent}tft.setTextColor(${cn(p.valueColor)});`);
                lines.push(`${indent}tft.setTextDatum(ML_DATUM);`);
                lines.push(`${indent}tft.drawString("${p.value}", ${p.x + 4}, ${p.y + Math.round(p.h / 2)});`);
                lines.push(`${indent}tft.setTextColor(${cn(p.labelColor)});`);
                lines.push(`${indent}tft.drawString("${p.label}", ${p.x + Math.round(p.w * 0.5)}, ${p.y + Math.round(p.h / 2)});`);
                break;

            case 'number-grid': {
                const cellW = Math.floor((p.w - (p.cols - 1) * p.cellGap) / p.cols);
                const cellH = Math.floor((p.h - (p.rows - 1) * p.cellGap) / p.rows);
                lines.push(`${indent}// Number grid ${p.cols}x${p.rows}`);
                for (let row = 0; row < p.rows; row++) {
                    for (let col = 0; col < p.cols; col++) {
                        const cx = p.x + col * (cellW + p.cellGap);
                        const cy = p.y + row * (cellH + p.cellGap);
                        lines.push(`${indent}tft.fillRect(${cx}, ${cy}, ${cellW}, ${cellH}, ${cn(p.color)});`);
                    }
                }
                break;
            }

            case 'title-bar':
                if (p.underline) {
                    lines.push(`${indent}tft.fillRect(${p.x}, ${p.y + p.h - p.bgHeight}, ${p.w}, ${p.bgHeight}, ${cn(p.underlineColor)});`);
                }
                lines.push(`${indent}tft.setTextColor(${cn(p.color)});`);
                lines.push(`${indent}tft.setTextDatum(${p.textAlign === 'center' ? 'MC' : p.textAlign === 'right' ? 'MR' : 'ML'}_DATUM);`);
                lines.push(`${indent}tft.drawString("${p.text}", ${p.x + (p.textAlign === 'center' ? Math.round(p.w / 2) : 4)}, ${p.y + Math.round(p.h / 2)});`);
                break;

            case 'inner-panel':
                lines.push(`${indent}tft.fillRoundRect(${p.x}, ${p.y}, ${p.w}, ${p.h}, ${p.borderRadius}, ${cn(p.bgColor)});`);
                lines.push(`${indent}tft.drawRoundRect(${p.x}, ${p.y}, ${p.w}, ${p.h}, ${p.borderRadius}, ${cn(p.borderColor)});`);
                if (p.headerText) {
                    lines.push(`${indent}tft.setTextColor(${cn(p.headerColor)});`);
                    lines.push(`${indent}tft.setTextDatum(MC_DATUM);`);
                    const hdrY = p.y + Math.round((p.headerFontSize + 6) / 2);
                    lines.push(`${indent}tft.drawString("${p.headerText}", ${p.x + Math.round(p.w / 2)}, ${hdrY});`);
                }
                break;

            case 'hatched-bar': {
                lines.push(`${indent}// Hatched bar — background track`);
                lines.push(`${indent}tft.fillRect(${p.x}, ${p.y}, ${p.w}, ${p.h}, ${cn(p.bgColor)});`);
                lines.push(`${indent}// Fill portion (compute fillW from percentage)`);
                lines.push(`${indent}int fillW = map(volumePercent, 0, 100, 0, ${p.w});`);
                lines.push(`${indent}tft.fillRect(${p.x}, ${p.y}, fillW, ${p.h}, ${cn(p.fillColor)});`);
                lines.push(`${indent}// Hatch lines (loop in firmware)`);
                if (p.label) {
                    lines.push(`${indent}tft.setTextColor(${cn(p.labelColor)});`);
                    lines.push(`${indent}tft.setTextDatum(MR_DATUM);`);
                    lines.push(`${indent}tft.drawString("${p.label}", ${p.x - 8}, ${p.y + Math.round(p.h / 2)});`);
                }
                break;
            }

            case 'chip-strip': {
                let cx = p.x;
                for (let i = 0; i < p.colors.length; i++) {
                    const cw = (p.widths && p.widths[i]) || 20;
                    if (p.radius > 0) {
                        lines.push(`${indent}tft.fillRoundRect(${Math.round(cx)}, ${p.y}, ${cw}, ${p.h}, ${p.radius}, ${cn(p.colors[i])});`);
                    } else {
                        lines.push(`${indent}tft.fillRect(${Math.round(cx)}, ${p.y}, ${cw}, ${p.h}, ${cn(p.colors[i])});`);
                    }
                    cx += cw + p.gap;
                }
                break;
            }

            case 'pill-row': {
                lines.push(`${indent}// Pill row — label pills`);
                const r = Math.floor(p.h / 2);
                let cx = p.x;
                for (let i = 0; i < p.labels.length; i++) {
                    const pw = p.labels[i].length * 7 + r * 2; // approximate width
                    lines.push(`${indent}tft.fillRoundRect(${Math.round(cx)}, ${p.y}, ${pw}, ${p.h}, ${r}, ${cn(p.colors[i % p.colors.length])});`);
                    lines.push(`${indent}tft.setTextColor(${cn(p.textColor)});`);
                    lines.push(`${indent}tft.setTextDatum(MC_DATUM);`);
                    lines.push(`${indent}tft.drawString("${p.labels[i]}", ${Math.round(cx + pw / 2)}, ${p.y + Math.round(p.h / 2)});`);
                    cx += pw + p.gap;
                }
                break;
            }

            case 'crosshatch-block':
                lines.push(`${indent}// Crosshatch pattern — draw diagonal lines in firmware loop`);
                lines.push(`${indent}for (int d = 0; d < ${p.w + p.h}; d += ${p.lineSpacing}) {`);
                lines.push(`${indent}    tft.drawLine(${p.x} + d, ${p.y + p.h}, ${p.x} + d + ${p.h}, ${p.y}, ${cn(p.color)});`);
                lines.push(`${indent}}`);
                break;

            case 'starship-silhouette': {
                const cw = Math.floor((p.w - (p.cols - 1) * p.gap) / p.cols);
                const ch = Math.floor((p.h - (p.rows - 1) * p.gap) / p.rows);
                let idx = 0;
                lines.push(`${indent}// Color grid pattern ${p.cols}x${p.rows}`);
                for (let row = 0; row < p.rows; row++) {
                    for (let col = 0; col < p.cols; col++) {
                        const cx = p.x + col * (cw + p.gap);
                        const cy = p.y + row * (ch + p.gap);
                        if (p.radius > 0) {
                            lines.push(`${indent}tft.fillRoundRect(${cx}, ${cy}, ${cw}, ${ch}, ${p.radius}, ${cn(p.colors[idx % p.colors.length])});`);
                        } else {
                            lines.push(`${indent}tft.fillRect(${cx}, ${cy}, ${cw}, ${ch}, ${cn(p.colors[idx % p.colors.length])});`);
                        }
                        idx++;
                    }
                }
                break;
            }

            case 'event-log':
                lines.push(`${indent}// Event log — draw text lines dynamically`);
                lines.push(`${indent}tft.setTextColor(${cn(p.color)});`);
                lines.push(`${indent}tft.setTextDatum(TL_DATUM);`);
                lines.push(`${indent}// Loop through log entries and draw at (${p.x}, ${p.y}) with lineHeight ${p.lineHeight}`);
                break;

            case 'labeled-value-row':
                lines.push(`${indent}tft.setTextColor(${cn(p.labelColor)});`);
                lines.push(`${indent}tft.setTextDatum(ML_DATUM);`);
                lines.push(`${indent}tft.drawString("${p.label}", ${p.x}, ${p.y + Math.round(p.h / 2)});`);
                lines.push(`${indent}tft.setTextColor(${cn(p.valueColor)});`);
                lines.push(`${indent}tft.setTextDatum(MR_DATUM);`);
                lines.push(`${indent}tft.drawString("${p.value}", ${p.x + p.w}, ${p.y + Math.round(p.h / 2)});`);
                break;

            default:
                lines.push(`${indent}// Unknown element type: ${el.type}`);
        }

        return lines;
    }

    // ───── PNG Export ─────

    exportPng() {
        // Render to an offscreen canvas at 1:1
        const offscreen = document.createElement('canvas');
        offscreen.width = this.renderer.displayWidth;
        offscreen.height = this.renderer.displayHeight;
        const ctx = offscreen.getContext('2d');

        // Background
        ctx.fillStyle = this.renderer.bgColor;
        if (this.renderer.cornerRadius > 0) {
            roundedRectPath(ctx, 0, 0, this.renderer.displayWidth, this.renderer.displayHeight, this.renderer.cornerRadius);
            ctx.fill();
            // Clip
            ctx.save();
            roundedRectPath(ctx, 0, 0, this.renderer.displayWidth, this.renderer.displayHeight, this.renderer.cornerRadius);
            ctx.clip();
        } else {
            ctx.fillRect(0, 0, this.renderer.displayWidth, this.renderer.displayHeight);
            ctx.save();
        }

        // Draw elements
        for (const el of this.renderer.elements) {
            if (!el.visible) continue;
            const typeDef = LCARSElementTypes[el.type];
            if (!typeDef) continue;
            ctx.save();
            typeDef.render(ctx, el.props);
            ctx.restore();
        }
        ctx.restore();

        return offscreen.toDataURL('image/png');
    }

    // ───── JSON Export ─────

    exportJson() {
        const layout = {
            generator: 'LCARS UI Generator',
            version: '1.0.0',
            display: {
                width: this.renderer.displayWidth,
                height: this.renderer.displayHeight,
                cornerRadius: this.renderer.cornerRadius,
                bgColor: this.renderer.bgColor,
            },
            elements: this.renderer.elements.filter(e => e.visible).map(el => ({
                type: el.type,
                name: el.name,
                props: { ...el.props },
            })),
        };
        return JSON.stringify(layout, null, 2);
    }

    // ───── Download helpers ─────

    downloadText(content, filename) {
        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
    }

    downloadPng(dataUrl, filename) {
        const a = document.createElement('a');
        a.href = dataUrl;
        a.download = filename;
        a.click();
    }

    copyToClipboard(text) {
        navigator.clipboard.writeText(text).catch(() => {
            // Fallback
            const ta = document.createElement('textarea');
            ta.value = text;
            document.body.appendChild(ta);
            ta.select();
            document.execCommand('copy');
            document.body.removeChild(ta);
        });
    }
}
