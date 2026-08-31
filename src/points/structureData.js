function getCoordinate(row, field, mapping, index) {
    const value = row?.[field];

    if (typeof value !== 'number' || !Number.isFinite(value)) {
        throw new Error(
            `data[${index}].${field} mapped by spec.mapping.${mapping} must be a finite number`
        );
    }

    return value;
}

function getKey(row, field, index, keys) {
    const value = row?.[field];
    const isValid =
        typeof value === 'string' ||
        (typeof value === 'number' && Number.isFinite(value));

    if (!isValid) {
        throw new Error(
            `data[${index}].${field} mapped by spec.mapping.key must be a string or finite number`
        );
    }

    if (keys.has(value)) {
        throw new Error(
            `data[${index}].${field} mapped by spec.mapping.key must be unique; duplicate key ${JSON.stringify(
                value
            )}`
        );
    }

    keys.add(value);
    return value;
}

/**
 * Transform a merged points spec into Chart.js-compatible point data.
 *
 * @param {Object} spec - Merged point chart specification.
 * @returns {{datasets: Array}} Chart.js data configuration.
 */
export default function structureData(spec) {
    const { data, mapping } = spec;
    const keys = new Set();
    const points = data.map((row, index) => ({
        x: getCoordinate(row, mapping.x, 'x', index),
        y: getCoordinate(row, mapping.y, 'y', index),
        _key:
            mapping.key === undefined
                ? index
                : getKey(row, mapping.key, index, keys),
        _datum: row,
    }));

    return {
        datasets: [{ data: points }],
    };
}
