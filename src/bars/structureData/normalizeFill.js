/**
 * Normalize y values within each x-category to percentages of the category
 * total. For each point, stores the original value as `_rawY` then replaces
 * `y` with `(rawY / categoryTotal) * 100`. Zero-total categories are left at 0.
 *
 * @param {Array} datasets - structured datasets (point objects with x/y)
 * @param {boolean} horizontal - true when orientation is horizontal
 */
export default function normalizeFill(datasets, horizontal) {
    const catKey = horizontal ? 'x' : 'y';
    const valKey = horizontal ? 'y' : 'x';

    const totals = new Map();
    for (const ds of datasets) {
        for (const pt of ds.data) {
            const cat = pt[valKey];
            const val = pt[catKey];
            totals.set(cat, (totals.get(cat) || 0) + val);
        }
    }

    for (const ds of datasets) {
        for (const pt of ds.data) {
            const cat = pt[valKey];
            const total = totals.get(cat) || 0;
            pt._rawY = pt[catKey];
            pt[catKey] = total === 0 ? 0 : (pt._rawY / total) * 100;
        }
    }
}
