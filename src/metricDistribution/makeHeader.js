import metricOverview from '../metricOverview.js';
import isPlainObject from './isPlainObject.js';

// Stand-ins for a metric row without business labels, so the header never
// falls back to the column names "Numerator" and "Denominator". They match
// the bars' "n of N" hover text.
const FALLBACK_LABELS = { Numerator: 'n', Denominator: 'N' };

function isNamed(label) {
    return typeof label === 'string' && label.trim() !== '' && label !== 'NA';
}

function fallbackLabels(metric) {
    return Object.fromEntries(
        Object.entries(FALLBACK_LABELS).filter(
            ([field]) => !isNamed(metric[field])
        )
    );
}

/**
 * Build the header: the metric overview (#618) in its header layout, showing
 * the metric's name, value, and numerator / denominator.
 *
 * @param {Object} data - { metric, result }
 * @param {Object} [header] - spec.header: labels, format, and unavailable
 * @returns {HTMLElement} the overview root, not yet attached
 * @throws {Error} if a header option is invalid
 */
export default function makeHeader({ metric, result }, header = {}) {
    // Merging the stand-ins would turn a malformed labels value into an
    // object, so it is checked here rather than by metricOverview.
    if (header.labels !== undefined && !isPlainObject(header.labels)) {
        throw new Error('spec.header.labels must be a plain object');
    }

    try {
        return metricOverview(
            document.createElement('div'),
            {
                results:
                    result === undefined || result === null ? [] : [result],
                metric,
            },
            {
                ...header,
                layout: 'header',
                labels: { ...fallbackLabels(metric), ...header.labels },
            }
        );
    } catch (error) {
        throw new Error(error.message.replace(/^spec\./, 'spec.header.'));
    }
}
