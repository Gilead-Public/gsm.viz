const supportedFields = {
    spec: [
        'mapping',
        'scales',
        'labels',
        'tooltip',
        'callbacks',
        'selection',
        'theme',
    ],
    mapping: ['x', 'y', 'key', 'color', 'size', 'opacity', 'shape'],
    scales: ['x', 'y', 'color', 'size', 'opacity', 'shape'],
    scale: ['type', 'label', 'range', 'beginAtZero', 'breaks', 'labels'],
    colorScale: ['colors', 'palette', 'order', 'label'],
    continuousAestheticScale: ['range'],
    shapeScale: ['values', 'order', 'label'],
    labels: ['title', 'caption', 'description'],
    tooltip: [
        'format',
        'formatter',
        'enabled',
        'external',
        'position',
        'mode',
        'intersect',
        'itemSort',
        'filter',
        'backgroundColor',
        'titleColor',
        'titleFont',
        'titleAlign',
        'titleSpacing',
        'titleMarginBottom',
        'bodyColor',
        'bodyFont',
        'bodyAlign',
        'bodySpacing',
        'footerColor',
        'footerFont',
        'footerAlign',
        'footerSpacing',
        'footerMarginTop',
        'padding',
        'caretPadding',
        'caretSize',
        'cornerRadius',
        'multiKeyBackground',
        'displayColors',
        'boxWidth',
        'boxHeight',
        'boxPadding',
        'usePointStyle',
        'borderColor',
        'borderWidth',
        'rtl',
        'textDirection',
        'xAlign',
        'yAlign',
        'callbacks',
        'animation',
        'animations',
    ],
    tooltipCallbacks: [
        'beforeTitle',
        'title',
        'afterTitle',
        'beforeBody',
        'beforeLabel',
        'label',
        'labelColor',
        'labelTextColor',
        'labelPointStyle',
        'afterLabel',
        'afterBody',
        'beforeFooter',
        'footer',
        'afterFooter',
    ],
    callbacks: ['onClick', 'onHover', 'onSelect'],
    selection: ['enabled', 'opacity', 'multiple'],
    theme: ['maintainAspectRatio', 'animation'],
};

function isPlainObject(value) {
    if (value === null || typeof value !== 'object' || Array.isArray(value)) {
        return false;
    }

    const prototype = Object.getPrototypeOf(value);
    return prototype === Object.prototype || prototype === null;
}

function validateDiscreteOrder(order, path) {
    if (!Array.isArray(order)) {
        throw new Error(`${path} must be an array`);
    }

    const levels = new Set();
    order.forEach((level, index) => {
        if (
            level !== null &&
            (typeof level !== 'string' || level.trim().length === 0) &&
            (typeof level !== 'number' || !Number.isFinite(level))
        ) {
            throw new Error(
                `${path}[${index}] must be a string, finite number, or null`
            );
        }
        if (levels.has(level)) {
            throw new Error(`${path} must contain unique values`);
        }
        levels.add(level);
    });
}

function validateShapeScale(scale) {
    if (scale === undefined) return;

    const path = 'spec.scales.shape';
    validatePlainObject(scale, path);
    validateSupportedFields(scale, supportedFields.shapeScale, path);

    if (scale.values !== undefined) {
        validatePlainObject(scale.values, `${path}.values`);
        Object.entries(scale.values).forEach(([level, pointStyle]) => {
            if (!POINT_STYLES.includes(pointStyle)) {
                throw new Error(
                    `${path}.values.${level} must be a supported point style`
                );
            }
        });
    }

    if (scale.order !== undefined) {
        validateDiscreteOrder(scale.order, `${path}.order`);
    }

    if (
        scale.label !== undefined &&
        scale.label !== null &&
        typeof scale.label !== 'string'
    ) {
        throw new Error(`${path}.label must be a string or null`);
    }
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

function validateRequiredMapping(mapping, field) {
    const value = mapping[field];

    if (value === undefined) {
        throw new Error(`spec.mapping.${field} is required`);
    }

    if (typeof value !== 'string' || value.trim().length === 0) {
        throw new Error(`spec.mapping.${field} must be a non-empty string`);
    }
}

function validateOptionalString(value, path) {
    if (value !== undefined && typeof value !== 'string') {
        throw new Error(`${path} must be a string`);
    }
}

function validateScale(scale, axis) {
    if (scale === undefined) {
        return;
    }

    const path = `spec.scales.${axis}`;
    validatePlainObject(scale, path);
    validateSupportedFields(scale, supportedFields.scale, path);

    if (scale.type !== undefined && !['linear', 'log'].includes(scale.type)) {
        throw new Error(`${path}.type must be 'linear' or 'log'`);
    }

    validateOptionalString(scale.label, `${path}.label`);

    if (scale.range !== undefined) {
        if (
            !Array.isArray(scale.range) ||
            scale.range.length !== 2 ||
            !scale.range.every(Number.isFinite)
        ) {
            throw new Error(`${path}.range must contain two finite numbers`);
        }

        if (scale.range[0] >= scale.range[1]) {
            throw new Error(`${path}.range values must be strictly increasing`);
        }
    }

    if (
        scale.beginAtZero !== undefined &&
        typeof scale.beginAtZero !== 'boolean'
    ) {
        throw new Error(`${path}.beginAtZero must be a boolean`);
    }

    if (scale.breaks !== undefined && !Array.isArray(scale.breaks)) {
        throw new Error(`${path}.breaks must be an array`);
    }
    if (scale.labels !== undefined && !Array.isArray(scale.labels)) {
        throw new Error(`${path}.labels must be an array`);
    }

    const breaks = scale.breaks || [];
    const labels = scale.labels || [];

    breaks.forEach((value, index) => {
        if (!Number.isFinite(value)) {
            throw new Error(`${path}.breaks[${index}] must be a finite number`);
        }
        if (index > 0 && value <= breaks[index - 1]) {
            throw new Error(`${path}.breaks must be strictly increasing`);
        }
    });

    labels.forEach((value, index) => {
        if (
            typeof value !== 'string' &&
            (typeof value !== 'number' || !Number.isFinite(value))
        ) {
            throw new Error(
                `${path}.labels[${index}] must be a string or finite number`
            );
        }
    });

    if (breaks.length !== labels.length) {
        throw new Error(`${path}.breaks and labels must have the same length`);
    }

    if (scale.type === 'log') {
        if (scale.beginAtZero === true) {
            throw new Error(
                `${path}.beginAtZero cannot be true for a log scale`
            );
        }

        if (scale.range?.some((value) => value <= 0)) {
            throw new Error(
                `${path}.range values must be greater than zero for a log scale`
            );
        }

        const invalidBreak = breaks.findIndex((value) => value <= 0);
        if (invalidBreak !== -1) {
            throw new Error(
                `${path}.breaks[${invalidBreak}] must be greater than zero for a log scale`
            );
        }
    }
}

function validateColorScale(scale) {
    if (scale === undefined) {
        return;
    }

    const path = 'spec.scales.color';
    validatePlainObject(scale, path);
    validateSupportedFields(scale, supportedFields.colorScale, path);

    if (scale.colors !== undefined) {
        validatePlainObject(scale.colors, `${path}.colors`);
        Object.entries(scale.colors).forEach(([level, color]) => {
            if (typeof color !== 'string' || color.trim().length === 0) {
                throw new Error(
                    `${path}.colors.${level} must be a non-empty string`
                );
            }
        });
    }

    if (scale.palette !== undefined) {
        if (!Array.isArray(scale.palette) || scale.palette.length === 0) {
            throw new Error(`${path}.palette must be a non-empty array`);
        }

        scale.palette.forEach((color, index) => {
            if (typeof color !== 'string' || color.trim().length === 0) {
                throw new Error(
                    `${path}.palette[${index}] must be a non-empty string`
                );
            }
        });
    }

    if (scale.order !== undefined) {
        validateDiscreteOrder(scale.order, `${path}.order`);
    }

    if (
        scale.label !== undefined &&
        scale.label !== null &&
        typeof scale.label !== 'string'
    ) {
        throw new Error(`${path}.label must be a string or null`);
    }
}

function validateContinuousAestheticScale(scale, aesthetic) {
    if (scale === undefined) return;

    const path = `spec.scales.${aesthetic}`;
    validatePlainObject(scale, path);
    validateSupportedFields(
        scale,
        supportedFields.continuousAestheticScale,
        path
    );

    if (
        !Array.isArray(scale.range) ||
        scale.range.length !== 2 ||
        !scale.range.every(Number.isFinite)
    ) {
        throw new Error(`${path}.range must contain two finite numbers`);
    }

    if (aesthetic === 'size' && scale.range.some((value) => value <= 0)) {
        throw new Error(`${path}.range values must be greater than zero`);
    }

    if (
        aesthetic === 'opacity' &&
        scale.range.some((value) => value < 0 || value > 1)
    ) {
        throw new Error(`${path}.range values must be between 0 and 1`);
    }

    if (scale.range[0] >= scale.range[1]) {
        throw new Error(`${path}.range values must be strictly increasing`);
    }
}

function validateCallbacks(callbacks) {
    if (callbacks === undefined) {
        return;
    }

    validatePlainObject(callbacks, 'spec.callbacks');
    validateSupportedFields(
        callbacks,
        supportedFields.callbacks,
        'spec.callbacks'
    );

    supportedFields.callbacks.forEach((field) => {
        const callback = callbacks[field];

        if (
            callback !== undefined &&
            callback !== null &&
            typeof callback !== 'function'
        ) {
            throw new Error(
                `spec.callbacks.${field} must be a function or null`
            );
        }
    });
}

function validateSelection(selection) {
    if (selection === undefined) {
        return;
    }

    validatePlainObject(selection, 'spec.selection');
    validateSupportedFields(
        selection,
        supportedFields.selection,
        'spec.selection'
    );

    ['enabled', 'multiple'].forEach((field) => {
        if (
            selection[field] !== undefined &&
            typeof selection[field] !== 'boolean'
        ) {
            throw new Error(`spec.selection.${field} must be a boolean`);
        }
    });

    if (
        selection.opacity !== undefined &&
        (!Number.isFinite(selection.opacity) ||
            selection.opacity < 0 ||
            selection.opacity > 1)
    ) {
        throw new Error(
            'spec.selection.opacity must be a finite number between 0 and 1'
        );
    }
}

function validateTheme(theme) {
    if (theme === undefined) {
        return;
    }

    validatePlainObject(theme, 'spec.theme');
    validateSupportedFields(theme, supportedFields.theme, 'spec.theme');

    supportedFields.theme.forEach((field) => {
        if (theme[field] !== undefined && typeof theme[field] !== 'boolean') {
            throw new Error(`spec.theme.${field} must be a boolean`);
        }
    });
}

/**
 * Validate data and the implemented portion of the generic points spec.
 *
 * @param {Array} data - Source rows.
 * @param {Object} spec - Point chart specification.
 * @throws {Error} If a required field is missing or an accepted field is invalid.
 */
export default function validateSpec(data, spec) {
    if (data === undefined || data === null) {
        throw new Error('data is required');
    }

    if (!Array.isArray(data)) {
        throw new Error('data must be an array');
    }

    if (spec === undefined || spec === null) {
        throw new Error('spec is required');
    }

    validatePlainObject(spec, 'spec');
    validateSupportedFields(spec, supportedFields.spec, 'spec');

    if (spec.mapping === undefined || spec.mapping === null) {
        throw new Error('spec.mapping is required');
    }

    validatePlainObject(spec.mapping, 'spec.mapping');
    validateSupportedFields(
        spec.mapping,
        supportedFields.mapping,
        'spec.mapping'
    );
    validateRequiredMapping(spec.mapping, 'x');
    validateRequiredMapping(spec.mapping, 'y');

    if (spec.mapping.key !== undefined) {
        if (
            typeof spec.mapping.key !== 'string' ||
            spec.mapping.key.trim().length === 0
        ) {
            throw new Error('spec.mapping.key must be a non-empty string');
        }
    }

    if (spec.mapping.color !== undefined) {
        if (
            typeof spec.mapping.color !== 'string' ||
            spec.mapping.color.trim().length === 0
        ) {
            throw new Error('spec.mapping.color must be a non-empty string');
        }
    }

    ['size', 'opacity', 'shape'].forEach((aesthetic) => {
        if (
            spec.mapping[aesthetic] !== undefined &&
            (typeof spec.mapping[aesthetic] !== 'string' ||
                spec.mapping[aesthetic].trim().length === 0)
        ) {
            throw new Error(
                `spec.mapping.${aesthetic} must be a non-empty string`
            );
        }
    });

    if (spec.scales !== undefined) {
        validatePlainObject(spec.scales, 'spec.scales');
        validateSupportedFields(
            spec.scales,
            supportedFields.scales,
            'spec.scales'
        );
        validateScale(spec.scales.x, 'x');
        validateScale(spec.scales.y, 'y');
        validateColorScale(spec.scales.color);
        validateContinuousAestheticScale(spec.scales.size, 'size');
        validateContinuousAestheticScale(spec.scales.opacity, 'opacity');
        validateShapeScale(spec.scales.shape);
    }

    if (spec.labels !== undefined) {
        validatePlainObject(spec.labels, 'spec.labels');
        validateSupportedFields(
            spec.labels,
            supportedFields.labels,
            'spec.labels'
        );

        supportedFields.labels.forEach((field) => {
            validateOptionalString(spec.labels[field], `spec.labels.${field}`);
        });
    }

    if (spec.tooltip !== undefined) {
        validatePlainObject(spec.tooltip, 'spec.tooltip');
        validateSupportedFields(
            spec.tooltip,
            supportedFields.tooltip,
            'spec.tooltip'
        );
        validateOptionalString(spec.tooltip.format, 'spec.tooltip.format');
        if (spec.tooltip.format) {
            validateTooltipFormat(spec.tooltip.format, data, spec.mapping);
        }

        if (
            spec.tooltip.formatter !== undefined &&
            spec.tooltip.formatter !== null &&
            typeof spec.tooltip.formatter !== 'function'
        ) {
            throw new Error(
                'spec.tooltip.formatter must be a function or null'
            );
        }

        if (spec.tooltip.callbacks !== undefined) {
            validatePlainObject(
                spec.tooltip.callbacks,
                'spec.tooltip.callbacks'
            );
            validateSupportedFields(
                spec.tooltip.callbacks,
                supportedFields.tooltipCallbacks,
                'spec.tooltip.callbacks'
            );

            Object.entries(spec.tooltip.callbacks).forEach(
                ([field, callback]) => {
                    if (
                        callback !== undefined &&
                        callback !== null &&
                        typeof callback !== 'function'
                    ) {
                        throw new Error(
                            `spec.tooltip.callbacks.${field} must be a function or null`
                        );
                    }
                }
            );
        }
    }

    validateCallbacks(spec.callbacks);
    validateSelection(spec.selection);
    validateTheme(spec.theme);
}
import { validateTooltipFormat } from './tooltipFormat.js';
import { POINT_STYLES } from './pointStyles.js';
