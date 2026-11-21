import { format } from 'd3';
import { columnTitle } from './columns.js';

// Reporting_Metrics columns that name the same-named Reporting_Results column.
const metricLabelColumns = ['Metric', 'Numerator', 'Denominator', 'Score'];

const isBlank = (value) => typeof value === 'string' && value.trim() === '';

function resolveLabel(field, metric, spec) {
    if (spec.labels[field] !== undefined) return spec.labels[field];

    const label = metric[field];
    const named =
        metricLabelColumns.includes(field) &&
        typeof label === 'string' &&
        !isBlank(label) &&
        label !== 'NA';

    return named ? label : columnTitle(field);
}

function toNumber(value) {
    if (typeof value === 'number') return value;
    if (typeof value === 'string' && !isBlank(value)) return Number(value);
    return NaN;
}

function formatValue(value, specifier) {
    if (specifier !== undefined) {
        const number = toNumber(value);
        return Number.isFinite(number) ? format(specifier)(number) : null;
    }

    if (typeof value === 'number') {
        return Number.isFinite(value) ? String(value) : null;
    }

    return typeof value === 'string' && !isBlank(value) ? value : null;
}

/**
 * Label and display text for one Reporting_Results column of a row. Values
 * are formatted, never recalculated.
 *
 * @param {string} field - Reporting_Results column
 * @param {Object} row - the results row
 * @param {Object} metric - the metric's Reporting_Metrics row
 * @param {Object} spec - merged spec
 * @returns {{ field: string, label: string, text: string, available: boolean }}
 */
export default function describeField(field, row, metric, spec) {
    const text = formatValue(row[field], spec.format[field]);

    return {
        field,
        label: resolveLabel(field, metric, spec),
        text: text ?? spec.unavailable.value,
        available: text !== null,
    };
}
