import getFacetLines from './facetLines.js';

function getScale(scale) {
    return {
        ...scale,
        ...(scale.range ? { range: [...scale.range] } : {}),
        ...(scale.breaks ? { breaks: [...scale.breaks] } : {}),
        ...(scale.labels ? { labels: [...scale.labels] } : {}),
        ...(scale.order ? { order: [...scale.order] } : {}),
        ...(scale.palette ? { palette: [...scale.palette] } : {}),
        ...(scale.colors ? { colors: { ...scale.colors } } : {}),
        ...(scale.values ? { values: { ...scale.values } } : {}),
    };
}

function wrapCallback(callback, facetValue) {
    return callback
        ? (value, event) => callback(value, facetValue, event)
        : null;
}

function getAnnotations(annotations, facetField, facetValue) {
    return {
        ...annotations,
        lines: getFacetLines(annotations.lines, facetField, facetValue),
    };
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

    return {
        ...pointsSpec,
        annotations: getAnnotations(
            pointsSpec.annotations,
            facet.field,
            facetValue
        ),
        scales,
        callbacks: {
            onClick: wrapCallback(callbacks.onClick, facetValue),
            onHover: wrapCallback(callbacks.onHover, facetValue),
            onSelect: wrapCallback(callbacks.onSelect, facetValue),
        },
    };
}
