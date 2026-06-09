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
    const { labels, mapping, scales, tooltip, theme, position } = spec;

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
for (d of chart.data.datasets) {
    console.log(d.label);
    console.log(d.data.filter(di => di.y === '0X7932'));
}
            // Reapply dynamic container sizing if enabled, using the post-update
            // chart area measurements and the new (possibly smaller) label count.
            if (chart.data._spec_?.theme?.dynamicSizing) {
                const container = chart.canvas?.parentElement;
                if (container) {
                    const numCategories = chart.data.labels.length;
                    const pxPerCategory = 30;
                    const horizontal =
                        chart.data._spec_?.orientation === 'horizontal';

                    if (horizontal) {
                        const area = chart.chartArea;
                        const chartAreaHeight = area ? area.bottom - area.top : 0;
                        const overhead =
                            chartAreaHeight > 0
                                ? chart.height - chartAreaHeight
                                : 0;
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
        };
    }

    return {
        title: {
            display: !!labels.title,
            text: labels.title || '',
        },
        tooltip: buildTooltip(tooltip, position),
        legend,
        datalabels: {
            display: false,
        },
    };
}

function buildTooltip(tooltip, position) {
    const base = { enabled: true, ...tooltip };

    if (position !== 'fill') return base;
    if (base.callbacks?.label) return base;

    const fillLabelCallback = (context) => {
        const indexAxis = context.chart?.options?.indexAxis || 'x';
        const pct = indexAxis === 'y' ? context.parsed.x : context.parsed.y;
        const prefix = context.dataset.label ? `${context.dataset.label}: ` : '';
        return `${prefix}${pct.toFixed(1)}%`;
    };

    return {
        ...base,
        callbacks: {
            ...base.callbacks,
            label: fillLabelCallback,
        },
    };
}
