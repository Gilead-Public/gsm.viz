/**
 * Build a bars spec for a single facet from the merged facetBars spec.
 *
 * Passes all shared spec keys (mapping, orientation, position, scales, labels,
 * annotations, tooltip, theme) through unchanged, and wraps user-provided
 * callbacks to forward the facet value as the second argument.
 *
 * When `scales.x.order` is a function it is called with `(facetValue, facetData)`
 * and its return value is used as the per-facet category order.
 *
 * @param {string} facetValue  - the current facet group value
 * @param {Object} mergedSpec  - merged facetBars spec (output of mergeSpec)
 * @param {Array}  [facetData] - data rows for this facet (required when scales.x.order is a function)
 * @returns {Object} a spec object suitable for passing to bars()
 */
export default function buildSubSpec(facetValue, mergedSpec, facetData = []) {
    const {
        mapping,
        orientation,
        position,
        nCategories,
        scales,
        labels,
        annotations,
        tooltip,
        theme,
        legend,
        callbacks,
    } = mergedSpec;

    // Resolve a function-based x order to a per-facet array.
    const xOrder =
        typeof scales?.x?.order === 'function'
            ? scales.x.order(facetValue, facetData)
            : scales?.x?.order;

    const resolvedScales =
        xOrder !== scales?.x?.order
            ? { ...scales, x: { ...scales?.x, order: xOrder } }
            : scales;

    return {
        mapping,
        orientation,
        position,
        stat: mergedSpec.stat,
        nCategories,
        scales: resolvedScales,
        labels,
        annotations,
        tooltip,
        theme,
        legend,
        selection: mergedSpec.selection,
        zoom: mergedSpec.zoom,
        callbacks: {
            onClick: callbacks.onClick
                ? (point, event) => callbacks.onClick(point, facetValue, event)
                : null,
            onHover: callbacks.onHover
                ? (point, event) => callbacks.onHover(point, facetValue, event)
                : null,
            onSelect: callbacks.onSelect ?? null,
        },
    };
}
