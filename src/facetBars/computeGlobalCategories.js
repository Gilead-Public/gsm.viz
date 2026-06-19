/**
 * Compute the global (union) category list across all facets for
 * constant-domain rendering (facet.scales.x.free: false).
 *
 * Returns null when x.free is true — each facet should resolve its own
 * category domain independently.
 *
 * Behaviour by scales.x.order:
 *   - undefined : union of all facet data categories, sorted alphanumerically
 *   - Array     : the explicit array as-is (the global domain is fully specified)
 *   - Function  : called per facet; per-facet results are unioned in first-seen
 *                 order; any data categories not covered by any per-facet result
 *                 are appended alphanumerically
 *
 * @param {Map<string, Array>} facetDataMap - Map from facet value to data rows
 * @param {Object} spec - merged facetBars spec
 * @returns {Array|null} ordered array of global categories, or null
 */
export default function computeGlobalCategories(facetDataMap, spec) {
    const xFree = spec.facet?.scales?.x?.free ?? false;
    if (xFree) return null;

    const xOrder = spec.scales?.x?.order;
    const xKey = spec.mapping.x;

    // Explicit array — use as-is; it already represents the global domain.
    if (Array.isArray(xOrder)) {
        return xOrder;
    }

    // Function order — call per facet and union results in first-seen order.
    if (typeof xOrder === 'function') {
        const seen = new Set();
        const ordered = [];

        for (const [facetValue, facetData] of facetDataMap) {
            const perFacet = xOrder(facetValue, facetData);
            if (!Array.isArray(perFacet)) {
                throw new Error(
                    'spec.scales.x.order (function) must return an array of categories'
                );
            }
            for (const cat of perFacet) {
                const key = String(cat);
                if (!seen.has(key)) {
                    seen.add(key);
                    ordered.push(cat);
                }
            }
        }

        // Append any data categories not covered by any per-facet order result.
        const allDataCats = [];
        for (const facetData of facetDataMap.values()) {
            for (const row of facetData) {
                const cat = row[xKey];
                const key = String(cat);
                if (!seen.has(key)) {
                    seen.add(key);
                    allDataCats.push(cat);
                }
            }
        }
        allDataCats.sort((a, b) =>
            String(a).localeCompare(String(b), undefined, {
                sensitivity: 'base',
            })
        );

        return [...ordered, ...allDataCats];
    }

    // No order specified — union all data categories, sorted alphanumerically.
    const seen = new Set();
    for (const facetData of facetDataMap.values()) {
        for (const row of facetData) {
            seen.add(row[xKey]);
        }
    }

    return [...seen].sort((a, b) =>
        String(a).localeCompare(String(b), undefined, { sensitivity: 'base' })
    );
}
