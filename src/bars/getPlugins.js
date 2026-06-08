/**
 * Build Chart.js plugins configuration from the merged spec.
 *
 * The legend title defaults to the fill mapping variable name.
 * Set scales.fill.label to null or '' to disable the legend title.
 *
 * When theme.dynamicCategoryAxis is true, a custom legend onClick handler is
 * attached that subsets the categorical axis to only include categories present
 * in the remaining visible fill groups after each toggle.
 *
 * @param {Object} spec - merged spec
 * @returns {Object} Chart.js plugins config
 */
export default function getPlugins(spec) {
    const { labels, mapping, scales, tooltip, theme } = spec;

    const fillLabel =
        scales.fill?.label !== undefined ? scales.fill.label : mapping?.fill;

    const legend = {
        display: !!mapping.fill,
        title: {
            display: !!fillLabel,
            text: fillLabel || '',
        },
    };

    if (theme?.dynamicCategoryAxis) {
        legend.onClick = function (e, legendItem, legendRef) {
            const chart = legendRef.chart;
            const { datasetIndex } = legendItem;
            const dataset = chart.data.datasets[datasetIndex];

            // Chart.js CategoryScale.parse() calls findOrAddLabel() for every
            // data point in every dataset — including hidden ones — so simply
            // hiding a dataset is not enough: the parse step re-adds its
            // categories back into chart.data.labels on the next update().
            //
            // Fix: empty the dataset's data array on hide (backing it up) so
            // CategoryScale never sees those points. Restore on re-show.
            // Use setDatasetVisibility (no internal update() call) to keep the
            // legend strikethrough in sync without triggering a premature render.
            if (chart.isDatasetVisible(datasetIndex)) {
                dataset._backup_ = dataset.data;
                dataset.data = [];
                chart.setDatasetVisibility(datasetIndex, false);
            } else {
                if (dataset._backup_) {
                    dataset.data = dataset._backup_;
                    delete dataset._backup_;
                }
                chart.setDatasetVisibility(datasetIndex, true);
            }

            // Determine which data key holds the category value.
            // After swapPointAxes in horizontal mode the category is in `y`;
            // in vertical mode it is in `x`.
            const catKey =
                chart.data._spec_?.orientation === 'horizontal' ? 'y' : 'x';

            // Collect categories from all currently visible (non-empty) datasets.
            const visibleCats = new Set();
            for (let i = 0; i < chart.data.datasets.length; i++) {
                if (
                    chart.isDatasetVisible(i) &&
                    Array.isArray(chart.data.datasets[i].data)
                ) {
                    for (const point of chart.data.datasets[i].data) {
                        visibleCats.add(point[catKey]);
                    }
                }
            }

            // Filter the full label list to the visible subset, preserving order.
            chart.data.labels = (chart.data._allLabels_ || []).filter((cat) =>
                visibleCats.has(cat)
            );

            console.log(
                '[dynamicCategoryAxis] labels after toggle:',
                chart.data.labels
            );

            chart.update();
        };
    }

    return {
        title: {
            display: !!labels.title,
            text: labels.title || '',
        },
        tooltip: {
            enabled: true,
            ...tooltip,
        },
        legend,
        datalabels: {
            display: false,
        },
    };
}
