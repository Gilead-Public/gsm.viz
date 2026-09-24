import styleData from './styleData.js';

function getCoordinate(row, field, mapping, index, scale) {
    const value = row?.[field];

    if (typeof value !== 'number' || !Number.isFinite(value)) {
        throw new Error(
            `data[${index}].${field} mapped by spec.mapping.${mapping} must be a finite number`
        );
    }

    if (scale?.type === 'log' && value <= 0) {
        throw new Error(
            `data[${index}].${field} mapped by spec.mapping.${mapping} must be greater than zero for a log scale`
        );
    }

    return value;
}

function getColorLevel(row, field, index) {
    const value = row?.[field];

    if (
        typeof value !== 'string' &&
        (typeof value !== 'number' || !Number.isFinite(value))
    ) {
        throw new Error(
            `data[${index}].${field} mapped by spec.mapping.color must be a string or finite number`
        );
    }

    return String(value);
}

function getNumericAesthetic(row, field, aesthetic, index) {
    const value = row?.[field];
    const requirement =
        aesthetic === 'size'
            ? 'a finite non-negative number'
            : 'a finite number';
    const isValid =
        typeof value === 'number' &&
        Number.isFinite(value) &&
        (aesthetic !== 'size' || value >= 0);

    if (!isValid) {
        throw new Error(
            `data[${index}].${field} mapped by spec.mapping.${aesthetic} must be ${requirement}`
        );
    }

    return value;
}

function getColor(level, index, colorScale) {
    if (Object.prototype.hasOwnProperty.call(colorScale.colors, level)) {
        return colorScale.colors[level];
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
            x: getCoordinate(row, mapping.x, 'x', index, spec.scales?.x),
            y: getCoordinate(row, mapping.y, 'y', index, spec.scales?.y),
            _key:
                mapping.key === undefined
                    ? index
                    : getKey(row, mapping.key, index, keys),
            _datum: row,
        };

        const colorLevel = mapping.color
            ? getColorLevel(row, mapping.color, index)
            : undefined;
        if (colorLevel !== undefined) point._color = colorLevel;
        if (mapping.size) {
            point._size = getNumericAesthetic(row, mapping.size, 'size', index);
        }
        if (mapping.opacity) {
            point._opacity = getNumericAesthetic(
                row,
                mapping.opacity,
                'opacity',
                index
            );
        }

        return { point, colorLevel };
    });
    const points = records.map(({ point }) => point);

    if (mapping.color) {
        const colorScale = spec.scales.color;
        const levels = [];
        const groups = new Map();
        const seenLevels = new Set();

        const addLevel = (level) => {
            if (!seenLevels.has(level)) {
                seenLevels.add(level);
                levels.push(level);
            }

            return level;
        };

        colorScale.order.forEach((value) => addLevel(String(value)));
        records.forEach(({ point, colorLevel }) => {
            const key = addLevel(colorLevel);

            if (!groups.has(key)) {
                groups.set(key, []);
            }

            groups.get(key).push(point);
        });

        const datasets = levels.map((level, index) => {
            const color = getColor(level, index, colorScale);

            return {
                label: level,
                data: groups.get(level) || [],
                backgroundColor: color,
                borderColor: color,
            };
        });

        return { datasets: styleData(datasets, spec) };
    }

    return {
        datasets: styleData([{ data: points }], spec),
    };
}
