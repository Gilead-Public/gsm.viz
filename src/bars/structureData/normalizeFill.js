/**
 * Normalize values within each category to percentages of the category total.
 * For each point, stores the original value as `_rawY`, then replaces the value
 * field with `(rawValue / categoryTotal) * 100`. Horizontal charts are already
 * axis-swapped, so the value field is `x` and the category field is `y`.
 *
 * @param {Array} datasets - structured datasets (point objects with x/y)
 * @param {boolean} horizontal - true when orientation is horizontal
 */
export default function normalizeFill(datasets, horizontal) {
    const valueKey = horizontal ? 'x' : 'y';
    const categoryKey = horizontal ? 'y' : 'x';

    const totals = new Map();
    for (const ds of datasets) {
        for (const pt of ds.data) {
            const category = pt[categoryKey];
            const value = pt[valueKey];
            totals.set(category, (totals.get(category) || 0) + value);
        }
    }

    for (const ds of datasets) {
        for (const pt of ds.data) {
            const category = pt[categoryKey];
            const total = totals.get(category) || 0;
            pt._rawY = pt[valueKey];
            pt[valueKey] = total === 0 ? 0 : (pt._rawY / total) * 100;
        }
    }
}
