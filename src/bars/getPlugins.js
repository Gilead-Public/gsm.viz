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

            // Toggle the clicked dataset's visibility (mirrors Chart.js default).
            chart.data.datasets[datasetIndex].hidden =
                !chart.data.datasets[datasetIndex].hidden;

            // Determine which data key holds the category value.
            // After swapPointAxes in horizontal mode the category is in `y`;
            // in vertical mode it is in `x`.
            const catKey =
                chart.data._spec_?.orientation === 'horizontal' ? 'y' : 'x';

            // Collect the union of category values from all visible datasets.
            const visibleCats = new Set();
            for (const ds of chart.data.datasets) {
                if (!ds.hidden && Array.isArray(ds.data)) {
                    for (const point of ds.data) {
                        visibleCats.add(point[catKey]);
                    }
                }
            }

            // Filter the full label list to the visible subset, preserving order.
            chart.data.labels = (chart.data._allLabels_ || []).filter((cat) =>
                visibleCats.has(cat)
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
