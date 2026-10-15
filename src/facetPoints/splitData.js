const MISSING_LABEL = '(Missing)';

export function normalizeFacetValue(value) {
    return value === undefined ||
        value === null ||
        value === '' ||
        (typeof value === 'string' && value.trim().length === 0) ||
        (typeof value === 'number' && Number.isNaN(value))
        ? null
        : value;
}

export function formatFacetValue(value) {
    if (value === null) return MISSING_LABEL;
    return value === MISSING_LABEL ? JSON.stringify(value) : String(value);
}

/**
 * Split data by typed facet identity in first-seen or requested order.
 *
 * @param {Array} data - Source rows.
 * @param {string} field - Facet field.
 * @param {Array} [order] - Ordered allowlist, including requested empty facets.
 * @returns {Map<*, Array>} Rows grouped by canonical facet value.
 */
export default function splitData(data, field, order) {
    const facets = new Map();
    const ordered = order !== undefined;

    if (ordered) {
        order.forEach((value) => {
            facets.set(normalizeFacetValue(value), []);
        });
    }

    data.forEach((row) => {
        const value = normalizeFacetValue(row?.[field]);
        if (ordered && !facets.has(value)) return;
        if (!facets.has(value)) facets.set(value, []);
        facets.get(value).push(row);
    });

    return facets;
}
