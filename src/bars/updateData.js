import mergeSpec from "./mergeSpec.js";
import structureData from "./structureData.js";
import getScales from "./getScales.js";
import getPlugins from "./getPlugins.js";

/**
 * Re-run the full data pipeline on an existing chart with a new spec.
 *
 * @param {Object} chart - Chart.js instance
 * @param {Object} spec - new user-supplied spec (raw, not merged)
 */
export default function updateData(chart, spec) {
  const merged = mergeSpec(spec);
  const { datasets, labels } = structureData(merged);
  const scalesConfig = getScales(merged);

  chart.data.datasets = datasets;
  chart.data.labels = labels;
  chart.data._spec_ = merged;

  chart.options.indexAxis = scalesConfig._indexAxis;
  chart.options.scales = {
    x: scalesConfig.x,
    y: scalesConfig.y,
  };
  chart.options.plugins = getPlugins(merged);

  chart.update();
}
