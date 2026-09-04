function getAxisScale(scale, mapping) {
    const label = scale.label !== undefined ? scale.label : mapping;

    return {
        type: scale.type,
        title: {
            display: !!label,
            text: label || '',
        },
    };
}

/**
 * Build Chart.js scales for a merged points spec.
 *
 * @param {Object} spec - Merged point chart specification.
 * @returns {Object} Chart.js x/y scale configuration.
 */
export default function getScales(spec) {
    return {
        x: getAxisScale(spec.scales.x, spec.mapping.x),
        y: getAxisScale(spec.scales.y, spec.mapping.y),
    };
}
