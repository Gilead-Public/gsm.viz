function getAxisScale(scale, mapping) {
    const label = scale.label !== undefined ? scale.label : mapping;
    const axis = {
        type: scale.type === 'log' ? 'logarithmic' : scale.type,
        title: {
            display: !!label,
            text: label || '',
        },
    };

    if (scale.range !== undefined) {
        [axis.min, axis.max] = scale.range;
    } else if (scale.type === 'linear' && scale.beginAtZero) {
        axis.beginAtZero = true;
    }

    if (scale.breaks?.length) {
        const breaks = [...scale.breaks];
        const labels = new Map(
            breaks.map((value, index) => [value, scale.labels[index]])
        );

        axis.afterBuildTicks = (chartScale) => {
            chartScale.ticks = breaks.map((value) => ({ value }));
        };
        axis.ticks = {
            callback: (value) => labels.get(Number(value)) ?? null,
        };
    }

    return axis;
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
