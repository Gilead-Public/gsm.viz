import mergeSpec, { deepMerge } from './mergeSpec.js';
import render from './render.js';
import validateSpec from './validateSpec.js';

/**
 * Deep-merge a partial spec into the current spec (arrays replace) and
 * re-render, keeping expansion, selection and page.
 *
 * @param {Object} chart
 * @param {Object} delta - partial spec
 */
export default function updateSpec(chart, delta) {
    const next = deepMerge(chart.spec, delta);
    validateSpec(chart.data, next);
    chart.spec = mergeSpec(next);
    render(chart);
}
