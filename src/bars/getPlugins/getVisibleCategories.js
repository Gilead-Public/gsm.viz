/**
 * Collect categories represented by currently visible datasets.
 *
 * Uses each dataset's cached dynamic-category source data so hidden categories
 * can be restored when legend items are toggled back on.
 *
 * @param {Object} chart - Chart.js chart instance
 * @param {string} catKey - point property containing the category value
 * @returns {Set} visible category values
 */
export default function getVisibleCategories(chart, catKey) {
    const visibleCats = new Set();

    for (let i = 0; i < chart.data.datasets.length; i++) {
        if (!chart.isDatasetVisible(i)) continue;

        const originalData =
            chart.data.datasets[i]._dynamicCategoryAxisOriginalData_ || [];

        for (const point of originalData) {
            visibleCats.add(point[catKey]);
        }
    }

    return visibleCats;
}
