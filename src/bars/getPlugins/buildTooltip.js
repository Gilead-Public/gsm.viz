import fillLabelCallback from './fillLabelCallback.js';

/**
 * Build the Chart.js tooltip plugin configuration.
 *
 * For fill-positioned bars, injects a default percentage label callback unless
 * the caller supplied a custom tooltip label callback.
 *
 * @param {Object} tooltip - user-specified tooltip plugin options
 * @param {string} position - bar positioning mode
 * @returns {Object} tooltip plugin options
 */
export default function buildTooltip(tooltip, position) {
    const base = { enabled: true, ...tooltip };

    if (position !== 'fill') return base;
    if (base.callbacks?.label) return base;

    return {
        ...base,
        callbacks: {
            ...base.callbacks,
            label: fillLabelCallback,
        },
    };
}
