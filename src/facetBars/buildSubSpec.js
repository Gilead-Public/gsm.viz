/**
 * Build a bars spec for a single facet from the merged facetBars spec.
 *
 * Passes all shared spec keys (mapping, orientation, position, scales, labels,
 * annotations, tooltip, theme) through unchanged, and wraps user-provided
 * callbacks to forward the facet value as the second argument.
 *
 * @param {string} facetValue  - the current facet group value
 * @param {Object} mergedSpec  - merged facetBars spec (output of mergeSpec)
 * @returns {Object} a spec object suitable for passing to bars()
 */
export default function buildSubSpec(facetValue, mergedSpec) {
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
        callbacks,
    } = mergedSpec;

    return {
        mapping,
        orientation,
        position,
        nCategories,
        scales,
        labels,
        annotations,
        tooltip,
        theme,
        callbacks: {
            onClick: callbacks.onClick
                ? (point, event) => callbacks.onClick(point, facetValue, event)
                : null,
            onHover: callbacks.onHover
                ? (point, event) => callbacks.onHover(point, facetValue, event)
                : null,
        },
    };
}
