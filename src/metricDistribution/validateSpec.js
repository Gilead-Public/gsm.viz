import isPlainObject from './isPlainObject.js';
import { VALUES } from './defaults.js';

const supportedFields = {
    spec: ['sections', 'values', 'labels', 'topN', 'colors', 'theme', 'header'],
    header: ['labels', 'format', 'unavailable'],
    section: [
        'source',
        'variable',
        'title',
        'status',
        'topN',
        'values',
        'labels',
    ],
    theme: ['barColor', 'neutralColor'],
};

function validatePlainObject(value, path, fields) {
    if (!isPlainObject(value)) {
        throw new Error(`${path} must be a plain object`);
    }
    if (fields) {
        const unsupported = Object.keys(value).find(
            (key) => !fields.includes(key)
        );
        if (unsupported !== undefined) {
            throw new Error(`${path}.${unsupported} is not supported`);
        }
    }
}

function validateStrings(object, path) {
    Object.entries(object).forEach(([key, value]) => {
        if (typeof value !== 'string') {
            throw new Error(`${path}.${key} must be a string`);
        }
    });
}

function validateTopN(topN, path) {
    if (topN !== undefined && !(Number.isInteger(topN) && topN > 0)) {
        throw new Error(`${path} must be a positive integer`);
    }
}

function validateValues(values, path) {
    if (values === undefined) return;
    if (
        !Array.isArray(values) ||
        values.length === 0 ||
        !values.every((value) => VALUES.includes(value))
    ) {
        throw new Error(
            `${path} must be a non-empty array of 'count', 'percent', or 'percentOfDenominator'`
        );
    }
    if (new Set(values).size !== values.length) {
        throw new Error(`${path} must contain unique values`);
    }
}

function validateLabels(labels, path) {
    if (labels === undefined) return;
    validatePlainObject(labels, path, VALUES);
    validateStrings(labels, path);
}

function validateSection(section, path) {
    validatePlainObject(section, path, supportedFields.section);
    ['source', 'variable'].forEach((field) => {
        if (typeof section[field] !== 'string' || section[field] === '') {
            throw new Error(`${path}.${field} must be a non-empty string`);
        }
    });
    if (section.title !== undefined && typeof section.title !== 'string') {
        throw new Error(`${path}.title must be a string`);
    }
    if (section.status !== undefined && typeof section.status !== 'boolean') {
        throw new Error(`${path}.status must be a boolean`);
    }
    validateTopN(section.topN, `${path}.topN`);
    validateValues(section.values, `${path}.values`);
    validateLabels(section.labels, `${path}.labels`);
}

function validateSections(sections) {
    if (sections === undefined) return;
    if (!Array.isArray(sections)) {
        throw new Error('spec.sections must be an array');
    }
    const seen = new Set();
    sections.forEach((section, i) => {
        validateSection(section, `spec.sections[${i}]`);
        const key = `${section.source} / ${section.variable}`;
        if (seen.has(key)) {
            throw new Error(`spec.sections lists ${key} more than once`);
        }
        seen.add(key);
    });
}

/**
 * Validate the metricDistribution spec. The contents of spec.header are
 * validated by the metric overview when the header is built.
 *
 * @param {Object} [spec] - widget specification
 * @throws {Error} if an option is unsupported or has the wrong type
 */
export default function validateSpec(spec) {
    if (spec === undefined) return;
    validatePlainObject(spec, 'spec', supportedFields.spec);
    validateSections(spec.sections);
    validateValues(spec.values, 'spec.values');
    validateLabels(spec.labels, 'spec.labels');
    validateTopN(spec.topN, 'spec.topN');
    if (spec.colors !== undefined) {
        validatePlainObject(spec.colors, 'spec.colors');
        validateStrings(spec.colors, 'spec.colors');
    }
    if (spec.header !== undefined) {
        validatePlainObject(spec.header, 'spec.header', supportedFields.header);
    }
    if (spec.theme !== undefined) {
        validatePlainObject(spec.theme, 'spec.theme', supportedFields.theme);
        validateStrings(spec.theme, 'spec.theme');
    }
}
