import mergeSpec from './mergeSpec.js';
import structureData from './structureData.js';
import getScales from './getScales.js';
import getPlugins from './getPlugins.js';

/**
 * Re-run the spec pipeline on an existing chart with a partial spec update.
 * Merges the incoming spec over the existing stored spec, then rebuilds
 * data, scales, and plugins to handle orientation/order changes correctly.
 *
 * @param {Object} chart - Chart.js instance
 * @param {Object} spec - partial user-supplied spec overrides
 */
export default function updateSpec(chart, spec) {
    const existing = chart.data._spec_;

    // Merge incoming partial spec over the existing stored spec.
    const combined = {
        ...existing,
        ...spec,
        mapping: { ...existing.mapping, ...spec.mapping },
        scales: {
            x: { ...existing.scales?.x, ...spec.scales?.x },
            y: { ...existing.scales?.y, ...spec.scales?.y },
            fill: { ...existing.scales?.fill, ...spec.scales?.fill },
        },
        labels: { ...existing.labels, ...spec.labels },
        annotations: {
            ...existing.annotations,
            ...spec.annotations,
            labels: {
                segment: {
                    ...existing.annotations?.labels?.segment,
                    ...spec.annotations?.labels?.segment,
                },
                total: {
                    ...existing.annotations?.labels?.total,
                    ...spec.annotations?.labels?.total,
                },
                inside: {
                    ...existing.annotations?.labels?.inside,
                    ...spec.annotations?.labels?.inside,
                },
                outside: {
                    ...existing.annotations?.labels?.outside,
                    ...spec.annotations?.labels?.outside,
                },
            },
        },
        theme: { ...existing.theme, ...spec.theme },
    };

    const merged = mergeSpec(existing.data, combined);
    if (existing._originalNCategories) {
        merged._originalNCategories = existing._originalNCategories;
    }
    const { datasets, labels, nExcluded, nRowsExcluded } =
        structureData(merged);
    merged._nExcluded = nExcluded;
    merged._nRowsExcluded = nRowsExcluded;
    const scalesConfig = getScales(merged);

    chart.data.datasets = datasets;
    chart.data.labels = labels;
    chart.data._allLabels_ = [...labels];
    chart.data._spec_ = merged;

    chart.options.indexAxis = scalesConfig._indexAxis;
    chart.options.scales = {
        x: scalesConfig.x,
        y: scalesConfig.y,
    };
    chart.options.plugins = getPlugins(merged);

    chart.update();

    // Always clear any previously-applied inline sizing first so that
    // disabling dynamicSizing restores the CSS-controlled dimensions.
    const el = chart.canvas.parentNode;
    el.style.height = '';
    el.style.width = '';

    if (merged.theme.dynamicSizing) {
        const numCategories = labels.length;
        const pxPerCategory = 30;

        if (merged.orientation === 'horizontal') {
            const area = chart.chartArea;
            const chartAreaHeight = area ? area.bottom - area.top : 0;
            const overhead =
                chartAreaHeight > 0 ? chart.height - chartAreaHeight : 0;
            el.style.height = numCategories * pxPerCategory + overhead + 'px';
        } else {
            const area = chart.chartArea;
            const chartAreaWidth = area ? area.right - area.left : 0;
            const overhead =
                chartAreaWidth > 0 ? chart.width - chartAreaWidth : 0;
            el.style.width = numCategories * pxPerCategory + overhead + 'px';
        }
    }
}
