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
 * Reorder datasets according to an explicit fill order.
 * Values in the order with no matching dataset are dropped.
 * Datasets not in the order are appended in their original order.
 * Labels are coerced to strings for comparison so numeric dataset
 * labels match string fill.order entries.
 *
 * @param {Array} datasets - array of dataset objects with `label` property
 * @param {Array} fillOrder - explicit ordering of fill values
 * @returns {Array} reordered datasets
 */
function reorderDatasets(datasets, fillOrder) {
  const datasetMap = new Map(datasets.map((ds) => [String(ds.label), ds]));
  const ordered = fillOrder
    .filter((val) => datasetMap.has(String(val)))
    .map((val) => datasetMap.get(String(val)));
  const orderedSet = new Set(fillOrder.map(String));
  const remaining = datasets.filter((ds) => !orderedSet.has(String(ds.label)));
  return [...ordered, ...remaining];
}

/**
 * Aggregate data into count-mode points: one point per category (and
 * optionally per fill group), where y = number of rows.
 */
function aggregateCounts(data, xKey, fillKey, categoryIndex) {
  if (fillKey) {
    const groups = new Map();
    for (const d of data) {
      const key = d[fillKey];
      if (!groups.has(key)) groups.set(key, new Map());
      const catMap = groups.get(key);
      const cat = d[xKey];
      if (!catMap.has(cat)) catMap.set(cat, []);
      catMap.get(cat).push(d);
    }

    return [...groups.entries()].map(([fillValue, catMap]) => ({
      label: fillValue,
      data: [...catMap.entries()]
        .map(([cat, rows]) => ({
          x: cat,
          y: rows.length,
          _fill: fillValue,
          _datum: rows,
        }))
        .sort((a, b) => categoryIndex.get(a.x) - categoryIndex.get(b.x)),
    }));
  }

  const catMap = new Map();
  for (const d of data) {
    const cat = d[xKey];
    if (!catMap.has(cat)) catMap.set(cat, []);
    catMap.get(cat).push(d);
  }

  return [
    {
      data: [...catMap.entries()]
        .map(([cat, rows]) => ({
          x: cat,
          y: rows.length,
          _datum: rows,
        }))
        .sort((a, b) => categoryIndex.get(a.x) - categoryIndex.get(b.x)),
    },
  ];
}

/**
 * Swap x and y on every data point in every dataset.
 * Used for horizontal orientation where Chart.js expects
 * { x: value, y: category } when indexAxis is 'y'.
 */
function swapPointAxes(datasets) {
  for (const ds of datasets) {
    for (const point of ds.data) {
      const tmp = point.x;
      point.x = point.y;
      point.y = tmp;
    }
  }
}

/**
 * Transform spec data + mapping into Chart.js-compatible datasets and labels.
 *
 * When mapping.y is omitted, operates in count mode: each bar's height
 * is the number of rows for that category (like ggplot2's stat="count").
 *
 * When orientation is 'horizontal', data points are emitted as
 * { x: value, y: category } so Chart.js renders correctly with indexAxis 'y'.
 *
 * @param {Object} spec - merged spec object
 * @returns {{ datasets: Array, labels: Array }}
 */
export default function structureData(spec) {
  const { data, mapping, scales, orientation } = spec;
  const { x: xKey, y: yKey, fill: fillKey } = mapping;

  // Resolve category ordering.
  const labels = resolveCategories(data, xKey, scales.x?.order);
  const categoryIndex = new Map(labels.map((cat, i) => [cat, i]));

  let datasets;

  if (!yKey) {
    // Count mode — aggregate rows per category.
    datasets = aggregateCounts(data, xKey, fillKey, categoryIndex);
  } else {
    // Value mode — use y mapping directly.
    const points = data.map((d) => ({
      x: d[xKey],
      y: Number(d[yKey]) || 0,
      _fill: fillKey ? d[fillKey] : undefined,
      _datum: d,
    }));

    if (fillKey) {
      const groups = new Map();
      for (const point of points) {
        const key = point._fill;
        if (!groups.has(key)) groups.set(key, []);
        groups.get(key).push(point);
      }

      datasets = [...groups.entries()].map(([fillValue, pts]) => ({
        label: fillValue,
        data: pts.sort(
          (a, b) => categoryIndex.get(a.x) - categoryIndex.get(b.x)
        ),
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
  }

  // Reorder datasets by fill order if specified.
  const fillOrder = scales.fill?.order;
  if (fillOrder && fillKey) {
    datasets = reorderDatasets(datasets, fillOrder);
  }

  // Apply fill palette colors if provided.
  // When fill.order is present, use each dataset's position in that order
  // as the palette index so colors remain semantically aligned even when
  // some fill values are absent from the data.
  const palette = scales.fill?.palette;
  if (palette && fillKey) {
    datasets.forEach((ds, i) => {
      const colorIndex = fillOrder
        ? fillOrder.indexOf(String(ds.label))
        : -1;
      ds.backgroundColor =
        palette[(colorIndex >= 0 ? colorIndex : i) % palette.length];
    });
  }

  // Swap point axes for horizontal orientation.
  if (orientation === "horizontal") {
    swapPointAxes(datasets);
  }

  return { datasets, labels };
}
