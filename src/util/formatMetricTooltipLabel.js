import falsy from './falsy.js';

/**
 * Format results for tooltip.
 *
 * @param {Object} group - Results.
 * @param {Object} config - Configuration object with result metadata.
 *
 * @returns {Array} The tooltip content.
 */
export default function formatMetricTooltipLabel(result, config) {
    // Check that [ config.resultTooltipKeys ] is an object. If not, return all attributes of
    // [ result ].
    const resultTooltipKeys = typeof config.resultTooltipKeys === 'object'
        ? config.resultTooltipKeys
        : Object.keys(result).reduce((acc, key) => {
            acc[key] = key;

            return acc;
        }, {});

    const tooltipLabel = [];
        
    for (const [key, label] of Object.entries(resultTooltipKeys)) {
        if (result[key] !== undefined) {
            let value = result[key];

            value = parseFloat(value);

            if (falsy.includes(value)) {
                value = '—';
            } else if (Number.isInteger(value)) {
                // format integer with commas
                value = value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
            } else {
                // round float to two decimal places
                value = value.toFixed(2).toString();
            }

            tooltipLabel.push(`${label}: ${value}`);
        }
    }

    return tooltipLabel;
}
