import { Chart } from 'chart.js';
import getAllLabels from '../bars/getPlugins/getAllLabels.js';
import getVisibleCategories from '../bars/getPlugins/getVisibleCategories.js';
import initializeDynamicCategoryData from '../bars/getPlugins/initializeDynamicCategoryData.js';
import refreshDynamicCategoryData from '../bars/getPlugins/refreshDynamicCategoryData.js';

/**
 * Wire cross-chart legend-click synchronisation for all faceted charts that
 * use a fill mapping.
 *
 * When a fill dataset is toggled via the legend on any facet chart, this
 * wrapper propagates the same hide/show state to all sibling charts so that
 * every facet reflects the toggle identically — matching the behaviour of
 * the existing cross-chart hover sync in syncCharts.
 *
 * For charts using `theme.dynamicCategoryAxis`, sibling propagation also
 * rebuilds each sibling's visible category labels and resizes the container
 * when `theme.dynamicSizing` is set. For plain facet charts, a simple
 * setDatasetVisibility + update is used.
 *
 * All charts are wrapped regardless of whether they already have a custom
 * legend.onClick. When no custom handler exists, Chart.js's default legend
 * handler is used as the fallback so built-in toggle behaviour is preserved.
 *
 * @param {Object[]} charts - array of Chart.js chart instances (from facetBars)
 * @param {Object}   [options] - configuration options
 * @param {boolean}  [options.sync=true] - when true, legend clicks propagate
 *   to all sibling charts; when false, each chart's legend operates independently
 */
export default function syncLegendClicks(charts, { sync = true } = {}) {
    charts.forEach((chart) => {
        // Resolve the base handler: on the first call, read from the chart's
        // current legend config; on subsequent calls (e.g. after updateSpec
        // replaces plugins), use the freshly-installed handler rather than the
        // previously-stored sync wrapper. We detect re-wrapping by checking
        // whether the stored original still matches the current handler.
        const currentOnClick = chart.options.plugins?.legend?.onClick;
        const storedOriginal = chart._facetLegendOriginalOnClick;

        let original;
        if (
            storedOriginal &&
            currentOnClick === chart._facetLegendSyncWrapper
        ) {
            // Already wrapped — keep the stored original (avoid nesting).
            original = storedOriginal;
        } else {
            // First wrap, or handler was replaced by updateSpec — capture the
            // new base handler.
            original = currentOnClick ?? Chart.defaults.plugins.legend.onClick;
            chart._facetLegendOriginalOnClick = original;
        }

        const wrapper = function (e, legendItem, legendRef) {
            // Run the base handler for the clicked chart, preserving its
            // expected `this` context (Chart.js passes the legend instance).
            original.call(this, e, legendItem, legendRef);

            // When sync is disabled, each facet's legend operates independently
            // — skip sibling propagation entirely.
            if (!sync) return;

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

                const useDynamic =
                    sibling.data._spec_?.theme?.dynamicCategoryAxis;

                if (useDynamic) {
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

                    sibling.data.labels = getAllLabels(
                        sibling,
                        visibleCats
                    ).filter((cat) => visibleCats.has(cat));

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
                            const pxPerCategory =
                                sibling.data._spec_?.theme?.pxPerCategory || 30;
                            const horizontal =
                                sibling.data._spec_?.orientation ===
                                'horizontal';

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
                                    numCategories * pxPerCategory +
                                    overhead +
                                    'px';
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
                                    numCategories * pxPerCategory +
                                    overhead +
                                    'px';
                            }
                        }
                    }
                } else {
                    // Plain facet: simple visibility toggle + redraw.
                    sibling.setDatasetVisibility(siblingIdx, isNowVisible);
                    sibling.update();
                }
            });
        };

        chart.options.plugins.legend.onClick = wrapper;
        chart._facetLegendSyncWrapper = wrapper;
    });
}
