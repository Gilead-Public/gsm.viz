import validatePointsSpec from '../points/validateSpec.js';

const supportedFields = {
    facet: [
        'field',
        'order',
        'nCol',
        'chartHeight',
        'label',
        'scales',
        'legend',
    ],
    label: ['position', 'font'],
    scales: ['x', 'y'],
    axis: ['free'],
    legend: ['display', 'sync'],
};

function isPlainObject(value) {
    if (value === null || typeof value !== 'object' || Array.isArray(value)) {
        return false;
    }

    const prototype = Object.getPrototypeOf(value);
    return prototype === Object.prototype || prototype === null;
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

function isMissingValue(value) {
    return (
        value === undefined ||
        value === null ||
        value === '' ||
        (typeof value === 'string' && value.trim().length === 0) ||
        (typeof value === 'number' && Number.isNaN(value))
    );
}

function isFacetValue(value) {
    return (
        isMissingValue(value) ||
        typeof value === 'string' ||
        (typeof value === 'number' && Number.isFinite(value))
    );
}

function getOrderKey(value) {
    return value === null ? 'missing' : JSON.stringify([typeof value, value]);
}

function validateOrder(order) {
    if (order === undefined) return;
    if (!Array.isArray(order)) {
        throw new Error('spec.facet.order must be an array');
    }

    const seen = new Set();
    order.forEach((value, index) => {
        const valid =
            value === null ||
            (typeof value === 'string' && value.trim().length > 0) ||
            (typeof value === 'number' && Number.isFinite(value));
        if (!valid) {
            throw new Error(
                `spec.facet.order[${index}] must be a non-empty string, finite number, or null`
            );
        }

        const key = getOrderKey(value);
        if (seen.has(key)) {
            throw new Error('spec.facet.order must contain unique values');
        }
        seen.add(key);
    });
}

function validateLabel(label) {
    if (label === undefined) return;

    validatePlainObject(label, 'spec.facet.label');
    validateSupportedFields(label, supportedFields.label, 'spec.facet.label');

    if (
        label.position !== undefined &&
        !['top', 'bottom'].includes(label.position)
    ) {
        throw new Error("spec.facet.label.position must be 'top' or 'bottom'");
    }
    if (
        label.font !== undefined &&
        (typeof label.font !== 'string' || label.font.trim().length === 0)
    ) {
        throw new Error('spec.facet.label.font must be a non-empty string');
    }
}

function validateScales(scales) {
    if (scales === undefined) return;

    validatePlainObject(scales, 'spec.facet.scales');
    validateSupportedFields(
        scales,
        supportedFields.scales,
        'spec.facet.scales'
    );

    ['x', 'y'].forEach((axis) => {
        if (scales[axis] === undefined) return;

        const path = `spec.facet.scales.${axis}`;
        validatePlainObject(scales[axis], path);
        validateSupportedFields(scales[axis], supportedFields.axis, path);
        if (
            scales[axis].free !== undefined &&
            typeof scales[axis].free !== 'boolean'
        ) {
            throw new Error(`${path}.free must be a boolean`);
        }
    });
}

function validateLegend(legend) {
    if (legend === undefined) return;

    validatePlainObject(legend, 'spec.facet.legend');
    validateSupportedFields(
        legend,
        supportedFields.legend,
        'spec.facet.legend'
    );
    supportedFields.legend.forEach((field) => {
        if (legend[field] !== undefined && typeof legend[field] !== 'boolean') {
            throw new Error(`spec.facet.legend.${field} must be a boolean`);
        }
    });
}

function validateFacetData(data, field) {
    data.forEach((row, index) => {
        const value = row?.[field];
        if (!isFacetValue(value)) {
            throw new Error(
                `data[${index}].${field} mapped by spec.facet.field must be a string, finite number, or missing`
            );
        }
    });
}

/**
 * Validate points options plus the internal facet composition contract.
 *
 * @param {Array} data - Source rows.
 * @param {Object} spec - Faceted points specification.
 */
export default function validateSpec(data, spec) {
    if (!isPlainObject(spec)) {
        validatePointsSpec(data, spec);
        return;
    }

    const { facet, ...pointsSpec } = spec;
    validatePointsSpec(data, pointsSpec);

    if (facet === undefined) {
        throw new Error('spec.facet is required');
    }
    validatePlainObject(facet, 'spec.facet');
    validateSupportedFields(facet, supportedFields.facet, 'spec.facet');

    if (facet.field === undefined) {
        throw new Error('spec.facet.field is required');
    }
    if (typeof facet.field !== 'string' || facet.field.trim().length === 0) {
        throw new Error('spec.facet.field must be a non-empty string');
    }

    validateOrder(facet.order);

    if (
        facet.nCol !== undefined &&
        (!Number.isInteger(facet.nCol) || facet.nCol < 1)
    ) {
        throw new Error('spec.facet.nCol must be a positive integer');
    }
    if (
        facet.chartHeight !== undefined &&
        (!Number.isFinite(facet.chartHeight) || facet.chartHeight <= 0)
    ) {
        throw new Error(
            'spec.facet.chartHeight must be a positive finite number'
        );
    }

    validateLabel(facet.label);
    validateScales(facet.scales);
    validateLegend(facet.legend);
    validateFacetData(data, facet.field);
}
