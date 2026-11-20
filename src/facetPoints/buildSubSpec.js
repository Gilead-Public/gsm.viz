function getScale(scale) {
    return {
        ...scale,
        ...(scale.range ? { range: [...scale.range] } : {}),
        ...(scale.domain ? { domain: [...scale.domain] } : {}),
        ...(scale.breaks ? { breaks: [...scale.breaks] } : {}),
        ...(scale.labels ? { labels: [...scale.labels] } : {}),
        ...(scale.order ? { order: [...scale.order] } : {}),
        ...(scale.palette ? { palette: [...scale.palette] } : {}),
        ...(scale.colors ? { colors: { ...scale.colors } } : {}),
        ...(scale.values ? { values: { ...scale.values } } : {}),
    };
}

const wrappedCallbacks = new WeakSet();

export function wrapCallback(callback, facetValue) {
    if (!callback) return null;
    // Re-wrapping would insert the facet value twice.
    if (wrappedCallbacks.has(callback)) return callback;

    const wrapped = (value, event) => callback(value, facetValue, event);
    wrappedCallbacks.add(wrapped);
    return wrapped;
}

/**
 * Build one complete points spec from merged facet state.
 *
 * @param {*} facetValue - Typed facet identity.
 * @param {Object} mergedSpec - Complete facet points spec.
 * @param {Object} globalScales - Fixed shared bounds.
 * @param {Object} globalStyles - Resolved global aesthetic orders.
 * @returns {Object} Public points spec for one child chart.
 */
export default function buildSubSpec(
    facetValue,
    mergedSpec,
    globalScales,
    globalStyles
) {
    const { data, facet, callbacks, ...pointsSpec } = mergedSpec;
    const scales = Object.fromEntries(
        Object.entries(mergedSpec.scales).map(([name, scale]) => [
            name,
            getScale(scale),
        ])
    );

    if (globalScales.xMin !== undefined) {
        scales.x.range = [globalScales.xMin, globalScales.xMax];
    }
    if (globalScales.yMin !== undefined) {
        scales.y.range = [globalScales.yMin, globalScales.yMax];
    }
    scales.color.order = [...globalStyles.colorOrder];
    scales.shape.order = [...globalStyles.shapeOrder];
    // An explicit points domain stays authoritative over the shared one.
    if (globalStyles.sizeDomain && !scales.size.domain) {
        scales.size.domain = [...globalStyles.sizeDomain];
    }
    if (globalStyles.opacityDomain && !scales.opacity.domain) {
        scales.opacity.domain = [...globalStyles.opacityDomain];
    }

    return {
        ...pointsSpec,
        scales,
        callbacks: {
            onClick: wrapCallback(callbacks.onClick, facetValue),
            onHover: wrapCallback(callbacks.onHover, facetValue),
            onSelect: wrapCallback(callbacks.onSelect, facetValue),
        },
    };
}
