import structureData from '../bars/structureData/structureData.js';

/**
 * Compute global axis bounds across all facets for constant-scale rendering.
 *
 * Runs bars/structureData for each facet to produce the same aggregated values
 * that would be rendered, then returns the overall min/max for the value axis
 * (always expressed in spec-y terms, regardless of orientation).
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

    for (const [, facetData] of facetDataMap) {
        // Build a minimal spec compatible with bars/structureData
        const subSpec = {
            data: facetData,
            mapping,
            orientation,
            position,
            scales,
            nCategories: undefined,
        };

        const { datasets, labels } = structureData(subSpec);

        if (stacked) {
            // Max value is the per-category sum of positive dataset contributions
            const categoryTotals = new Map(labels.map((l) => [l, 0]));

            for (const ds of datasets) {
                for (const point of ds.data) {
                    // After swapPointAxes, horizontal data has value in .x, category in .y
                    const cat = horizontal ? point.y : point.x;
                    const val = horizontal ? point.x : point.y;
                    if (categoryTotals.has(String(cat))) {
                        const current = categoryTotals.get(String(cat));
                        categoryTotals.set(String(cat), current + Math.max(0, Number(val) || 0));
                    }
                }
            }

            for (const total of categoryTotals.values()) {
                if (total > globalMax) globalMax = total;
            }
        } else {
            // dodge / identity: max of individual values
            for (const ds of datasets) {
                for (const point of ds.data) {
                    const val = horizontal ? point.x : point.y;
                    const num = Number(val) || 0;
                    if (num > globalMax) globalMax = num;
                }
            }
        }
    }

    return { yMin: 0, yMax: globalMax };
}
