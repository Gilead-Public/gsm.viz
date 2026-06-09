/**
 * Format tooltip labels for fill-positioned bars.
 *
 * Reads the normalized percentage from the parsed value axis and prefixes it
 * with the dataset label when one exists.
 *
 * @param {Object} context - Chart.js tooltip callback context
 * @returns {string} formatted percentage label
 */
export default function fillLabelCallback(context) {
    const indexAxis = context.chart?.options?.indexAxis || 'x';
    const pct = indexAxis === 'y' ? context.parsed.x : context.parsed.y;
    const prefix = context.dataset.label ? `${context.dataset.label}: ` : '';
    return `${prefix}${pct.toFixed(1)}%`;
}
