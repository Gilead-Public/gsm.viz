/**
 * Resolve category order from data and spec.
 *
 * - If spec.scales.x.order is provided, use that order, filtering to
 *   categories that exist in data, then append any remaining data
 *   categories in alphanumeric order.
 * - Otherwise, extract unique categories from data and sort
 *   alphanumerically (case-insensitive).
 *
 * @param {Array} data - raw data array
 * @param {string} xKey - the mapping key for the x (category) axis
 * @param {Array} [explicitOrder] - optional explicit category order
 * @returns {Array} ordered category labels
 */
export default function resolveCategories(data, xKey, explicitOrder) {
    const dataCategories = [...new Set(data.map((d) => d[xKey]))];

    if (explicitOrder) {
        const dataSet = new Set(dataCategories);
        const ordered = explicitOrder.filter((cat) => dataSet.has(cat));
        const orderedSet = new Set(ordered);
        const remaining = dataCategories
            .filter((cat) => !orderedSet.has(cat))
            .sort((a, b) =>
                String(a).localeCompare(String(b), undefined, {
                    sensitivity: 'base',
                })
            );
        return [...ordered, ...remaining];
    }

    return dataCategories.sort((a, b) =>
        String(a).localeCompare(String(b), undefined, {
            sensitivity: 'base',
        })
    );
}
