const isPlainObject = (value) =>
    value !== null && typeof value === 'object' && !Array.isArray(value);

function fail(message) {
    throw new Error(`tiles: ${message}`);
}

function checkFields(rows, fields, name) {
    rows.forEach((row, i) => {
        if (!isPlainObject(row)) fail(`${name}[${i}] must be an object`);
        fields.forEach((field) => {
            if (row[field] === undefined) {
                fail(`${name}[${i}] is missing field "${field}"`);
            }
        });
    });
}

function checkOrder(order, name) {
    if (order !== undefined && order !== null && !Array.isArray(order)) {
        fail(`${name} must be an array`);
    }
}

function checkColors(colors, name) {
    if (colors !== undefined && !isPlainObject(colors)) {
        fail(`${name} must be an object`);
    }
}

function checkTooltip(tooltip, name) {
    if (tooltip === undefined || tooltip === null) return;
    if (!isPlainObject(tooltip)) fail(`${name} must be an object`);
    if (tooltip.format !== undefined && typeof tooltip.format !== 'string') {
        fail(`${name}.format must be a string`);
    }
    if (
        tooltip.formatter !== undefined &&
        typeof tooltip.formatter !== 'function'
    ) {
        fail(`${name}.formatter must be a function`);
    }
}

/**
 * Validate tiles data and spec.
 *
 * @param {Array} data - compact cell rows
 * @param {Object} spec - chart specification
 * @throws {Error} when data or spec is invalid
 */
export default function validateSpec(data, spec) {
    if (!Array.isArray(data)) fail('data must be an array');
    if (!isPlainObject(spec)) fail('spec must be a plain object');
    if (!isPlainObject(spec.mapping)) fail('spec.mapping is required');

    const { x, y } = spec.mapping;
    if (!x || typeof x !== 'string') fail('spec.mapping.x is required');
    if (!y || typeof y !== 'string') fail('spec.mapping.y is required');
    checkFields(data, [x, y], 'data');

    const scales = spec.scales ?? {};
    if (!isPlainObject(scales)) fail('spec.scales must be an object');
    checkOrder(scales.x?.order, 'spec.scales.x.order');
    checkOrder(scales.y?.order, 'spec.scales.y.order');
    checkOrder(scales.fill?.order, 'spec.scales.fill.order');
    checkColors(scales.fill?.colors, 'spec.scales.fill.colors');
    checkTooltip(spec.tooltip, 'spec.tooltip');

    if (spec.callbacks !== undefined && spec.callbacks !== null) {
        if (!isPlainObject(spec.callbacks)) {
            fail('spec.callbacks must be an object');
        }
        ['onClick', 'onRowClick', 'onExpand'].forEach((name) => {
            const fn = spec.callbacks[name];
            if (fn !== undefined && fn !== null && typeof fn !== 'function') {
                fail(`spec.callbacks.${name} must be a function`);
            }
        });
    }

    const pageSize = spec.rows?.pageSize;
    if (
        pageSize !== undefined &&
        pageSize !== null &&
        !(Number.isInteger(pageSize) && pageSize > 0)
    ) {
        fail('spec.rows.pageSize must be a positive integer');
    }

    const expand = spec.expand;
    if (expand === undefined || expand === null) return;
    if (!isPlainObject(expand)) fail('spec.expand must be an object');
    if (!Array.isArray(expand.data)) fail('spec.expand.data must be an array');
    if (!isPlainObject(expand.mapping) || !expand.mapping.x) {
        fail('spec.expand.mapping.x is required');
    }
    checkFields(expand.data, [x, y, expand.mapping.x], 'spec.expand.data');
    checkOrder(expand.scales?.fill?.order, 'spec.expand.scales.fill.order');
    checkColors(expand.scales?.fill?.colors, 'spec.expand.scales.fill.colors');
    checkOrder(expand.initial, 'spec.expand.initial');
    checkTooltip(expand.tooltip, 'spec.expand.tooltip');
}
