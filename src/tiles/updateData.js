import mergeSpec from './mergeSpec.js';
import render from './render.js';
import validateSpec from './validateSpec.js';

/**
 * Replace the compact data (and optionally the full spec), keeping expanded
 * columns and the selected row that still exist. Resets to page 1.
 *
 * @param {Object} chart
 * @param {Array} data - new compact rows
 * @param {Object} [spec] - new full spec, merged with defaults
 */
export default function updateData(chart, data, spec) {
    validateSpec(data, spec === undefined ? chart.spec : spec);
    chart.data = data;
    if (spec !== undefined) chart.spec = mergeSpec(spec);
    chart._state.page = 1;
    render(chart, { resetScroll: true });
}
