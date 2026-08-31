import { formatTooltipPoint } from './tooltipFormat.js';

function getPoint(context) {
    return context.raw ?? context.dataset?.data?.[context.dataIndex];
}

function getDetails(point) {
    return {
        x: point.x,
        y: point.y,
        color: point._color,
        key: point._key,
        datum: point._datum,
    };
}

/**
 * Build Chart.js tooltip options from the points tooltip namespace.
 *
 * @param {Object} tooltip - Merged tooltip specification.
 * @returns {Object} Chart.js tooltip configuration.
 */
export default function buildTooltip(tooltip = {}) {
    const { format, formatter, callbacks, ...chartJsOptions } = tooltip;
    const config = {
        ...chartJsOptions,
        ...(callbacks ? { callbacks: { ...callbacks } } : {}),
    };

    if (config.callbacks?.label) return config;

    if (typeof formatter === 'function') {
        return {
            ...config,
            callbacks: {
                ...config.callbacks,
                label: (context) => {
                    const point = getPoint(context);
                    return formatter(point, context, getDetails(point));
                },
            },
        };
    }

    if (format) {
        return {
            ...config,
            callbacks: {
                ...config.callbacks,
                label: (context) =>
                    formatTooltipPoint(format, getPoint(context)),
            },
        };
    }

    return config;
}
