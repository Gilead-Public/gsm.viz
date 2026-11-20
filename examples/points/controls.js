/**
 * Attaches a 'change' listener on each listed element ID that calls fn.
 *
 * @param {string[]} ids - element IDs to listen on
 * @param {Function} fn  - callback to invoke on any change
 */
function onAnyChange(ids, fn) {
  ids.forEach((id) =>
    document.getElementById(id).addEventListener("change", fn)
  );
}

/**
 * Replaces the options of a select element.
 *
 * @param {HTMLSelectElement} select - target select
 * @param {Array<{value: string, label: string}>} options - new options
 */
function setOptions(select, options) {
  select.replaceChildren(
    ...options.map(({ value, label }) => {
      const option = document.createElement("option");
      option.value = value;
      option.textContent = label;
      return option;
    })
  );
}

// Flag colors shared by the KRI examples (matches the bars examples).
const FLAG_COLORS = {
  "-2": "#FF5859",
  "-1": "#FEAA02",
  0: "#3DAF06",
  1: "#FEAA02",
  2: "#FF5859",
};
const FLAG_ORDER = ["-2", "-1", "0", "1", "2"];
const METRIC_PREFIX_ORDER = ["kri", "cou", "qtl", "srs"];

/**
 * Sort MetricIDs by prefix (kri, cou, qtl, srs) and then alphabetically.
 *
 * @param {string[]} metrics - MetricIDs
 * @returns {string[]}
 */
function sortMetricIDs(metrics) {
  const rank = (id) => {
    const index = METRIC_PREFIX_ORDER.findIndex((p) => id.startsWith(p));
    return index === -1 ? METRIC_PREFIX_ORDER.length : index;
  };
  return [...metrics].sort((a, b) => rank(a) - rank(b) || a.localeCompare(b));
}

/**
 * Convert KRI result rows into numeric rows for the points module.
 *
 * @param {Object[]} rows - parsed results.csv rows
 * @returns {Object[]}
 */
function toPointRows(rows) {
  return rows
    .map((d) => ({
      ...d,
      Numerator: Number(d.Numerator),
      Denominator: Number(d.Denominator),
      Metric: Number(d.Metric),
      Score: Number(d.Score),
    }))
    .filter((d) => d.Denominator > 0 && Number.isFinite(d.Numerator));
}
