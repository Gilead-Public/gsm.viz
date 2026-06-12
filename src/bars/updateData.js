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
    const merged = mergeSpec(data, spec);
    const { datasets, labels, nExcluded } = structureData(merged);
    merged._nExcluded = nExcluded;
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
}
