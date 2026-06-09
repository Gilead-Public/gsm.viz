/**
 * Aggregate data into count-mode points: one point per category (and
 * optionally per fill group), where y = number of rows.
 *
 * @param {Array<Object>} data - raw input rows
 * @param {string} xKey - mapping key for the category axis
 * @param {string} fillKey - optional mapping key for fill groups
 * @param {Map} categoryIndex - lookup preserving resolved category order
 * @returns {Array<Object>} Chart.js datasets containing count points
 */
export default function aggregateCounts(data, xKey, fillKey, categoryIndex) {
    if (fillKey) {
        const groups = new Map();
        for (const d of data) {
            const key = d[fillKey];
            if (!groups.has(key)) groups.set(key, new Map());
            const catMap = groups.get(key);
            const cat = d[xKey];
            if (!catMap.has(cat)) catMap.set(cat, []);
            catMap.get(cat).push(d);
        }

        return [...groups.entries()].map(([fillValue, catMap]) => ({
            label: fillValue,
            data: [...catMap.entries()]
                .map(([cat, rows]) => ({
                    x: cat,
                    y: rows.length,
                    _fill: fillValue,
                    _datum: rows,
                }))
                .sort(
                    (a, b) => categoryIndex.get(a.x) - categoryIndex.get(b.x)
                ),
        }));
    }

    const catMap = new Map();
    for (const d of data) {
        const cat = d[xKey];
        if (!catMap.has(cat)) catMap.set(cat, []);
        catMap.get(cat).push(d);
    }

    return [
        {
            data: [...catMap.entries()]
                .map(([cat, rows]) => ({
                    x: cat,
                    y: rows.length,
                    _datum: rows,
                }))
                .sort(
                    (a, b) => categoryIndex.get(a.x) - categoryIndex.get(b.x)
                ),
        },
    ];
}
