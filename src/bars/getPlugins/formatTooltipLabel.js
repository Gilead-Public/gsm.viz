/**
 * Build a Chart.js tooltip `label` callback driven by a `format` string or a
 * custom `formatter` function.
 *
 * Supports the same value-resolution helpers used by dataLabels.js so that
 * tooltip counts and percentages are consistent with on-bar labels.
 */

function getValueKey(context) {
    return context.chart?.options?.indexAxis === 'y' ? 'x' : 'y';
}

function getCategoryKey(context) {
    return context.chart?.options?.indexAxis === 'y' ? 'y' : 'x';
}

function getPoint(context) {
    return context.dataset.data[context.dataIndex];
}

function getRawValue(point, context) {
    if (point?._rawY !== undefined) return Number(point._rawY) || 0;
    const val = point?.[getValueKey(context)];
    return Number(val) || 0;
}

function getCategory(point, context) {
    return point?.[getCategoryKey(context)];
}

function getRawTotal(context) {
    const point = getPoint(context);
    const category = getCategory(point, context);

    return context.chart.data.datasets.reduce((total, dataset) => {
        const match = dataset.data.find(
            (p) => getCategory(p, context) === category
        );
        return total + getRawValue(match, context);
    }, 0);
}

function buildPrefix(context) {
    return context.dataset.label ? `${context.dataset.label}: ` : '';
}

/**
 * Build a Chart.js tooltip `label` callback from a `format` string.
 *
 * @param {string} format - 'count' | 'percent' | 'count+percent' | 'percent+count'
 * @returns {Function} Chart.js tooltip label callback
 */
export function buildFormatCallback(format) {
    return function formatLabelCallback(context) {
        const point = getPoint(context);
        const count = getRawValue(point, context);
        const total = getRawTotal(context);
        const percent = total === 0 ? 0 : (count / total) * 100;
        const prefix = buildPrefix(context);

        switch (format) {
            case 'count':
                return `${prefix}${count}`;
            case 'percent':
                return `${prefix}${percent.toFixed(1)}%`;
            case 'percent+count':
                return `${prefix}${percent.toFixed(1)}% (${count})`;
            case 'count+percent':
            default:
                return `${prefix}${count} (${percent.toFixed(1)}%)`;
        }
    };
}

/**
 * Build a Chart.js tooltip `label` callback from a user-supplied `formatter`
 * function. The formatter receives `(count, context, details)` where `details`
 * includes `{ percent, total, fill, datum }`.
 *
 * @param {Function} formatter - (count, context, details) => string
 * @returns {Function} Chart.js tooltip label callback
 */
export function buildFormatterCallback(formatter) {
    return function formatterLabelCallback(context) {
        const point = getPoint(context);
        const count = getRawValue(point, context);
        const total = getRawTotal(context);
        const percent = total === 0 ? 0 : (count / total) * 100;
        const fill = point?._fill;
        const datum = point?._datum;

        return formatter(count, context, { percent, total, fill, datum });
    };
}
