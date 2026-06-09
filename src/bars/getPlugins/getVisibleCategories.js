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
