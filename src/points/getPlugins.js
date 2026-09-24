import { Chart } from 'chart.js';
import buildTooltip from './buildTooltip.js';

/**
 * Build the initial Chart.js plugin configuration for points.
 *
 * @param {Object} spec - Merged point chart specification.
 * @returns {Object} Chart.js plugin configuration.
 */
export default function getPlugins(spec) {
    const { title, caption } = spec.labels;
    const hasColor = !!spec.mapping.color;
    const hasShape = !!spec.mapping.shape;
    const getScaleLabel = (aesthetic) =>
        spec.scales[aesthetic].label !== undefined
            ? spec.scales[aesthetic].label
            : spec.mapping[aesthetic];
    const colorLabel = hasColor ? getScaleLabel('color') : undefined;
    const shapeLabel = hasShape ? getScaleLabel('shape') : undefined;
    const hasSharedLevel =
        hasColor && hasShape && spec.mapping.color === spec.mapping.shape;
    const getSharedLabel = () =>
        spec.scales.color.label !== undefined
            ? spec.scales.color.label
            : spec.scales.shape.label !== undefined
            ? spec.scales.shape.label
            : spec.mapping.color;
    const legendTitle =
        (hasSharedLevel
            ? getSharedLabel()
            : [colorLabel, shapeLabel].filter(Boolean).join(' / ')) || '';
    const legend = {
        display: hasColor || hasShape,
    };

    if (legend.display) {
        legend.title = {
            display: !!legendTitle,
            text: legendTitle,
        };
    }
    if (hasShape) {
        legend.labels = { usePointStyle: true };
    }

    if (hasColor && spec.mapping.opacity) {
        // Chart.js draws each swatch from the group's first point, so use the
        // group's base color instead of that point's opacity.
        legend.labels = {
            generateLabels: (chart) =>
                Chart.defaults.plugins.legend.labels
                    .generateLabels(chart)
                    .map((item) => {
                        const color =
                            chart.data.datasets[item.datasetIndex]._baseColor;

                        return color
                            ? { ...item, fillStyle: color, strokeStyle: color }
                            : item;
                    }),
        };
    }

    return {
        title: {
            display: !!title,
            text: title || '',
        },
        subtitle: {
            display: !!caption,
            position: 'bottom',
            align: 'start',
            text: caption || '',
        },
        legend,
        tooltip: buildTooltip(spec.tooltip),
    };
}
