import alignDataToLabels from './alignDataToLabels.js';

/**
 * Refresh dataset data after dynamic category axis labels change.
 *
 * Filters visible datasets to the supplied label set, clears hidden datasets,
 * and aligns stacked/fill datasets to all labels with zero placeholders.
 *
 * @param {Object} chart - Chart.js chart instance
 * @param {Array} labels - active category labels
 * @param {string} catKey - point property containing the category value
 * @param {string} valKey - point property containing the numeric value
 */
export default function refreshDynamicCategoryData(
    chart,
    labels,
    catKey,
    valKey
) {
    const alignStacked =
        chart.data._spec_?.mapping?.fill &&
        ['stack', 'fill'].includes(chart.data._spec_?.position);
    const labelSet = new Set(labels);

    for (let i = 0; i < chart.data.datasets.length; i++) {
        const dataset = chart.data.datasets[i];
        const originalData = dataset._dynamicCategoryAxisOriginalData_ || [];

        if (!chart.isDatasetVisible(i)) {
            dataset.data = [];
            dataset._backup_ = originalData;
            continue;
        }

        delete dataset._backup_;
        const filteredData = originalData.filter((point) =>
            labelSet.has(point[catKey])
        );

        dataset.data = alignStacked
            ? alignDataToLabels(filteredData, labels, catKey, valKey)
            : filteredData;
    }
}
