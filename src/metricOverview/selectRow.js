const matches = (value, selector) =>
    selector === undefined || String(value) === String(selector);

/**
 * Pick the one results row to show. The overview never chooses between rows
 * on its own: several matches are an error, no match is the empty state.
 *
 * @param {Array} results - one metric's Reporting_Results rows
 * @param {Object} spec - merged spec with optional groupId and snapshotDate
 * @returns {(Object|null)} the matching row, or null when none matches
 */
export default function selectRow(results, { groupId, snapshotDate }) {
    const matching = results.filter(
        (row) =>
            matches(row.GroupID, groupId) &&
            matches(row.SnapshotDate, snapshotDate)
    );

    if (matching.length > 1) {
        throw new Error(
            `${matching.length} results rows match; set spec.groupId and/or spec.snapshotDate to choose one`
        );
    }

    return matching[0] ?? null;
}
