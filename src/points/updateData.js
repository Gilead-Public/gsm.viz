import getStoredInputs from "./getStoredInputs.js";
import rebuildChart from "./rebuildChart.js";

/**
 * Replace point rows and run the complete rendering pipeline in place.
 *
 * @param {Object} chart - Chart.js chart instance.
 * @param {Array} data - Replacement source rows.
 * @param {Object} [spec] - Complete replacement spec; omitted retains current spec.
 * @returns {Object} The updated chart instance.
 */
export default function updateData(chart, data, spec) {
  return rebuildChart(
    chart,
    data,
    spec === undefined ? getStoredInputs(chart).spec : spec
  );
}
