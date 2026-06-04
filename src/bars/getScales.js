/**
 * Build Chart.js scales configuration from the merged spec.
 *
 * In vertical orientation, the user's x mapping → Chart.js x axis (category),
 * and the user's y mapping → Chart.js y axis (value).
 *
 * In horizontal orientation (coord_flip), axes are swapped:
 * user's x mapping → Chart.js y axis, user's y mapping → Chart.js x axis.
 *
 * Axis labels default to the mapping variable name when not explicitly set.
 * Set a label to null or '' to disable it.
 *
 * @param {Object} spec - merged spec
 * @returns {Object} Chart.js scales config plus _indexAxis
 */
export default function getScales(spec) {
    const { orientation, position, scales: specScales, mapping } = spec;
    const horizontal = orientation === 'horizontal';
    const stacked = position === 'stack';

    const xLabel =
        specScales.x.label !== undefined ? specScales.x.label : mapping?.x;
    const yLabel =
        specScales.y.label !== undefined ? specScales.y.label : mapping?.y;

    const categoryScale = {
        type: specScales.x.type,
        title: {
            display: !!xLabel,
            text: xLabel,
        },
        ...(stacked ? { stacked: true } : {}),
    };

    const valueScale = {
        type: specScales.y.type,
        title: {
            display: !!yLabel,
            text: yLabel,
        },
        beginAtZero: true,
        ...(stacked ? { stacked: true } : {}),
    };

    return {
        x: horizontal ? valueScale : categoryScale,
        y: horizontal ? categoryScale : valueScale,
        _indexAxis: horizontal ? 'y' : 'x',
    };
}
