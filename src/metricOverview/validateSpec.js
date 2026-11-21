import { formatSpecifier } from 'd3';
import { resultsColumns } from './columns.js';

const supportedFields = {
    spec: [
        'groupId',
        'snapshotDate',
        'layout',
        'fields',
        'labels',
        'format',
        'unavailable',
    ],
    unavailable: ['value', 'empty'],
};

const layouts = ['list', 'header'];

function isPlainObject(value) {
    if (value === null || typeof value !== 'object' || Array.isArray(value)) {
        return false;
    }

    const prototype = Object.getPrototypeOf(value);
    return prototype === Object.prototype || prototype === null;
}

function isNonEmptyString(value) {
    return typeof value === 'string' && value.trim().length > 0;
}

function validatePlainObject(value, path) {
    if (!isPlainObject(value)) {
        throw new Error(`${path} must be a plain object`);
    }
}

function validateSupportedFields(value, fields, path) {
    const unsupported = Object.keys(value).find(
        (field) => !fields.includes(field)
    );

    if (unsupported !== undefined) {
        throw new Error(`${path}.${unsupported} is not supported`);
    }
}

function validateColumn(column, path) {
    if (!resultsColumns.includes(column)) {
        throw new Error(`${path} must be a Reporting_Results column`);
    }
}

function validateSelector(value, path) {
    if (value === undefined) return;

    if (
        !isNonEmptyString(value) &&
        !(typeof value === 'number' && Number.isFinite(value))
    ) {
        throw new Error(`${path} must be a non-empty string or a number`);
    }
}

function validateData(data) {
    if (!isPlainObject(data)) {
        throw new Error('data must be a plain object with results and metric');
    }

    if (!Array.isArray(data.results)) {
        throw new Error('data.results must be an array');
    }

    data.results.forEach((row, index) => {
        if (!isPlainObject(row)) {
            throw new Error(`data.results[${index}] must be a plain object`);
        }
    });

    if (!isPlainObject(data.metric)) {
        throw new Error('data.metric must be a plain object');
    }

    const metricIds = new Set(
        [data.metric, ...data.results]
            .map((row) => row.MetricID)
            .filter((id) => id !== undefined && id !== null && id !== '')
            .map(String)
    );

    if (metricIds.size > 1) {
        throw new Error(
            `data.results and data.metric must describe one metric; found ${[
                ...metricIds,
            ].join(', ')}`
        );
    }
}

function validateFields(fields) {
    if (fields === undefined) return;

    if (!Array.isArray(fields) || fields.length === 0) {
        throw new Error('spec.fields must be a non-empty array');
    }

    fields.forEach((field, index) =>
        validateColumn(field, `spec.fields[${index}]`)
    );

    if (new Set(fields).size !== fields.length) {
        throw new Error('spec.fields must not repeat a field');
    }
}

function validateLabels(labels) {
    if (labels === undefined) return;

    validatePlainObject(labels, 'spec.labels');
    Object.entries(labels).forEach(([column, label]) => {
        validateColumn(column, `spec.labels.${column}`);

        if (!isNonEmptyString(label)) {
            throw new Error(`spec.labels.${column} must be a non-empty string`);
        }
    });
}

function validateFormat(format) {
    if (format === undefined) return;

    validatePlainObject(format, 'spec.format');
    Object.entries(format).forEach(([column, specifier]) => {
        validateColumn(column, `spec.format.${column}`);

        try {
            if (typeof specifier !== 'string') throw new Error();
            formatSpecifier(specifier);
        } catch {
            throw new Error(
                `spec.format.${column} must be a d3-format specifier`
            );
        }
    });
}

function validateUnavailable(unavailable) {
    if (unavailable === undefined) return;

    validatePlainObject(unavailable, 'spec.unavailable');
    validateSupportedFields(
        unavailable,
        supportedFields.unavailable,
        'spec.unavailable'
    );
    Object.entries(unavailable).forEach(([state, text]) => {
        if (!isNonEmptyString(text)) {
            throw new Error(
                `spec.unavailable.${state} must be a non-empty string`
            );
        }
    });
}

/**
 * Validate the metricOverview data and spec objects.
 *
 * @param {Object} data - { results, metric }
 * @param {Object} spec - overview specification
 * @throws {Error} if data or spec is malformed
 */
export default function validateSpec(data, spec) {
    validateData(data);
    validatePlainObject(spec, 'spec');
    validateSupportedFields(spec, supportedFields.spec, 'spec');
    validateSelector(spec.groupId, 'spec.groupId');
    validateSelector(spec.snapshotDate, 'spec.snapshotDate');

    if (spec.layout !== undefined && !layouts.includes(spec.layout)) {
        throw new Error("spec.layout must be 'list' or 'header'");
    }

    validateFields(spec.fields);
    validateLabels(spec.labels);
    validateFormat(spec.format);
    validateUnavailable(spec.unavailable);
}
