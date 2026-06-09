export default function initializeDynamicCategoryData(datasets) {
    for (const dataset of datasets) {
        if (!dataset._dynamicCategoryAxisOriginalData_) {
            dataset._dynamicCategoryAxisOriginalData_ =
                dataset._backup_ || dataset.data || [];
        }
    }
}
