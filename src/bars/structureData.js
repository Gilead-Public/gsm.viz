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
                    sensitivity: 'base',
                })
            );
        return [...ordered, ...remaining];
    }

    return dataCategories.sort((a, b) =>
        String(a).localeCompare(String(b), undefined, {
            sensitivity: 'base',
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
    const remaining = datasets.filter(
        (ds) => !orderedSet.has(String(ds.label))
    );
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
                .sort(
                    (a, b) => categoryIndex.get(a.x) - categoryIndex.get(b.x)
                ),
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
                .sort(
                    (a, b) => categoryIndex.get(a.x) - categoryIndex.get(b.x)
                ),
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
 * Darken a hex color by reducing each RGB channel by 20%.
 *
 * @param {string} hex - 6-digit hex color string (e.g. '#4e79a7')
 * @returns {string} darkened hex color
 */
function darkenHex(hex) {
    const r = Math.round(parseInt(hex.slice(1, 3), 16) * 0.8);
    const g = Math.round(parseInt(hex.slice(3, 5), 16) * 0.8);
    const b = Math.round(parseInt(hex.slice(5, 7), 16) * 0.8);
    return (
        '#' +
        r.toString(16).padStart(2, '0') +
        g.toString(16).padStart(2, '0') +
        b.toString(16).padStart(2, '0')
    );
}

/**
 * Normalize y values within each x-category to percentages of the category
 * total. For each point, stores the original value as `_rawY` then replaces
 * `y` with `(rawY / categoryTotal) * 100`. Zero-total categories are left at 0.
 *
 * @param {Array} datasets - structured datasets (point objects with x/y)
 * @param {boolean} horizontal - true when orientation is horizontal
 */
function normalizeFill(datasets, horizontal) {
    // In horizontal mode the axes are already swapped so the "value" is on x.
    const catKey = horizontal ? 'x' : 'y';
    const valKey = horizontal ? 'y' : 'x';

    // Build a map of category → total across all datasets.
    const totals = new Map();
    for (const ds of datasets) {
        for (const pt of ds.data) {
            const cat = pt[valKey];
            const val = pt[catKey];
            totals.set(cat, (totals.get(cat) || 0) + val);
        }
    }

    // Replace values with percentages, storing originals as _rawY.
    for (const ds of datasets) {
        for (const pt of ds.data) {
            const cat = pt[valKey];
            const total = totals.get(cat) || 0;
            pt._rawY = pt[catKey];
            pt[catKey] = total === 0 ? 0 : (pt._rawY / total) * 100;
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

    // When fill.order is provided, drop rows whose fill value is not in the
    // order. This keeps unknown/empty values (e.g. Flag="") out of the chart
    // and ensures counts are accurate.
    const fillOrder = scales.fill?.order;
    const activeData =
        fillKey && fillOrder
            ? (() => {
                  const allowed = new Set(fillOrder.map(String));
                  return data.filter((d) => allowed.has(String(d[fillKey])));
              })()
            : data;

    // Resolve category ordering.
    const labels = resolveCategories(activeData, xKey, scales.x?.order);
    const categoryIndex = new Map(labels.map((cat, i) => [cat, i]));

    let datasets;

    if (!yKey) {
        // Count mode — aggregate rows per category.
        datasets = aggregateCounts(activeData, xKey, fillKey, categoryIndex);
    } else {
        // Value mode — use y mapping directly.
        const points = activeData.map((d) => ({
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
                        (a, b) =>
                            categoryIndex.get(a.x) - categoryIndex.get(b.x)
                    ),
                },
            ];
        }
    }

    // Reorder datasets by fill order if specified.
    if (fillOrder && fillKey) {
        datasets = reorderDatasets(datasets, fillOrder);
    }

    // Apply fill palette colors if provided.
    // For grouped charts (fillKey present), each dataset gets the palette color
    // corresponding to its fill value or position. For ungrouped single-series
    // charts, the first palette color is used.
    // When fill.order is present, use each dataset's position in that order
    // as the palette index so colors remain semantically aligned even when
    // some fill values are absent from the data.
    const palette = scales.fill?.palette;
    if (palette) {
        if (fillKey) {
            datasets.forEach((ds, i) => {
                const colorIndex = fillOrder
                    ? fillOrder.indexOf(String(ds.label))
                    : -1;
                const bg =
                    palette[
                        (colorIndex >= 0 ? colorIndex : i) % palette.length
                    ];
                ds.backgroundColor = bg;
                ds.borderColor = darkenHex(bg);
                ds.borderWidth = 1;
                ds.borderRadius = 2;
            });
        } else {
            // Single-series ungrouped: use the first palette color.
            datasets[0].backgroundColor = palette[0];
            datasets[0].borderColor = darkenHex(palette[0]);
            datasets[0].borderWidth = 1;
            datasets[0].borderRadius = 2;
        }
    }

    // Swap point axes for horizontal orientation.
    if (orientation === 'horizontal') {
        swapPointAxes(datasets);
    }

    // Apply within-category percentage normalization for position='fill'.
    if (spec.position === 'fill') {
        normalizeFill(datasets, orientation === 'horizontal');
    }

    return { datasets, labels };
}
