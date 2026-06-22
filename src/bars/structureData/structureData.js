import aggregateCounts from './aggregateCounts.js';
import darkenHex from './darkenHex.js';
import limitCategories from './limitCategories.js';
import normalizeFill from './normalizeFill.js';
import reorderDatasets from './reorderDatasets.js';
import resolveCategories from './resolveCategories.js';
import swapPointAxes from './swapPointAxes.js';

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
 * @returns {{ datasets: Array, labels: Array, nExcluded: number }}
 */
export default function structureData(spec) {
    const { data, mapping, scales, orientation } = spec;
    const { x: xKey, y: yKey, fill: fillKey } = mapping;

    // Resolve scales.fill.colors (named map) into order + palette when present.
    // colors takes precedence over any separately provided order/palette.
    const fillColors = scales.fill?.colors;
    const fillOrder = fillColors ? Object.keys(fillColors) : scales.fill?.order;
    const palette = fillColors
        ? Object.values(fillColors)
        : scales.fill?.palette;

    let activeData =
        fillKey && fillOrder
            ? (() => {
                  const allowed = new Set(fillOrder.map(String));
                  return data.filter((d) => allowed.has(String(d[fillKey])));
              })()
            : data;

    let labels = resolveCategories(activeData, xKey, scales.x?.order);

    const xSort = scales.x?.sort;
    const xSortDir = scales.x?.sortDir;

    // Pre-sort: establish the desired category order before limitCategories
    // selects the top N. This ensures sortDir affects which categories are
    // included (not just their display order).
    //
    // total   — sort all categories by aggregate value, descending by default.
    //           Post-sort will reverse this if sortDir='asc'.
    // alphanumeric + sortDir='desc' — reverse the alphanumeric-asc default so
    //           limitCategories picks from the Z→A end.
    if (!scales.x?.order) {
        if (xSort === 'total') {
            const totals = new Map();
            for (const d of activeData) {
                const cat = d[xKey];
                const val = yKey ? Number(d[yKey]) || 0 : 1;
                totals.set(cat, (totals.get(cat) || 0) + val);
            }
            labels = [...labels].sort((a, b) => {
                const diff =
                    (totals.get(b) || 0) - (totals.get(a) || 0); // always desc here
                return diff !== 0
                    ? diff
                    : String(a).localeCompare(String(b), undefined, {
                          sensitivity: 'base',
                      });
            });
        } else if (xSortDir === 'desc') {
            labels = [...labels].reverse();
        }
    }

    // Apply top-N category limit when spec.nCategories is set.
    let nExcluded = 0;
    if (spec.nCategories) {
        const result = limitCategories(
            labels,
            activeData,
            xKey,
            yKey,
            spec.nCategories,
            xSort
        );
        labels = result.limitedCategories;
        nExcluded = result.nExcluded;
        const allowed = new Set(labels);
        activeData = activeData.filter((d) => allowed.has(d[xKey]));
    }

    const categoryIndex = new Map(labels.map((cat, i) => [cat, i]));

    // When dynamicCategoryAxis is active and a y variable is mapped, restrict
    // to categories that have at least one row with a finite (non-missing) y
    // value. This prevents phantom bars for categories where all y data is
    // absent or non-numeric.
    if (yKey && spec.theme?.dynamicCategoryAxis) {
        const catsWithData = new Set(
            activeData
                .filter((d) => {
                    const v = d[yKey];
                    return v != null && v !== '' && Number.isFinite(Number(v));
                })
                .map((d) => d[xKey])
        );
        labels = labels.filter((cat) => catsWithData.has(cat));
        activeData = activeData.filter((d) => catsWithData.has(d[xKey]));
        categoryIndex.clear();
        labels.forEach((cat, i) => categoryIndex.set(cat, i));
    }

    // Post-sort: the total pre-sort is always descending; reverse for asc.
    if (!scales.x?.order && xSort === 'total' && xSortDir === 'asc') {
        labels = [...labels].reverse();
        categoryIndex.clear();
        labels.forEach((cat, i) => categoryIndex.set(cat, i));
    }

    let datasets;

    if (!yKey) {
        datasets = aggregateCounts(activeData, xKey, fillKey, categoryIndex);
    } else {
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

    if (fillOrder && fillKey) {
        datasets = reorderDatasets(datasets, fillOrder);
    }

    if (palette && palette.length > 0) {
        if (fillKey) {
            const fillOrderStrings = fillOrder ? fillOrder.map(String) : null;
            datasets.forEach((ds, i) => {
                const colorIndex = fillOrderStrings
                    ? fillOrderStrings.indexOf(String(ds.label))
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
            datasets[0].backgroundColor = palette[0];
            datasets[0].borderColor = darkenHex(palette[0]);
            datasets[0].borderWidth = 1;
            datasets[0].borderRadius = 2;
        }
    }

    if (orientation === 'horizontal') {
        swapPointAxes(datasets);
    }

    if (spec.position === 'fill') {
        normalizeFill(datasets, orientation === 'horizontal');
    }

    return { datasets, labels, nExcluded };
}
