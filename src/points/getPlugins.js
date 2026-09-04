/**
 * Build the initial Chart.js plugin configuration for points.
 *
 * @param {Object} spec - Merged point chart specification.
 * @returns {Object} Chart.js plugin configuration.
 */
export default function getPlugins(spec) {
    const { title, caption } = spec.labels;
    const hasColor = !!spec.mapping.color;
    const colorLabel = hasColor
        ? spec.scales.color.label !== undefined
            ? spec.scales.color.label
            : spec.mapping.color
        : undefined;
    const legend = {
        display: hasColor,
    };

    if (hasColor) {
        legend.title = {
            display: !!colorLabel,
            text: colorLabel || '',
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
import buildTooltip from './buildTooltip.js';
