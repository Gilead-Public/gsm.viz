const supportedFields = {
    spec: [
        'mapping',
        'scales',
        'labels',
        'annotations',
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
    annotations: ['referenceLines', 'lines', 'labels'],
    annotationLabels: ['point'],
    pointLabel: [
        'field',
        'display',
        'formatter',
        'offset',
        'align',
        'color',
        'font',
    ],
    pointLabelFont: ['family', 'size', 'style', 'weight', 'lineHeight'],
    referenceLine: [
        'axis',
        'value',
        'label',
        'color',
        'width',
        'dash',
        'labelPosition',
    ],
    annotationLine: [
        'data',
        'mapping',
        'order',
        'label',
        'color',
        'colors',
        'palette',
        'width',
        'dash',
        'tension',
        'stepped',
        'showInLegend',
    ],
    annotationLineMapping: ['x', 'y', 'group'],
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

function validateNonEmptyString(value, path) {
    if (typeof value !== 'string' || value.trim().length === 0) {
        throw new Error(`${path} must be a non-empty string`);
    }
}

function validateColor(value, path) {
    if (value !== undefined) {
        validateRequiredColor(value, path);
    }
}

function validateRequiredColor(value, path) {
    if (typeof value !== 'string' || value.trim().length === 0) {
        throw new Error(`${path} must be a non-empty string`);
    }
}

function validateDash(value, path) {
    if (
        value !== undefined &&
        (!Array.isArray(value) ||
            !value.every((segment) => Number.isFinite(segment) && segment >= 0))
    ) {
        throw new Error(`${path} must contain non-negative finite numbers`);
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

function validateReferenceLines(referenceLines, spec) {
    if (referenceLines === undefined) return;
    if (!Array.isArray(referenceLines)) {
        throw new Error('spec.annotations.referenceLines must be an array');
    }

    referenceLines.forEach((line, index) => {
        const path = `spec.annotations.referenceLines[${index}]`;
        validatePlainObject(line, path);
        validateSupportedFields(line, supportedFields.referenceLine, path);

        if (!['x', 'y'].includes(line.axis)) {
            throw new Error(`${path}.axis must be 'x' or 'y'`);
        }
        if (!Number.isFinite(line.value)) {
            throw new Error(`${path}.value must be a finite number`);
        }
        if (spec.scales?.[line.axis]?.type === 'log' && line.value <= 0) {
            throw new Error(
                `${path}.value must be greater than zero for a log scale`
            );
        }
        if (
            line.label !== undefined &&
            line.label !== null &&
            typeof line.label !== 'string'
        ) {
            throw new Error(`${path}.label must be a string or null`);
        }
        validateColor(line.color, `${path}.color`);
        if (
            line.width !== undefined &&
            (!Number.isFinite(line.width) || line.width <= 0)
        ) {
            throw new Error(`${path}.width must be a positive finite number`);
        }
        validateDash(line.dash, `${path}.dash`);
        if (
            line.labelPosition !== undefined &&
            !['start', 'center', 'end'].includes(line.labelPosition)
        ) {
            throw new Error(
                `${path}.labelPosition must be 'start', 'center', or 'end'`
            );
        }
    });
}

function validateAnnotationLine(line, index) {
    const path = `spec.annotations.lines[${index}]`;
    validatePlainObject(line, path);
    validateSupportedFields(line, supportedFields.annotationLine, path);

    if (!Array.isArray(line.data)) {
        throw new Error(`${path}.data must be an array`);
    }

    validatePlainObject(line.mapping, `${path}.mapping`);
    validateSupportedFields(
        line.mapping,
        supportedFields.annotationLineMapping,
        `${path}.mapping`
    );
    ['x', 'y'].forEach((axis) =>
        validateNonEmptyString(line.mapping[axis], `${path}.mapping.${axis}`)
    );
    if (line.mapping.group !== undefined) {
        validateNonEmptyString(line.mapping.group, `${path}.mapping.group`);
    }

    if (line.order !== undefined) {
        validateDiscreteOrder(line.order, `${path}.order`);
        if (line.mapping.group === undefined) {
            throw new Error(`${path}.order requires mapping.group`);
        }
    }
    if (
        line.label !== undefined &&
        line.label !== null &&
        typeof line.label !== 'string'
    ) {
        throw new Error(`${path}.label must be a string or null`);
    }
    validateColor(line.color, `${path}.color`);

    if (line.colors !== undefined) {
        validatePlainObject(line.colors, `${path}.colors`);
        Object.entries(line.colors).forEach(([level, color]) =>
            validateRequiredColor(color, `${path}.colors.${level}`)
        );
        if (line.mapping.group === undefined) {
            throw new Error(`${path}.colors requires mapping.group`);
        }
    }
    if (line.palette !== undefined) {
        if (!Array.isArray(line.palette) || line.palette.length === 0) {
            throw new Error(`${path}.palette must be a non-empty array`);
        }
        line.palette.forEach((color, colorIndex) =>
            validateRequiredColor(color, `${path}.palette[${colorIndex}]`)
        );
    }
    if (
        line.width !== undefined &&
        (!Number.isFinite(line.width) || line.width <= 0)
    ) {
        throw new Error(`${path}.width must be a positive finite number`);
    }
    validateDash(line.dash, `${path}.dash`);
    if (
        line.tension !== undefined &&
        (!Number.isFinite(line.tension) || line.tension < 0 || line.tension > 1)
    ) {
        throw new Error(
            `${path}.tension must be a finite number between 0 and 1`
        );
    }
    if (
        line.stepped !== undefined &&
        typeof line.stepped !== 'boolean' &&
        !['before', 'after', 'middle'].includes(line.stepped)
    ) {
        throw new Error(
            `${path}.stepped must be a boolean, 'before', 'after', or 'middle'`
        );
    }
    if (
        line.showInLegend !== undefined &&
        typeof line.showInLegend !== 'boolean'
    ) {
        throw new Error(`${path}.showInLegend must be a boolean`);
    }
    if (
        line.showInLegend === true &&
        line.mapping.group === undefined &&
        (typeof line.label !== 'string' || line.label.trim().length === 0)
    ) {
        throw new Error(
            `${path}.label must be a non-empty string when showInLegend is true without mapping.group`
        );
    }
}

function validatePointLabelFont(font, path) {
    if (font === undefined) return;
    validatePlainObject(font, path);
    validateSupportedFields(font, supportedFields.pointLabelFont, path);

    ['family', 'style'].forEach((field) => {
        if (font[field] !== undefined) {
            validateNonEmptyString(font[field], `${path}.${field}`);
        }
    });
    if (
        font.size !== undefined &&
        (!Number.isFinite(font.size) || font.size <= 0)
    ) {
        throw new Error(`${path}.size must be a positive finite number`);
    }
    if (
        font.weight !== undefined &&
        (typeof font.weight !== 'string' || font.weight.trim().length === 0) &&
        (typeof font.weight !== 'number' || !Number.isFinite(font.weight))
    ) {
        throw new Error(
            `${path}.weight must be a non-empty string or finite number`
        );
    }
    if (
        font.lineHeight !== undefined &&
        (typeof font.lineHeight !== 'string' ||
            font.lineHeight.trim().length === 0) &&
        (typeof font.lineHeight !== 'number' ||
            !Number.isFinite(font.lineHeight) ||
            font.lineHeight <= 0)
    ) {
        throw new Error(
            `${path}.lineHeight must be a positive finite number or non-empty string`
        );
    }
}

function validatePointLabels(labels, data) {
    if (labels === undefined) return;

    const labelsPath = 'spec.annotations.labels';
    validatePlainObject(labels, labelsPath);
    validateSupportedFields(
        labels,
        supportedFields.annotationLabels,
        labelsPath
    );

    const point = labels.point;
    if (point === undefined || point === null || point === false) return;

    const path = `${labelsPath}.point`;
    validatePlainObject(point, path);
    validateSupportedFields(point, supportedFields.pointLabel, path);
    validateNonEmptyString(point.field, `${path}.field`);

    if (
        point.display !== undefined &&
        typeof point.display !== 'boolean' &&
        typeof point.display !== 'function' &&
        (typeof point.display !== 'string' || point.display.trim().length === 0)
    ) {
        throw new Error(
            `${path}.display must be a boolean, non-empty string, or function`
        );
    }
    if (
        point.formatter !== undefined &&
        point.formatter !== null &&
        typeof point.formatter !== 'function'
    ) {
        throw new Error(`${path}.formatter must be a function or null`);
    }
    if (
        point.offset !== undefined &&
        (!Number.isFinite(point.offset) || point.offset < 0)
    ) {
        throw new Error(`${path}.offset must be a non-negative finite number`);
    }
    const alignments = [
        'center',
        'start',
        'end',
        'right',
        'bottom',
        'left',
        'top',
    ];
    if (point.align !== undefined && !alignments.includes(point.align)) {
        throw new Error(
            `${path}.align must be 'center', 'start', 'end', 'right', 'bottom', 'left', or 'top'`
        );
    }
    validateColor(point.color, `${path}.color`);
    validatePointLabelFont(point.font, `${path}.font`);

    data.forEach((row, index) => {
        const value = row?.[point.field];
        const valid =
            (typeof value === 'string' && value.trim().length > 0) ||
            (typeof value === 'number' && Number.isFinite(value));
        if (!valid) {
            throw new Error(
                `data[${index}].${point.field} mapped by ${path}.field must be a non-empty string or finite number`
            );
        }
    });
}

function validateAnnotations(annotations, spec) {
    if (annotations === undefined) return;

    validatePlainObject(annotations, 'spec.annotations');
    validateSupportedFields(
        annotations,
        supportedFields.annotations,
        'spec.annotations'
    );
    validateReferenceLines(annotations.referenceLines, spec);
    validatePointLabels(annotations.labels, spec.data ?? []);

    if (annotations.lines !== undefined) {
        if (!Array.isArray(annotations.lines)) {
            throw new Error('spec.annotations.lines must be an array');
        }
        annotations.lines.forEach(validateAnnotationLine);
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

    validateAnnotations(spec.annotations, { ...spec, data });

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
