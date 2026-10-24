/**
 * Stringify a value for use as a lookup key so that, e.g., 1 and '1' match.
 *
 * @param {*} value
 * @returns {string}
 */
export function keyOf(value) {
    return value === null || value === undefined ? '' : String(value);
}

/**
 * Unique values with explicit `order` entries first, then any remaining
 * values in order of first appearance.
 *
 * @param {Array} values
 * @param {Array} [order]
 * @returns {Array}
 */
export function orderValues(values, order) {
    const seen = new Set();
    const out = [];
    [...(order ?? []), ...values].forEach((value) => {
        const key = keyOf(value);
        if (!seen.has(key)) {
            seen.add(key);
            out.push(value);
        }
    });
    return out;
}

const isNumeric = (value) =>
    value !== null &&
    value !== '' &&
    typeof value !== 'boolean' &&
    Number.isFinite(Number(value));

/**
 * Sort detail column values numerically when all are numeric; otherwise keep
 * order of first appearance.
 *
 * @param {Array} values - unique values
 * @returns {Array}
 */
export function sortDetailValues(values) {
    return values.every(isNumeric)
        ? [...values].sort((a, b) => Number(a) - Number(b))
        : values;
}

/**
 * Structure compact (and optional detail) rows into ordered rows, columns
 * and cell lookups. Pure: no DOM access.
 *
 * @param {Array} data - compact rows
 * @param {Object} spec - merged spec
 * @returns {Object} { rows, columns, cells, rowData, detailCells }
 */
export default function structureData(data, spec) {
    const { x, y } = spec.mapping;
    const cellKey = (yValue, xValue) =>
        `${keyOf(yValue)}\u0000${keyOf(xValue)}`;

    const cells = new Map();
    const rowData = new Map();
    data.forEach((row) => {
        const key = cellKey(row[y], row[x]);
        if (!cells.has(key)) cells.set(key, row);
        const yKey = keyOf(row[y]);
        if (!rowData.has(yKey)) rowData.set(yKey, []);
        rowData.get(yKey).push(row);
    });

    const detailValues = new Map();
    const detailCells = new Map();
    if (spec.expand) {
        const dx = spec.expand.mapping.x;
        spec.expand.data.forEach((row) => {
            const xKey = keyOf(row[x]);
            if (!detailValues.has(xKey)) detailValues.set(xKey, []);
            detailValues.get(xKey).push(row[dx]);
            const key = `${cellKey(row[y], row[x])}\u0000${keyOf(row[dx])}`;
            if (!detailCells.has(key)) detailCells.set(key, row);
        });
    }

    const rows = orderValues(
        data.map((row) => row[y]),
        spec.scales.y.order
    ).map((value) => ({ value, key: keyOf(value) }));

    const columns = orderValues(
        data.map((row) => row[x]),
        spec.scales.x.order
    ).map((value) => {
        const key = keyOf(value);
        return {
            value,
            key,
            details: sortDetailValues(orderValues(detailValues.get(key) ?? [])),
        };
    });

    return {
        rows,
        columns,
        rowData,
        getCell: (yValue, xValue) => cells.get(cellKey(yValue, xValue)),
        getDetailCell: (yValue, xValue, dxValue) =>
            detailCells.get(
                `${cellKey(yValue, xValue)}\u0000${keyOf(dxValue)}`
            ),
    };
}
