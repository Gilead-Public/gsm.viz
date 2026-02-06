import getGroupIDs from './getGroupIDs.js';

/**
 * Evaluate every active filter, intersect the resulting group ID sets,
 * filter the original results, and re-render the group overview table.
 *
 * @param {Object}       groupOverview  - the groupOverview table instance
 * @param {Array}        results        - the **original** (unfiltered) results array
 * @param {Array}        groups         - enriched group-metrics array (from deriveGroupMetrics)
 * @param {Array<Object>} filters       - array of { id, property, getValue } objects
 *
 * @returns {Array} the set of GroupIDs currently visible after filtering
 */
export default function applyFilters(groupOverview, results, groups, filters) {
    // Collect per-filter group ID arrays.
    const perFilter = filters.map((f) => {
        const value = f.getValue();
        return getGroupIDs(groups, f.property, value);
    });

    // Intersect all sets: a GroupID must appear in every filter's output.
    let intersection;
    if (perFilter.length === 0) {
        intersection = groups.map((g) => g.GroupID);
    } else {
        intersection = perFilter.reduce((acc, ids) => {
            const set = new Set(ids);
            return acc.filter((id) => set.has(id));
        });
    }

    const groupIDSet = new Set(intersection);

    // Filter the original results to the intersected group IDs.
    const filteredResults = results.filter((d) => groupIDSet.has(d.GroupID));

    // Re-render the table.
    groupOverview.updateTable(filteredResults);

    return intersection;
}
