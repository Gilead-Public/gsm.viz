import rebuildChart from './rebuildChart.js';

function isPlainObject(value) {
    if (value === null || typeof value !== 'object') return false;
    const prototype = Object.getPrototypeOf(value);
    return prototype === Object.prototype || prototype === null;
}

function mergePartial(existing, partial) {
    return Object.keys(partial).reduce(
        (merged, key) => {
            merged[key] =
                isPlainObject(existing[key]) && isPlainObject(partial[key])
                    ? mergePartial(existing[key], partial[key])
                    : partial[key];
            return merged;
        },
        { ...existing }
    );
}

function getStoredSpec(chart) {
    const { data, ...spec } = chart.data._spec_;
    return { data, spec };
}

/**
 * Deep-merge a partial spec and run the complete rendering pipeline in place.
 *
 * @param {Object} chart - Chart.js chart instance.
 * @param {Object} spec - Partial public points specification.
 * @returns {Object} The updated chart instance.
 */
export default function updateSpec(chart, spec) {
    if (!isPlainObject(spec)) {
        throw new Error('points updateSpec spec must be a plain object');
    }

    const stored = getStoredSpec(chart);
    return rebuildChart(chart, stored.data, mergePartial(stored.spec, spec));
}
