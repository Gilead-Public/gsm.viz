import getAllLabels from './getAllLabels.js';
import getVisibleCategories from './getVisibleCategories.js';
import initializeDynamicCategoryData from './initializeDynamicCategoryData.js';
import refreshDynamicCategoryData from './refreshDynamicCategoryData.js';

/**
 * Handle legend clicks when the dynamic category axis theme option is enabled.
 *
 * Toggles dataset visibility, recomputes visible category labels from the
 * remaining visible fill groups, refreshes dataset data, and updates dynamic
 * sizing for the chart container.
 *
 * @param {Event} e - Chart.js legend click event
 * @param {Object} legendItem - clicked legend item
 * @param {Object} legendRef - Chart.js legend reference
 */
export default function dynamicCategoryLegendOnClick(e, legendItem, legendRef) {
    const chart = legendRef.chart;
    const { datasetIndex } = legendItem;
    const dataset = chart.data.datasets[datasetIndex];

    initializeDynamicCategoryData(chart.data.datasets);

    if (chart.isDatasetVisible(datasetIndex)) {
        dataset.data = [];
        dataset._backup_ = dataset._dynamicCategoryAxisOriginalData_;
        chart.setDatasetVisibility(datasetIndex, false);
    } else {
        delete dataset._backup_;
        chart.setDatasetVisibility(datasetIndex, true);
    }

    const catKey = chart.data._spec_?.orientation === 'horizontal' ? 'y' : 'x';
    const valKey = catKey === 'x' ? 'y' : 'x';
    const visibleCats = getVisibleCategories(chart, catKey);

    chart.data.labels = getAllLabels(chart, visibleCats).filter((cat) =>
        visibleCats.has(cat)
    );

    refreshDynamicCategoryData(chart, chart.data.labels, catKey, valKey);

    chart.update();
    if (chart.data._spec_?.theme?.dynamicSizing) {
        const container = chart.canvas?.parentElement;
        if (container) {
            const numCategories = chart.data.labels.length;
            const pxPerCategory =
                chart.data._spec_?.theme?.pxPerCategory || 30;
            const horizontal = chart.data._spec_?.orientation === 'horizontal';

            if (horizontal) {
                const area = chart.chartArea;
                const chartAreaHeight = area ? area.bottom - area.top : 0;
                const overhead =
                    chartAreaHeight > 0 ? chart.height - chartAreaHeight : 0;
                container.style.height =
                    numCategories * pxPerCategory + overhead + 'px';
            } else {
                const area = chart.chartArea;
                const chartAreaWidth = area ? area.right - area.left : 0;
                const overhead =
                    chartAreaWidth > 0 ? chart.width - chartAreaWidth : 0;
                container.style.width =
                    numCategories * pxPerCategory + overhead + 'px';
            }
        }
    }
}
