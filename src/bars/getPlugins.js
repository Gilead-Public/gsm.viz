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

            initializeDynamicCategoryData(chart.data.datasets);

            if (chart.isDatasetVisible(datasetIndex)) {
                dataset.data = [];
                dataset._backup_ = dataset._dynamicCategoryAxisOriginalData_;
                chart.setDatasetVisibility(datasetIndex, false);
            } else {
                delete dataset._backup_;
                chart.setDatasetVisibility(datasetIndex, true);
            }

            // Determine which data key holds the category value.
            // After swapPointAxes in horizontal mode the category is in `y`;
            // in vertical mode it is in `x`.
            const catKey =
                chart.data._spec_?.orientation === 'horizontal' ? 'y' : 'x';

            const valKey = catKey === 'x' ? 'y' : 'x';
            const visibleCats = getVisibleCategories(chart, catKey);

            // Filter the full label list to the visible subset, preserving
            // original order.
            chart.data.labels = getAllLabels(chart, visibleCats).filter((cat) =>
                visibleCats.has(cat)
            );

            refreshDynamicCategoryData(
                chart,
                chart.data.labels,
                catKey,
                valKey
            );

            chart.update();
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
                        const chartAreaHeight = area
                            ? area.bottom - area.top
                            : 0;
                        const overhead =
                            chartAreaHeight > 0
                                ? chart.height - chartAreaHeight
                                : 0;
                        container.style.height =
                            numCategories * pxPerCategory + overhead + 'px';
                    } else {
                        const area = chart.chartArea;
                        const chartAreaWidth = area
                            ? area.right - area.left
                            : 0;
                        const overhead =
                            chartAreaWidth > 0
                                ? chart.width - chartAreaWidth
                                : 0;
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

function initializeDynamicCategoryData(datasets) {
    for (const dataset of datasets) {
        if (!dataset._dynamicCategoryAxisOriginalData_) {
            dataset._dynamicCategoryAxisOriginalData_ =
                dataset._backup_ || dataset.data || [];
        }
    }
}

function getVisibleCategories(chart, catKey) {
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

function getAllLabels(chart, visibleCats) {
    return chart.data._allLabels_ || [...visibleCats];
}

function refreshDynamicCategoryData(chart, labels, catKey, valKey) {
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
            clearDatasetMeta(chart, i);
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

function alignDataToLabels(data, labels, catKey, valKey) {
    const pointByCategory = new Map(
        data.map((point) => [point[catKey], point])
    );

    return labels.map(
        (cat) =>
            pointByCategory.get(cat) || {
                [catKey]: cat,
                [valKey]: 0,
                _rawY: 0,
                _placeholder: true,
            }
    );
}

function clearDatasetMeta(chart, datasetIndex) {
    const meta = chart.getDatasetMeta?.(datasetIndex);

    if (meta) {
        meta._parsed = [];
        meta._sorted = true;
    }
}

function buildTooltip(tooltip, position) {
    const base = { enabled: true, ...tooltip };

    if (position !== 'fill') return base;
    if (base.callbacks?.label) return base;

    const fillLabelCallback = (context) => {
        const indexAxis = context.chart?.options?.indexAxis || 'x';
        const pct = indexAxis === 'y' ? context.parsed.x : context.parsed.y;
        const prefix = context.dataset.label
            ? `${context.dataset.label}: `
            : '';
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
