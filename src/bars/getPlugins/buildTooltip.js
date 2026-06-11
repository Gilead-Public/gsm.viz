import fillLabelCallback from './fillLabelCallback.js';
import {
    buildFormatCallback,
    buildFormatterCallback,
} from './formatTooltipLabel.js';

/**
 * Build the Chart.js tooltip plugin configuration.
 *
 * Precedence for the `label` callback:
 *   1. `tooltip.callbacks.label`  — caller-supplied; used as-is
 *   2. `tooltip.formatter`        — custom callback with enriched details
 *   3. `tooltip.format`           — built-in shorthand ('count' | 'percent' |
 *                                   'count+percent' | 'percent+count')
 *   4. `position: 'fill'` default — percentage callback when none of the above
 *   5. Chart.js default
 *
 * `format` and `formatter` are gsm.viz-specific options and are stripped from
 * the object forwarded to Chart.js.
 *
 * @param {Object} tooltip - user-specified tooltip plugin options
 * @param {string} position - bar positioning mode
 * @returns {Object} tooltip plugin options
 */
export default function buildTooltip(tooltip, position) {
    const { format, formatter, ...rest } = tooltip || {};
    const base = { enabled: true, ...rest };

    // 1. Caller-supplied callbacks.label always wins.
    if (base.callbacks?.label) return base;

    // 2. formatter takes priority over format.
    if (typeof formatter === 'function') {
        return {
            ...base,
            callbacks: {
                ...base.callbacks,
                label: buildFormatterCallback(formatter),
            },
        };
    }

    // 3. format shorthand.
    if (format) {
        return {
            ...base,
            callbacks: {
                ...base.callbacks,
                label: buildFormatCallback(format),
            },
        };
    }

    // 4. fill-position default.
    if (position !== 'fill') return base;

    return {
        ...base,
        callbacks: {
            ...base.callbacks,
            label: fillLabelCallback,
        },
    };
}
