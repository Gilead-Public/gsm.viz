const HEX6_RE = /^#[0-9a-fA-F]{6}$/;

const LIGHT_TEXT = '#ffffff';
const DARK_TEXT = '#333333';

// WCAG relative luminance of DARK_TEXT (#333333)
const L_DARK_TEXT = 0.0332;

function toLinear(c) {
    return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}

function relativeLuminance(r, g, b) {
    return (
        0.2126 * toLinear(r / 255) +
        0.7152 * toLinear(g / 255) +
        0.0722 * toLinear(b / 255)
    );
}

/**
 * Return a text color (#ffffff or #333333) that maximises WCAG contrast
 * against the given background hex color.
 *
 * White text is chosen when it achieves a higher contrast ratio than dark
 * text; dark text is chosen otherwise. Falls back to '#333333' for any
 * non-parseable input.
 *
 * @param {string} hex - 6-digit hex color string (e.g. '#4e79a7')
 * @returns {'#ffffff'|'#333333'}
 */
export default function getContrastColor(hex) {
    if (!hex || !HEX6_RE.test(hex)) return DARK_TEXT;

    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    const L = relativeLuminance(r, g, b);

    const contrastWithLight = (1.0 + 0.05) / (L + 0.05);
    const contrastWithDark = (L + 0.05) / (L_DARK_TEXT + 0.05);

    return contrastWithLight >= contrastWithDark ? LIGHT_TEXT : DARK_TEXT;
}
