import render from './render.js';
import { keyOf } from './structureData.js';

function findColumn(chart, x) {
    const key = keyOf(x);
    return chart._structure.columns.find((col) => col.key === key);
}

/**
 * Whether column `x` is currently expanded.
 *
 * @param {Object} chart
 * @param {*} x - compact column value
 * @returns {boolean}
 */
export function isExpanded(chart, x) {
    return chart._state.expanded.some((value) => keyOf(value) === keyOf(x));
}

function setExpanded(chart, x, expanded) {
    const col = findColumn(chart, x);
    if (!col || !col.details.length || isExpanded(chart, x) === expanded) {
        return false;
    }
    chart._state.expanded = expanded
        ? [...chart._state.expanded, col.value]
        : chart._state.expanded.filter((value) => keyOf(value) !== col.key);
    render(chart);
    chart.spec.callbacks.onExpand?.(col.value, expanded);
    return true;
}

/**
 * Expand column `x` into its detail columns.
 *
 * @param {Object} chart
 * @param {*} x - compact column value
 * @returns {boolean} true when the column state changed
 */
export function expandColumn(chart, x) {
    return setExpanded(chart, x, true);
}

/**
 * Collapse column `x` back to its compact column.
 *
 * @param {Object} chart
 * @param {*} x - compact column value
 * @returns {boolean} true when the column state changed
 */
export function collapseColumn(chart, x) {
    return setExpanded(chart, x, false);
}
