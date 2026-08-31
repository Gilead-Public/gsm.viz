const MISSING_COLOR_LABEL = '(Missing)';
const MISSING_COLOR = '#bdbdbd';

function getCoordinate(row, field, mapping, index) {
    const value = row?.[field];

    if (typeof value !== 'number' || !Number.isFinite(value)) {
        throw new Error(
            `data[${index}].${field} mapped by spec.mapping.${mapping} must be a finite number`
        );
    }

    return value;
}

function getColorLevel(row, field, index) {
    const value = row?.[field];

    if (
        value === undefined ||
        value === null ||
        value === '' ||
        (typeof value === 'string' && value.trim().length === 0) ||
        (typeof value === 'number' && Number.isNaN(value))
    ) {
        return { value: MISSING_COLOR_LABEL, missing: true };
    }

    if (
        typeof value !== 'string' &&
        (typeof value !== 'number' || !Number.isFinite(value))
    ) {
        throw new Error(
            `data[${index}].${field} mapped by spec.mapping.color must be a string, finite number, or missing`
        );
    }

    return { value, missing: false };
}

function getLevelKey(level) {
    return level.missing
        ? 'missing'
        : `value:${typeof level.value}:${String(level.value)}`;
}

function getColor(level, index, colorScale) {
    if (level.missing) {
        return MISSING_COLOR;
    }

    const namedLevel = String(level.value);
    if (Object.prototype.hasOwnProperty.call(colorScale.colors, namedLevel)) {
        return colorScale.colors[namedLevel];
    }

    return colorScale.palette[index % colorScale.palette.length];
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
    const records = data.map((row, index) => {
        const point = {
            x: getCoordinate(row, mapping.x, 'x', index),
            y: getCoordinate(row, mapping.y, 'y', index),
            _key:
                mapping.key === undefined
                    ? index
                    : getKey(row, mapping.key, index, keys),
            _datum: row,
        };

        const colorLevel = mapping.color
            ? getColorLevel(row, mapping.color, index)
            : undefined;
        if (colorLevel) point._color = colorLevel.value;

        return { point, colorLevel };
    });
    const points = records.map(({ point }) => point);

    if (mapping.color) {
        const colorScale = spec.scales.color;
        const levels = [];
        const groups = new Map();
        const seenLevels = new Set();

        const addLevel = (level) => {
            const key = getLevelKey(level);

            if (!seenLevels.has(key)) {
                seenLevels.add(key);
                levels.push(level);
            }

            return key;
        };

        colorScale.order.forEach((value) =>
            addLevel({
                value,
                missing: value === MISSING_COLOR_LABEL,
            })
        );
        records.forEach(({ point, colorLevel }) => {
            const key = addLevel(colorLevel);

            if (!groups.has(key)) {
                groups.set(key, []);
            }

            groups.get(key).push(point);
        });

        return {
            datasets: levels.map((level, index) => {
                const color = getColor(level, index, colorScale);

                return {
                    label: String(level.value),
                    data: groups.get(getLevelKey(level)) || [],
                    backgroundColor: color,
                    borderColor: color,
                };
            }),
        };
    }

    return {
        datasets: [{ data: points }],
    };
}
