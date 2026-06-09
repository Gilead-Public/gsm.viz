/**
 * Darken a hex color by reducing each RGB channel by 20%.
 *
 * @param {string} hex - 6-digit hex color string (e.g. '#4e79a7')
 * @returns {string} darkened hex color
 */
export default function darkenHex(hex) {
    const r = Math.round(parseInt(hex.slice(1, 3), 16) * 0.8);
    const g = Math.round(parseInt(hex.slice(3, 5), 16) * 0.8);
    const b = Math.round(parseInt(hex.slice(5, 7), 16) * 0.8);
    return (
        '#' +
        r.toString(16).padStart(2, '0') +
        g.toString(16).padStart(2, '0') +
        b.toString(16).padStart(2, '0')
    );
}
