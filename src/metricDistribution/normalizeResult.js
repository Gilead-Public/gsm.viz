export const RESULT_VALUES = ['Numerator', 'Denominator', 'Metric'];

const UNAVAILABLE = ['', 'NA'];

/**
 * Read one Reporting_Results value, which is published as a number or as text.
 *
 * @param {*} value - a Numerator, Denominator, or Metric value
 * @returns {(number|null)} null when unavailable; NaN when not a number
 */
export function parseResultValue(value) {
    if (value === null || value === undefined) return null;
    if (typeof value === 'number') return value;
    if (typeof value !== 'string') return NaN;
    const text = value.trim();
    return UNAVAILABLE.includes(text) ? null : Number(text);
}

/**
 * Copy a validated Reporting_Results row with its displayed values as numbers.
 *
 * @param {Object} [result] - the metric's Reporting_Results row
 * @returns {Object} the row with Numerator, Denominator, and Metric as a
 *  number or null
 */
export default function normalizeResult(result) {
    if (result === undefined || result === null) return result;
    const values = RESULT_VALUES.map((field) => [
        field,
        parseResultValue(result[field]),
    ]);
    return { ...result, ...Object.fromEntries(values) };
}
