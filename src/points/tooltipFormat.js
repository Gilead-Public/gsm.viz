const STRUCTURED_FIELDS = new Set(['x', 'y', 'color', 'key', '_color', '_key']);
const COLOR_FIELDS = new Set(['color', '_color']);

function getTokens(format) {
    return [...format.matchAll(/\{([^{}]+)\}/g)].map((match) => ({
        placeholder: match[0],
        path: match[1].trim(),
    }));
}

function getPath(object, path) {
    const fields = path.split('.');
    let value = object;

    for (const field of fields) {
        if (
            value === null ||
            value === undefined ||
            !Object.prototype.hasOwnProperty.call(Object(value), field)
        ) {
            return { found: false, value: undefined };
        }
        value = value[field];
    }

    return { found: true, value };
}

function getDatumPath(path) {
    if (path.startsWith('datum.')) return path.slice('datum.'.length);
    if (path.startsWith('_datum.')) return path.slice('_datum.'.length);
    return path;
}

function getStructuredValue(point, path) {
    const field = path === 'color' ? '_color' : path === 'key' ? '_key' : path;

    return getPath(point, field);
}

export function validateTooltipFormat(format, data, mapping) {
    if (!format) return;

    getTokens(format).forEach(({ placeholder, path }) => {
        if (COLOR_FIELDS.has(path) && !mapping.color) {
            throw new Error(
                `spec.tooltip.format placeholder "${placeholder}" requires spec.mapping.color`
            );
        }

        if (STRUCTURED_FIELDS.has(path)) return;
        if (data.length === 0) return;

        const datumPath = getDatumPath(path);
        const unavailableIndex = data.findIndex(
            (datum) => !getPath(datum, datumPath).found
        );

        if (unavailableIndex !== -1) {
            throw new Error(
                `spec.tooltip.format placeholder "${placeholder}" is not available in data[${unavailableIndex}]`
            );
        }
    });
}

export function formatTooltipPoint(format, point) {
    return format.replace(/\{([^{}]+)\}/g, (placeholder, rawPath) => {
        const path = rawPath.trim();
        const result = STRUCTURED_FIELDS.has(path)
            ? getStructuredValue(point, path)
            : getPath(point._datum, getDatumPath(path));

        if (!result.found) {
            throw new Error(
                `tooltip.format placeholder "${placeholder}" could not be resolved`
            );
        }

        return result.value === null || result.value === undefined
            ? ''
            : String(result.value);
    });
}
