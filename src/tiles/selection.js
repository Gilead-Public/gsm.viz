import render, { applySelection, scrollToSelected } from './render.js';
import { keyOf } from './structureData.js';

/**
 * Select row `y` (single selection), moving to its page when paging.
 * Does not invoke callbacks. Unknown rows clear the selection.
 *
 * @param {Object} chart
 * @param {*} y - row value
 * @returns {boolean} true when the row exists
 */
export function selectRow(chart, y) {
    const rows = chart._structure.rows;
    const index = rows.findIndex((row) => row.key === keyOf(y));
    if (index < 0) {
        clearSelection(chart);
        return false;
    }
    chart._state.selected = rows[index].value;
    const pageSize = chart.spec.rows.pageSize;
    const page = pageSize ? Math.floor(index / pageSize) + 1 : 1;
    if (page !== chart._state.page) {
        chart._state.page = page;
        render(chart, { resetScroll: true });
    } else {
        applySelection(chart);
    }
    scrollToSelected(chart);
    return true;
}

/**
 * Clear the selected row. Does not invoke callbacks.
 *
 * @param {Object} chart
 */
export function clearSelection(chart) {
    chart._state.selected = null;
    applySelection(chart);
}

/**
 * Current interactive state.
 *
 * @param {Object} chart
 * @returns {{ expanded: Array, selected: *, page: number }}
 */
export function getState(chart) {
    return {
        expanded: [...chart._state.expanded],
        selected: chart._state.selected,
        page: chart._state.page,
    };
}
