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
    const stacked = position === 'stack' || position === 'fill';
    const percent = spec.stat === 'percent' || position === 'fill';

    const xLabel =
        specScales.x.label !== undefined ? specScales.x.label : mapping?.x;
    const yLabel =
        specScales.y.label !== undefined ? specScales.y.label : mapping?.y;

    const percentageTicks = { callback: (v) => `${v}%` };

    const categoryScale = {
        type: specScales.x.type,
        grid: { display: !!specScales.x.grid },
        title: {
            display: !!xLabel,
            text: xLabel,
        },
        ...(spec.theme?.dynamicSizing ? { ticks: { autoSkip: false } } : {}),
        ...(stacked ? { stacked: true } : {}),
    };

    const valueScale = {
        type: specScales.y.type,
        title: {
            display: !!yLabel,
            text: yLabel,
        },
        ...(specScales.y.min !== undefined
            ? { min: specScales.y.min }
            : { beginAtZero: true }),
        ...(specScales.y.max !== undefined ? { max: specScales.y.max } : {}),
        ...(stacked ? { stacked: true } : {}),
        ...(percent ? { max: 100, ticks: percentageTicks } : {}),
    };

    return {
        x: horizontal ? valueScale : categoryScale,
        y: horizontal ? categoryScale : valueScale,
        _indexAxis: horizontal ? 'y' : 'x',
    };
}
