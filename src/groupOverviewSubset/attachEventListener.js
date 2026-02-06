import { select } from 'd3';
import applyFilters from './applyFilters.js';

/**
 * Attach change / input event listeners to every filter control so that
 * any user interaction re-evaluates the full filter set and re-renders
 * the group overview table.
 *
 * @param {d3.selection} container      - the filter container (d3 selection)
 * @param {Object}       groupOverview  - the groupOverview table instance
 * @param {Array}        results        - original (unfiltered) results
 * @param {Array}        groups         - enriched group-metric objects
 * @param {Array<Object>} filters       - array of { id, property, getValue, element } objects
 */
export default function attachEventListener(
    container,
    groupOverview,
    results,
    groups,
    filters
) {
    filters.forEach((f) => {
        const wrapper = select(f.element);

        // Listen on both input and change to cover range sliders and selects.
        wrapper.selectAll('input, select').on('input.subset change.subset', () => {
            applyFilters(groupOverview, results, groups, filters);
        });
    });
}
