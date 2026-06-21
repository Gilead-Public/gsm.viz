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
            // Run the original handler for the clicked chart first.
            original(e, legendItem, legendRef);

            const { datasetIndex } = legendItem;
            const isNowVisible = chart.isDatasetVisible(datasetIndex);

            // Propagate the resulting visibility state to every sibling chart.
            charts.forEach((sibling) => {
                if (sibling === chart) return;

                const siblingDataset = sibling.data.datasets[datasetIndex];
                if (!siblingDataset) return;

                initializeDynamicCategoryData(sibling.data.datasets);

                if (!isNowVisible) {
                    siblingDataset.data = [];
                    siblingDataset._backup_ =
                        siblingDataset._dynamicCategoryAxisOriginalData_;
                    sibling.setDatasetVisibility(datasetIndex, false);
                } else {
                    delete siblingDataset._backup_;
                    sibling.setDatasetVisibility(datasetIndex, true);
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
            });
        };
    });
}
