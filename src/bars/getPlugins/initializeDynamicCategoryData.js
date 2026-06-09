/**
 * Cache original dataset data for dynamic category axis interactions.
 *
 * Each dataset keeps its initial data so later legend toggles can filter from
 * the same source rather than from already-filtered points.
 *
 * @param {Array<Object>} datasets - Chart.js dataset objects
 */
export default function initializeDynamicCategoryData(datasets) {
    for (const dataset of datasets) {
        if (!dataset._dynamicCategoryAxisOriginalData_) {
            dataset._dynamicCategoryAxisOriginalData_ =
                dataset._backup_ || dataset.data || [];
        }
    }
}
