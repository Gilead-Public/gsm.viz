const MISSING_LABEL = '(Missing)';
const MISSING_COLOR = '#bdbdbd';
const DEFAULT_COLOR = '#666666';

function getCoordinate(row, field, axis, layerIndex, rowIndex, scale) {
    const value = row?.[field];
    const path = `spec.annotations.lines[${layerIndex}].data[${rowIndex}].${field} mapped by mapping.${axis}`;

    if (typeof value !== 'number' || !Number.isFinite(value)) {
        throw new Error(`${path} must be a finite number`);
    }
    if (scale.type === 'log' && value <= 0) {
        throw new Error(`${path} must be greater than zero for a log scale`);
    }

    return value;
}

function getGroupLevel(row, field, layerIndex, rowIndex) {
    const value = row?.[field];

    if (
        value === undefined ||
        value === null ||
        value === '' ||
        (typeof value === 'string' && value.trim().length === 0) ||
        (typeof value === 'number' && Number.isNaN(value))
    ) {
        return { value: MISSING_LABEL, missing: true };
    }
    if (
        typeof value !== 'string' &&
        (typeof value !== 'number' || !Number.isFinite(value))
    ) {
        throw new Error(
            `spec.annotations.lines[${layerIndex}].data[${rowIndex}].${field} mapped by mapping.group must be a string, finite number, or missing`
        );
    }

    return { value, missing: false };
}

function getLevelKey(level) {
    return level.missing
        ? 'missing'
        : JSON.stringify([typeof level.value, level.value]);
}

function getOrderedLevel(value) {
    return value === null
        ? { value: MISSING_LABEL, missing: true }
        : { value, missing: false };
}

function getLevelLabel(level) {
    return !level.missing && level.value === MISSING_LABEL
        ? JSON.stringify(level.value)
        : String(level.value);
}

function resolveLevels(records, order = []) {
    const levels = [];
    const seen = new Set();
    const add = (level) => {
        const key = getLevelKey(level);
        if (!seen.has(key)) {
            seen.add(key);
            levels.push(level);
        }
    };

    order.map(getOrderedLevel).forEach(add);
    records.forEach(({ group }) => add(group));
    return levels;
}

function getColor(level, index, line, defaultPalette) {
    if (level?.missing) return MISSING_COLOR;

    const namedLevel = String(level?.value);
    if (
        level &&
        Object.prototype.hasOwnProperty.call(line.colors || {}, namedLevel)
    ) {
        return line.colors[namedLevel];
    }
    if (line.color !== undefined) return line.color;

    const palette = line.palette || defaultPalette;
    return level
        ? palette[index % palette.length]
        : line.color ?? DEFAULT_COLOR;
}

function makeDataset(line, data, color, label, layerIndex) {
    return {
        type: 'line',
        label,
        data,
        borderColor: color,
        backgroundColor: color,
        borderWidth: line.width ?? 2,
        borderDash: line.dash ? [...line.dash] : [],
        tension: line.tension ?? 0,
        stepped: line.stepped ?? false,
        fill: false,
        pointRadius: 0,
        pointHoverRadius: 0,
        pointHitRadius: 0,
        pointStyle: 'line',
        order: 1,
        _annotation: true,
        _annotationLayer: layerIndex,
        _showInLegend: line.showInLegend ?? false,
    };
}

function structureLine(line, layerIndex, spec) {
    const records = line.data.map((row, rowIndex) => ({
        point: {
            x: getCoordinate(
                row,
                line.mapping.x,
                'x',
                layerIndex,
                rowIndex,
                spec.scales.x
            ),
            y: getCoordinate(
                row,
                line.mapping.y,
                'y',
                layerIndex,
                rowIndex,
                spec.scales.y
            ),
            _datum: row,
        },
        group: line.mapping.group
            ? getGroupLevel(row, line.mapping.group, layerIndex, rowIndex)
            : undefined,
    }));

    if (!line.mapping.group) {
        return [
            makeDataset(
                line,
                records.map(({ point }) => point),
                line.color ?? line.palette?.[0] ?? DEFAULT_COLOR,
                line.label ?? '',
                layerIndex
            ),
        ];
    }

    const groups = new Map();
    records.forEach((record) => {
        const key = getLevelKey(record.group);
        if (!groups.has(key)) groups.set(key, []);
        groups.get(key).push(record.point);
    });

    return resolveLevels(records, line.order).map((level, index) => {
        const levelLabel = getLevelLabel(level);
        const label = line.label ? `${line.label}: ${levelLabel}` : levelLabel;
        const dataset = makeDataset(
            line,
            groups.get(getLevelKey(level)) || [],
            getColor(level, index, line, spec.scales.color.palette),
            label,
            layerIndex
        );
        dataset._annotationGroup = level.value;
        dataset._annotationGroupMissing = level.missing;
        return dataset;
    });
}

/**
 * Transform auxiliary line layers into Chart.js line datasets.
 *
 * @param {Object} spec - Merged points specification.
 * @returns {Array} Chart.js line datasets.
 */
export default function structureLines(spec) {
    return spec.annotations.lines.flatMap((line, index) =>
        structureLine(line, index, spec)
    );
}
