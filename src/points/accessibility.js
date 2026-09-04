export const POINT_SELECTION_INSTRUCTIONS =
    'Use arrow keys to move between points, Enter to select, and Escape to clear.';

function asSentence(value) {
    const text = value?.trim();

    if (!text) return '';
    return /[.!?]$/.test(text) ? text : `${text}.`;
}

function getEncodingLabel(spec, chartData, aesthetic) {
    if (!spec.mapping[aesthetic]) return '';

    const levels = [];
    const seen = new Set();
    chartData.datasets
        .filter((dataset) => !dataset._annotation && dataset.data.length > 0)
        .forEach((dataset) => {
            const value = dataset[`_${aesthetic}`];
            const missing = dataset[`_${aesthetic}Missing`];
            const key = missing
                ? 'missing'
                : JSON.stringify([typeof value, value]);

            if (!seen.has(key)) {
                seen.add(key);
                levels.push({ value, missing });
            }
        });

    const values = levels.map(({ value, missing }) => {
        const label = String(value);
        if (missing) return `${label} (missing value)`;
        if (typeof value === 'string') {
            return `${JSON.stringify(value)} (string)`;
        }
        return `${label} (${typeof value})`;
    });

    return levels.length
        ? `${aesthetic === 'color' ? 'Color' : 'Shape'} ${
              spec.mapping[aesthetic]
          } values: ${values.join(', ')}.`
        : '';
}

/**
 * Build the canvas text alternative for a rendered point chart.
 *
 * @param {Object} spec - Merged points specification.
 * @param {Object} chartData - Structured Chart.js data.
 * @param {number} pointCount - Number of source point rows.
 * @returns {string} Accessible chart summary.
 */
export function getAccessibleLabel(spec, chartData, pointCount) {
    const xLabel = spec.scales.x.label || spec.mapping.x;
    const yLabel = spec.scales.y.label || spec.mapping.y;
    const parts = [
        asSentence(spec.labels.title),
        asSentence(spec.labels.description),
        `Point chart of ${yLabel} by ${xLabel}.`,
        pointCount === 0
            ? 'No data available.'
            : `${pointCount} ${pointCount === 1 ? 'point' : 'points'}.`,
        getEncodingLabel(spec, chartData, 'color'),
        getEncodingLabel(spec, chartData, 'shape'),
        spec.selection.enabled ? POINT_SELECTION_INSTRUCTIONS : '',
    ];

    return parts.filter(Boolean).join(' ');
}

/**
 * Apply an updated text alternative without replacing the chart canvas.
 *
 * @param {HTMLCanvasElement} canvas - Chart canvas.
 * @param {string} label - Accessible chart summary.
 */
export function setAccessibleLabel(canvas, label) {
    canvas.setAttribute('aria-label', label);
    const textNode = [...canvas.childNodes].find((node) => node.nodeType === 3);

    if (textNode) {
        textNode.nodeValue = label;
    } else {
        canvas.insertBefore(document.createTextNode(label), canvas.firstChild);
    }
}
