function isBlank(row) {
    return row.Category === null || row.Category === undefined;
}

/**
 * Order one section's category rows for display.
 *
 * @param {Array} rows - one Source × Variable section's rows
 * @param {number} [topN] - number of recorded categories to show
 * @returns {{shown: Array, collapsed: Array, notRecorded: (Object|null)}}
 *  recorded categories by descending count (ties keep input order), those
 *  beyond the top N, and the blank category when it has records
 */
export default function orderCategories(rows, topN = Infinity) {
    // Array.prototype.sort is stable, so equal counts keep their input order.
    const sorted = rows
        .filter((row) => !isBlank(row))
        .sort((a, b) => b.Count - a.Count);
    const blank = rows.find(isBlank);

    return {
        shown: sorted.slice(0, topN),
        collapsed: sorted.slice(topN),
        notRecorded: blank && blank.Count > 0 ? blank : null,
    };
}
