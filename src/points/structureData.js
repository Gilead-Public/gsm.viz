import styleData from './styleData.js';
import { FALLBACK_POINT_STYLES, MISSING_POINT_STYLE } from './pointStyles.js';

const MISSING_LEVEL_LABEL = '(Missing)';
const MISSING_COLOR = '#bdbdbd';

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

function getDiscreteLevel(row, field, aesthetic, index) {
    const value = row?.[field];

    if (
        value === undefined ||
        value === null ||
        value === '' ||
        (typeof value === 'string' && value.trim().length === 0) ||
        (typeof value === 'number' && Number.isNaN(value))
    ) {
        return { value: MISSING_LEVEL_LABEL, missing: true };
    }

    if (
        typeof value !== 'string' &&
        (typeof value !== 'number' || !Number.isFinite(value))
    ) {
        throw new Error(
            `data[${index}].${field} mapped by spec.mapping.${aesthetic} must be a string, finite number, or missing`
        );
    }

    return { value, missing: false };
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

function getLevelKey(level) {
    return level.missing
        ? 'missing'
        : `value:${typeof level.value}:${String(level.value)}`;
}

function getOrderedLevel(value) {
    return value === null
        ? { value: MISSING_LEVEL_LABEL, missing: true }
        : { value, missing: false };
}

function resolveLevels(records, field, order = []) {
    const levels = [];
    const seen = new Set();
    const observed = records.map((record) => record[field]);

    const add = (level) => {
        const key = getLevelKey(level);
        if (!seen.has(key)) {
            seen.add(key);
            levels.push(level);
        }
    };

    order.map(getOrderedLevel).forEach(add);
    observed.forEach(add);

    return levels;
}

function getLevelRanks(levels) {
    return new Map(levels.map((level, index) => [getLevelKey(level), index]));
}

function getColor(level, index, colorScale) {
    if (level.missing) return MISSING_COLOR;

    const namedLevel = String(level.value);
    if (Object.prototype.hasOwnProperty.call(colorScale.colors, namedLevel)) {
        return colorScale.colors[namedLevel];
    }

    return colorScale.palette[index % colorScale.palette.length];
}

function getShape(level, index, shapeScale) {
    if (level.missing) return MISSING_POINT_STYLE;

    const namedLevel = String(level.value);
    if (Object.prototype.hasOwnProperty.call(shapeScale.values, namedLevel)) {
        return shapeScale.values[namedLevel];
    }

    return FALLBACK_POINT_STYLES[index % FALLBACK_POINT_STYLES.length];
}

function getCompositeLabel(level) {
    if (level.missing) return `${MISSING_LEVEL_LABEL} (missing value)`;
    return typeof level.value === 'string'
        ? JSON.stringify(level.value)
        : String(level.value);
}

function getLevelLabel(level) {
    return !level.missing && level.value === MISSING_LEVEL_LABEL
        ? JSON.stringify(level.value)
        : String(level.value);
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

function groupRecords(records, getGroup) {
    const groups = new Map();

    records.forEach((record) => {
        const group = getGroup(record);
        if (!groups.has(group.key)) {
            groups.set(group.key, { ...group, records: [] });
        }
        groups.get(group.key).records.push(record);
    });

    return [...groups.values()];
}

function buildDatasets(records, spec) {
    const { mapping, scales } = spec;
    const hasColor = !!mapping.color;
    const hasShape = !!mapping.shape;

    if (!hasColor && !hasShape) {
        return [{ data: records.map(({ point }) => point) }];
    }

    const hasSharedLevel =
        hasColor && hasShape && mapping.color === mapping.shape;
    const sharedLevels = hasSharedLevel
        ? resolveLevels(records, 'colorLevel', [
              ...scales.color.order,
              ...scales.shape.order,
          ])
        : [];
    const colorLevels = hasSharedLevel
        ? sharedLevels
        : hasColor
        ? resolveLevels(records, 'colorLevel', scales.color.order)
        : [];
    const shapeLevels = hasSharedLevel
        ? sharedLevels
        : hasShape
        ? resolveLevels(records, 'shapeLevel', scales.shape.order)
        : [];
    const colorRanks = getLevelRanks(colorLevels);
    const shapeRanks = getLevelRanks(shapeLevels);
    let groups;

    if (hasColor && !hasShape) {
        const byColor = new Map(
            groupRecords(records, ({ colorLevel }) => ({
                key: getLevelKey(colorLevel),
                colorLevel,
            })).map((group) => [group.key, group])
        );

        groups = colorLevels.map((colorLevel) => {
            const key = getLevelKey(colorLevel);
            return (
                byColor.get(key) || {
                    key,
                    colorLevel,
                    records: [],
                }
            );
        });
    } else if (!hasColor && hasShape) {
        const byShape = new Map(
            groupRecords(records, ({ shapeLevel }) => ({
                key: getLevelKey(shapeLevel),
                shapeLevel,
            })).map((group) => [group.key, group])
        );

        groups = shapeLevels.map((shapeLevel) => {
            const key = getLevelKey(shapeLevel);
            return (
                byShape.get(key) || {
                    key,
                    shapeLevel,
                    records: [],
                }
            );
        });
    } else if (hasSharedLevel) {
        const byLevel = new Map(
            groupRecords(records, ({ colorLevel, shapeLevel }) => ({
                key: getLevelKey(colorLevel),
                colorLevel,
                shapeLevel,
            })).map((group) => [group.key, group])
        );

        groups = sharedLevels.map((level) => {
            const key = getLevelKey(level);
            return (
                byLevel.get(key) || {
                    key,
                    colorLevel: level,
                    shapeLevel: level,
                    records: [],
                }
            );
        });
    } else {
        groups = groupRecords(records, ({ colorLevel, shapeLevel }) => ({
            key: JSON.stringify([
                getLevelKey(colorLevel),
                getLevelKey(shapeLevel),
            ]),
            colorLevel,
            shapeLevel,
        })).sort((a, b) => {
            const colorDifference =
                colorRanks.get(getLevelKey(a.colorLevel)) -
                colorRanks.get(getLevelKey(b.colorLevel));
            return (
                colorDifference ||
                shapeRanks.get(getLevelKey(a.shapeLevel)) -
                    shapeRanks.get(getLevelKey(b.shapeLevel))
            );
        });
    }

    return groups.map((group, groupIndex) => {
        const colorIndex = hasColor
            ? colorRanks.get(getLevelKey(group.colorLevel)) ?? groupIndex
            : 0;
        const shapeIndex = hasShape
            ? shapeRanks.get(getLevelKey(group.shapeLevel)) ?? groupIndex
            : 0;
        const color = hasColor
            ? getColor(group.colorLevel, colorIndex, scales.color)
            : scales.color.palette[0];
        const colorLabel = hasColor
            ? getLevelLabel(group.colorLevel)
            : undefined;
        const shapeLabel = hasShape
            ? getLevelLabel(group.shapeLevel)
            : undefined;
        const label =
            hasColor && hasShape && mapping.color !== mapping.shape
                ? `${getCompositeLabel(group.colorLevel)} / ${getCompositeLabel(
                      group.shapeLevel
                  )}`
                : colorLabel || shapeLabel;
        const dataset = {
            label,
            data: group.records.map(({ point }) => point),
            backgroundColor: color,
            borderColor: color,
        };

        if (hasShape) {
            dataset.pointStyle = getShape(
                group.shapeLevel,
                shapeIndex,
                scales.shape
            );
        }
        if (hasColor) {
            dataset._color = group.colorLevel.value;
            dataset._colorMissing = group.colorLevel.missing;
        }
        if (hasShape) {
            dataset._shape = group.shapeLevel.value;
            dataset._shapeMissing = group.shapeLevel.missing;
        }

        return dataset;
    });
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
            ? getDiscreteLevel(row, mapping.color, 'color', index)
            : undefined;
        const shapeLevel = mapping.shape
            ? getDiscreteLevel(row, mapping.shape, 'shape', index)
            : undefined;

        if (colorLevel) point._color = colorLevel.value;
        if (shapeLevel) point._shape = shapeLevel.value;
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

        return { point, colorLevel, shapeLevel };
    });

    return {
        datasets: styleData(buildDatasets(records, spec), spec),
    };
}
