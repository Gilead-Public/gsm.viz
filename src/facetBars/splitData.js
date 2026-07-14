/**
 * Split an array of data objects into a Map keyed by the unique values of a
 * specified field.
 *
 * @param {Array}  data  - array of plain data objects
 * @param {string} field - the field name to split on
 * @param {Array}  [order] - optional ordered array of facet values; only values
 *   present in order are included, and the Map entries appear in that order
 * @returns {Map<string, Array>} Map from (string) facet value to rows
 */
export default function splitData(data, field, order) {
    const map = new Map();

    if (order) {
        for (const val of order) {
            map.set(String(val), []);
        }
    }

    for (const row of data) {
        const key = String(row[field]);
        if (order && !map.has(key)) continue;
        if (!map.has(key)) map.set(key, []);
        map.get(key).push(row);
    }

    return map;
}
