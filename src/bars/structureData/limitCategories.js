/**
 * Limit the category list to the top N categories.
 *
 * - 'total': selects the top N categories ordered by descending aggregate
 *   value (sum of yKey across all rows, or row count when yKey is absent),
 *   with ties broken by alphanumeric order. The returned categories are in
 *   descending-total order.
 * - 'alphanumeric': selects the first N categories from the already
 *   alphanumerically sorted list. No reordering is applied.
 *
 * When nCategories is undefined/null or is already ≥ the number of
 * categories, the original list is returned unchanged with nExcluded = 0.
 *
 * @param {Array}  categories - all resolved categories (in display order)
 * @param {Array}  data       - active data array
 * @param {string} xKey       - mapping key for the x (category) axis
 * @param {string} [yKey]     - mapping key for the y axis; omit for count mode
 * @param {number} nCategories - maximum number of categories to display
 * @param {string} [sort='total'] - 'total' | 'alphanumeric'
 * @returns {{ limitedCategories: Array, nExcluded: number }}
 */
export default function limitCategories(
    categories,
    data,
    xKey,
    yKey,
    nCategories,
    sort = 'total'
) {
    if (!nCategories || nCategories >= categories.length) {
        return { limitedCategories: categories, nExcluded: 0 };
    }

    const nExcluded = categories.length - nCategories;

    if (sort === 'total') {
        const totals = new Map();
        for (const d of data) {
            const cat = d[xKey];
            const val = yKey ? Number(d[yKey]) || 0 : 1;
            totals.set(cat, (totals.get(cat) || 0) + val);
        }

        const sorted = [...categories].sort((a, b) => {
            const diff = (totals.get(b) || 0) - (totals.get(a) || 0);
            if (diff !== 0) return diff;
            return String(a).localeCompare(String(b), undefined, {
                sensitivity: 'base',
            });
        });

        return { limitedCategories: sorted.slice(0, nCategories), nExcluded };
    }

    // 'alphanumeric': categories are already sorted; take first N.
    return { limitedCategories: categories.slice(0, nCategories), nExcluded };
}
