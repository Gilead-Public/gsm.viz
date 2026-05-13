/**
 * Resolve category order from data and spec.
 *
 * - If spec.scales.x.order is provided, use that order, filtering to
 *   categories that exist in data, then append any remaining data
 *   categories in alphanumeric order.
 * - Otherwise, extract unique categories from data and sort
 *   alphanumerically (case-insensitive).
 *
 * @param {Array} data - raw data array
 * @param {string} xKey - the mapping key for the x (category) axis
 * @param {Array} [explicitOrder] - optional explicit category order
 * @returns {Array} ordered category labels
 */
function resolveCategories(data, xKey, explicitOrder) {
  const dataCategories = [...new Set(data.map((d) => d[xKey]))];

  if (explicitOrder) {
    const dataSet = new Set(dataCategories);
    const ordered = explicitOrder.filter((cat) => dataSet.has(cat));
    const orderedSet = new Set(ordered);
    const remaining = dataCategories
      .filter((cat) => !orderedSet.has(cat))
      .sort((a, b) =>
        String(a).localeCompare(String(b), undefined, {
          sensitivity: "base",
        })
      );
    return [...ordered, ...remaining];
  }

  return dataCategories.sort((a, b) =>
    String(a).localeCompare(String(b), undefined, {
      sensitivity: "base",
    })
  );
}

/**
 * Transform spec data + mapping into Chart.js-compatible datasets and labels.
 *
 * @param {Object} spec - merged spec object
 * @returns {{ datasets: Array, labels: Array }}
 */
export default function structureData(spec) {
  const { data, mapping, scales } = spec;
  const { x: xKey, y: yKey, fill: fillKey } = mapping;

  // Resolve category ordering.
  const labels = resolveCategories(data, xKey, scales.x?.order);
  const categoryIndex = new Map(labels.map((cat, i) => [cat, i]));

  // Map raw data to internal points.
  const points = data.map((d) => ({
    x: d[xKey],
    y: Number(d[yKey]) || 0,
    _fill: fillKey ? d[fillKey] : undefined,
    _datum: d,
  }));

  let datasets;

  if (fillKey) {
    // Group by fill value, preserving insertion order.
    const groups = new Map();
    for (const point of points) {
      const key = point._fill;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(point);
    }

    datasets = [...groups.entries()].map(([fillValue, pts]) => ({
      label: fillValue,
      data: pts.sort((a, b) => categoryIndex.get(a.x) - categoryIndex.get(b.x)),
    }));
  } else {
    datasets = [
      {
        data: points.sort(
          (a, b) => categoryIndex.get(a.x) - categoryIndex.get(b.x)
        ),
      },
    ];
  }

  return { datasets, labels };
}
