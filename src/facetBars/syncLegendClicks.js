import getAllLabels from '../bars/getPlugins/getAllLabels.js';
import getVisibleCategories from '../bars/getPlugins/getVisibleCategories.js';
import initializeDynamicCategoryData from '../bars/getPlugins/initializeDynamicCategoryData.js';
import refreshDynamicCategoryData from '../bars/getPlugins/refreshDynamicCategoryData.js';

/**
 * Wire cross-chart legend-click synchronisation for facets that use the
 * dynamic category axis feature.
 *
 * When a fill dataset is toggled via the legend on any facet chart, this
 * wrapper propagates the same hide/show state to all sibling charts so that
 * every facet reflects the toggle identically — matching the behaviour of
 * the existing cross-chart hover sync in syncCharts.
 *
 * Only charts that already have a `legend.onClick` handler (i.e. charts
 * rendered with `theme.dynamicCategoryAxis: true`) are wrapped.
 *
 * @param {Object[]} charts - array of Chart.js chart instances (from facetBars)
 */
export default function syncLegendClicks(charts) {
    charts.forEach((chart) => {
        const original = chart.options.plugins?.legend?.onClick;
        if (!original) return;

        chart.options.plugins.legend.onClick = function (
            e,
            legendItem,
            legendRef
        ) {
            // Run the original handler for the clicked chart, preserving its
            // expected `this` context (Chart.js passes the legend instance).
            original.call(this, e, legendItem, legendRef);

            // Match by label so that siblings with different dataset ordering
            // (e.g. a fill level absent in one facet) still toggle the right
            // dataset rather than one at the same numeric index. Compare as
            // strings since legendItem.text is always a string while a dataset
            // label may be a number (e.g. numeric fill values).
            const clickedLabel = String(legendItem.text);
            const isNowVisible = chart.isDatasetVisible(
                legendItem.datasetIndex
            );

            // Propagate the resulting visibility state to every sibling chart.
            charts.forEach((sibling) => {
                if (sibling === chart) return;

                const siblingIdx = sibling.data.datasets.findIndex(
                    (ds) => String(ds.label) === clickedLabel
                );
                if (siblingIdx === -1) return;

                const siblingDataset = sibling.data.datasets[siblingIdx];

                initializeDynamicCategoryData(sibling.data.datasets);

                if (!isNowVisible) {
                    siblingDataset.data = [];
                    siblingDataset._backup_ =
                        siblingDataset._dynamicCategoryAxisOriginalData_;
                    sibling.setDatasetVisibility(siblingIdx, false);
                } else {
                    delete siblingDataset._backup_;
                    sibling.setDatasetVisibility(siblingIdx, true);
                }

                const catKey =
                    sibling.data._spec_?.orientation === 'horizontal'
                        ? 'y'
                        : 'x';
                const valKey = catKey === 'x' ? 'y' : 'x';
                const visibleCats = getVisibleCategories(sibling, catKey);

                sibling.data.labels = getAllLabels(sibling, visibleCats).filter(
                    (cat) => visibleCats.has(cat)
                );

                refreshDynamicCategoryData(
                    sibling,
                    sibling.data.labels,
                    catKey,
                    valKey
                );

                sibling.update();

                // Propagate dynamic sizing to each sibling when enabled, since
                // the original handler only resizes the clicked chart's container.
                if (sibling.data._spec_?.theme?.dynamicSizing) {
                    const sibContainer = sibling.canvas?.parentElement;
                    if (sibContainer) {
                        const numCategories = sibling.data.labels.length;
                        const pxPerCategory = 30;
                        const horizontal =
                            sibling.data._spec_?.orientation === 'horizontal';

                        if (horizontal) {
                            const area = sibling.chartArea;
                            const chartAreaHeight = area
                                ? area.bottom - area.top
                                : 0;
                            const overhead =
                                chartAreaHeight > 0
                                    ? sibling.height - chartAreaHeight
                                    : 0;
                            sibContainer.style.height =
                                numCategories * pxPerCategory + overhead + 'px';
                        } else {
                            const area = sibling.chartArea;
                            const chartAreaWidth = area
                                ? area.right - area.left
                                : 0;
                            const overhead =
                                chartAreaWidth > 0
                                    ? sibling.width - chartAreaWidth
                                    : 0;
                            sibContainer.style.width =
                                numCategories * pxPerCategory + overhead + 'px';
                        }
                    }
                }
            });
        };
    });
}
