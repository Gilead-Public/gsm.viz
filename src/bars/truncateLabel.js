/**
 * Truncate a label to a maximum character length, appending an ellipsis (…)
 * when the label is shortened.
 *
 * @param {*} label - the tick label (coerced to string)
 * @param {number|undefined|null} maxLength - positive integer; omit or pass undefined/null to skip truncation
 * @returns {string} the (possibly truncated) label
 */
export default function truncateLabel(label, maxLength) {
    if (label == null) return '';
    const str = String(label);
    if (!Number.isFinite(maxLength) || maxLength < 1 || str.length <= maxLength)
        return str;
    return str.slice(0, maxLength - 1) + '\u2026';
}
