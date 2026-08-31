import buildTooltip from './buildTooltip.js';
import getPointInteractionMode from './pointInteractionMode.js';
import pointLabels from './pointLabels.js';
import referenceLines from './referenceLines.js';

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
    const lineLayers = spec.annotations?.lines || [];
    const hasLines = lineLayers.length > 0;
    const hasLineLegend = lineLayers.some((line) => line.showInLegend);
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
        display: hasColor || hasShape || hasLineLegend,
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
    if (hasLines) {
        legend.labels = {
            ...legend.labels,
            filter: (item, data) => {
                const dataset = data.datasets[item.datasetIndex];
                return dataset?._annotation
                    ? dataset._showInLegend
                    : hasColor || hasShape;
            },
        };
    }

    const tooltip = buildTooltip(spec.tooltip);
    if (hasLines) {
        const userFilter = tooltip.filter;
        tooltip.mode = getPointInteractionMode(tooltip.mode || 'point');
        tooltip.filter = function (item, ...args) {
            return (
                !item.dataset?._annotation &&
                (!userFilter || userFilter.call(this, item, ...args))
            );
        };
    }
    const lines = referenceLines(spec);
    const labels = spec.annotations?.labels?.point;

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
        tooltip,
        ...(labels ? { datalabels: pointLabels(spec) } : {}),
        ...(lines
            ? {
                  annotation: {
                      annotations: lines,
                      clip: false,
                  },
              }
            : {}),
    };
}
