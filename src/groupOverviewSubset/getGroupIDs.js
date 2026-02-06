/**
 * Return group IDs that match a filter criterion.
 *
 * @param {Array}  groups    - array of group-metric objects (output of deriveGroupMetrics)
 * @param {string} property  - the property to filter on (e.g. 'country', 'siteRiskScore')
 * @param {*}      value     - filter value:
 *                               - Array   → categorical match (group[property] is in the array)
 *                               - Object  → range match        ({ min, max })
 *                               - null    → no filter (return all)
 *
 * @returns {Array} matching GroupID strings
 */
export default function getGroupIDs(groups, property, value) {
    // No filter applied — return every group.
    if (value === null || value === undefined) {
        return groups.map((g) => g.GroupID);
    }

    // --- anyFlag special handling ---
    if (property === 'anyFlag') {
        return getGroupIDsByFlag(groups, value);
    }

    // --- Range filter { min, max } ---
    if (
        typeof value === 'object' &&
        !Array.isArray(value) &&
        ('min' in value || 'max' in value)
    ) {
        const min = value.min !== undefined && value.min !== null
            ? Number(value.min)
            : -Infinity;
        const max = value.max !== undefined && value.max !== null
            ? Number(value.max)
            : Infinity;

        return groups
            .filter((g) => {
                const v = Number(g[property]);
                if (isNaN(v)) return false;
                return v >= min && v <= max;
            })
            .map((g) => g.GroupID);
    }

    // --- Categorical filter (array of values) ---
    if (Array.isArray(value)) {
        // Empty array or array with a single 'all' value → return all.
        if (
            value.length === 0 ||
            (value.length === 1 && String(value[0]).toLowerCase() === 'all')
        ) {
            return groups.map((g) => g.GroupID);
        }

        const allowed = new Set(value.map(String));

        return groups
            .filter((g) => {
                const v = g[property];
                return v !== undefined && allowed.has(String(v));
            })
            .map((g) => g.GroupID);
    }

    // Fallback — treat scalar as single-value categorical.
    return groups
        .filter((g) => String(g[property]) === String(value))
        .map((g) => g.GroupID);
}

// ── helpers ──────────────────────────────────────────────────────────

function getGroupIDsByFlag(groups, value) {
    // value is a string like 'all', 'red', 'amber', 'red-or-amber'
    const flag = Array.isArray(value) ? value[0] : value;
    const flagStr = String(flag).toLowerCase();

    switch (flagStr) {
        case 'red':
            return groups
                .filter((g) => g.nRedFlags > 0)
                .map((g) => g.GroupID);
        case 'amber':
            return groups
                .filter((g) => g.nAmberFlags > 0)
                .map((g) => g.GroupID);
        case 'red-or-amber':
            return groups
                .filter((g) => g.nRedFlags > 0 || g.nAmberFlags > 0)
                .map((g) => g.GroupID);
        case 'all':
        default:
            return groups.map((g) => g.GroupID);
    }
}
