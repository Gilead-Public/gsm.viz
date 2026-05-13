import mergeSpec from "./mergeSpec.js";
import getScales from "./getScales.js";
import getPlugins from "./getPlugins.js";

/**
 * Re-run the spec pipeline (scales, plugins, theme) without changing data.
 *
 * @param {Object} chart - Chart.js instance
 * @param {Object} spec - new user-supplied spec (raw, not merged)
 */
export default function updateSpec(chart, spec) {
  const merged = mergeSpec(spec);
  const scalesConfig = getScales(merged);

  // Preserve existing data, update everything else.
  merged.data = chart.data._spec_.data;
  merged.mapping = chart.data._spec_.mapping;
  chart.data._spec_ = merged;

  chart.options.indexAxis = scalesConfig._indexAxis;
  chart.options.scales = {
    x: scalesConfig.x,
    y: scalesConfig.y,
  };
  chart.options.plugins = getPlugins(merged);

  chart.update();
}
