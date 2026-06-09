import getAllLabels from './getAllLabels.js';
import getVisibleCategories from './getVisibleCategories.js';
import initializeDynamicCategoryData from './initializeDynamicCategoryData.js';
import refreshDynamicCategoryData from './refreshDynamicCategoryData.js';

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
            const pxPerCategory = 30;
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
