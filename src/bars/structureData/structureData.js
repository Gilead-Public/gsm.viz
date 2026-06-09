import aggregateCounts from './aggregateCounts.js';
import darkenHex from './darkenHex.js';
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
 * @returns {{ datasets: Array, labels: Array }}
 */
export default function structureData(spec) {
    const { data, mapping, scales, orientation } = spec;
    const { x: xKey, y: yKey, fill: fillKey } = mapping;

    const fillOrder = scales.fill?.order;
    const activeData =
        fillKey && fillOrder
            ? (() => {
                  const allowed = new Set(fillOrder.map(String));
                  return data.filter((d) => allowed.has(String(d[fillKey])));
              })()
            : data;

    const labels = resolveCategories(activeData, xKey, scales.x?.order);
    const categoryIndex = new Map(labels.map((cat, i) => [cat, i]));

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

    return { datasets, labels };
}
