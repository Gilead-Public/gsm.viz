/**
 * Reorder datasets according to an explicit fill order.
 * Values in the order with no matching dataset are dropped.
 * Datasets not in the order are appended in their original order.
 * Labels are coerced to strings for comparison so numeric dataset
 * labels match string fill.order entries.
 *
 * @param {Array} datasets - array of dataset objects with `label` property
 * @param {Array} fillOrder - explicit ordering of fill values
 * @returns {Array} reordered datasets
 */
export default function reorderDatasets(datasets, fillOrder) {
    const datasetMap = new Map(datasets.map((ds) => [String(ds.label), ds]));
    const ordered = fillOrder
        .filter((val) => datasetMap.has(String(val)))
        .map((val) => datasetMap.get(String(val)));
    const orderedSet = new Set(fillOrder.map(String));
    const remaining = datasets.filter(
        (ds) => !orderedSet.has(String(ds.label))
    );
    return [...ordered, ...remaining];
}
