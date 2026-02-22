/* ============================================
   LCARS Colors & Themes
   ============================================ */

const LCARS_COLORS = {
    // Classic TNG-era LCARS colors
    ORANGE:       '#FF9900',
    TANGERINE:    '#FF7700',
    BUTTERSCOTCH: '#FFCC66',
    SUNFLOWER:    '#FFCC00',
    GOLD:         '#CC8800',
    LAVENDER:     '#CC99CC',
    VIOLET:       '#9977AA',
    LILAC:        '#CC66FF',
    PEACH:        '#FF9966',
    BLUE:         '#99CCFF',
    ICE:          '#CCDDFF',
    SKY:          '#6688CC',
    RED:          '#CC6666',
    MARS:         '#EE5500',
    MAGENTA:      '#CC6699',
    BEIGE:        '#DDBBAA',
    WHITE:        '#FFFFFF',
    BLACK:        '#000000',
    DARK_GREY:    '#333333',
    GREY:         '#999999',
};

// Named color entries for the swatch palette
const LCARS_PALETTE = [
    { name: 'Orange',       hex: LCARS_COLORS.ORANGE },
    { name: 'Tangerine',    hex: LCARS_COLORS.TANGERINE },
    { name: 'Butterscotch', hex: LCARS_COLORS.BUTTERSCOTCH },
    { name: 'Sunflower',    hex: LCARS_COLORS.SUNFLOWER },
    { name: 'Gold',         hex: LCARS_COLORS.GOLD },
    { name: 'Peach',        hex: LCARS_COLORS.PEACH },
    { name: 'Red',          hex: LCARS_COLORS.RED },
    { name: 'Mars',         hex: LCARS_COLORS.MARS },
    { name: 'Magenta',      hex: LCARS_COLORS.MAGENTA },
    { name: 'Lavender',     hex: LCARS_COLORS.LAVENDER },
    { name: 'Violet',       hex: LCARS_COLORS.VIOLET },
    { name: 'Lilac',        hex: LCARS_COLORS.LILAC },
    { name: 'Blue',         hex: LCARS_COLORS.BLUE },
    { name: 'Ice',          hex: LCARS_COLORS.ICE },
    { name: 'Sky',          hex: LCARS_COLORS.SKY },
    { name: 'Beige',        hex: LCARS_COLORS.BEIGE },
    { name: 'White',        hex: LCARS_COLORS.WHITE },
    { name: 'Grey',         hex: LCARS_COLORS.GREY },
    { name: 'Dark Grey',    hex: LCARS_COLORS.DARK_GREY },
    { name: 'Black',        hex: LCARS_COLORS.BLACK },
];

// Convert hex to 16-bit 565 color for TFT
function hexToRgb565(hex) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return ((r & 0xF8) << 8) | ((g & 0xFC) << 3) | (b >> 3);
}

function hexToRgb(hex) {
    return {
        r: parseInt(hex.slice(1, 3), 16),
        g: parseInt(hex.slice(3, 5), 16),
        b: parseInt(hex.slice(5, 7), 16),
    };
}

function rgbToHex(r, g, b) {
    return '#' + [r, g, b].map(v => v.toString(16).padStart(2, '0')).join('').toUpperCase();
}
