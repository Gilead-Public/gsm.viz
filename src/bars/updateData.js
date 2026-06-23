import mergeSpec from './mergeSpec.js';
import structureData from './structureData.js';
import getScales from './getScales.js';
import getPlugins from './getPlugins.js';

/**
 * Re-run the full data pipeline on an existing chart with new data and spec.
 *
 * @param {Object} chart - Chart.js instance
 * @param {Array}  data  - new data array
 * @param {Object} spec  - new user-supplied spec (raw, not merged)
 */
export default function updateData(chart, data, spec) {
    const existing = chart.data._spec_;
    const merged = mergeSpec(data, spec);
    // mergeSpec rebuilds a fresh spec from the public fields and drops internal
    // state, so carry over the original Top-N value preserved when the user
    // toggled to "show all" via nCategoriesToggle.
    if (existing?._originalNCategories) {
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
