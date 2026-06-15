import structureData from '../bars/structureData/structureData.js';

/**
 * Compute global axis bounds across all facets for constant-scale rendering.
 *
 * Runs bars/structureData for each facet to produce the same aggregated values
 * that would be rendered, then returns the overall min/max for the value axis
 * (always expressed in spec-y terms, regardless of orientation).
 *
 * For stacked position, positive and negative contributions are summed
 * independently per category so that negative stacks are correctly captured.
 *
 * For position='fill', bounds are always [0, 100].
 * Returns {} when the relevant axis is configured as free (per-facet auto-scale).
 *
 * @param {Map<string, Array>} facetDataMap - Map from facet value to data rows
 * @param {Object} spec - merged facetBars spec
 * @returns {{ yMin?: number, yMax?: number }}
 */
export default function computeGlobalScales(facetDataMap, spec) {
    const { position, orientation, mapping, scales, facet } = spec;
    const horizontal = orientation === 'horizontal';

    // fill position always uses [0, 100]; no computation needed
    if (position === 'fill') {
        return { yMin: 0, yMax: 100 };
    }

    // Check if the value axis is free (per-facet auto-scaling)
    const yFree = facet?.scales?.y?.free ?? false;
    if (yFree) return {};

    const stacked = position === 'stack';
    let globalMax = 0;
    let globalMin = 0;

    for (const [facetValue, facetData] of facetDataMap) {
        // Resolve a function-based x order to a per-facet array.
        const xOrder =
            typeof scales?.x?.order === 'function'
                ? scales.x.order(facetValue, facetData)
                : scales?.x?.order;
        const resolvedScales =
            xOrder !== scales?.x?.order
                ? { ...scales, x: { ...scales?.x, order: xOrder } }
                : scales;

        // Build a minimal spec compatible with bars/structureData
        const subSpec = {
            data: facetData,
            mapping,
            orientation,
            position,
            scales: resolvedScales,
            nCategories: undefined,
        };

        const { datasets, labels } = structureData(subSpec);

        if (stacked) {
            // Track positive and negative sums independently per category so
            // that bars stacking below zero are correctly included in globalMin.
            const positiveTotals = new Map(labels.map((l) => [l, 0]));
            const negativeTotals = new Map(labels.map((l) => [l, 0]));

            for (const ds of datasets) {
                for (const point of ds.data) {
                    // After swapPointAxes, horizontal data has value in .x, category in .y
                    const cat = horizontal ? point.y : point.x;
                    const val = Number(horizontal ? point.x : point.y) || 0;
                    const key = String(cat);
                    if (val > 0 && positiveTotals.has(key)) {
                        positiveTotals.set(key, positiveTotals.get(key) + val);
                    } else if (val < 0 && negativeTotals.has(key)) {
                        negativeTotals.set(key, negativeTotals.get(key) + val);
                    }
                }
            }

            for (const total of positiveTotals.values()) {
                if (total > globalMax) globalMax = total;
            }
            for (const total of negativeTotals.values()) {
                if (total < globalMin) globalMin = total;
            }
        } else {
            // dodge / identity: min and max of individual values
            for (const ds of datasets) {
                for (const point of ds.data) {
                    const val = Number(horizontal ? point.x : point.y) || 0;
                    if (val > globalMax) globalMax = val;
                    if (val < globalMin) globalMin = val;
                }
            }
        }
    }

    return { yMin: globalMin, yMax: globalMax };
}
