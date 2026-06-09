/**
 * Get the full label set used for dynamic category axis updates.
 *
 * Prefers the chart's cached original label list and falls back to the visible
 * categories when no cache is available.
 *
 * @param {Object} chart - Chart.js chart instance
 * @param {Set} visibleCats - categories present in visible datasets
 * @returns {Array} labels to consider for filtering
 */
export default function getAllLabels(chart, visibleCats) {
    return chart.data._allLabels_ || [...visibleCats];
}
