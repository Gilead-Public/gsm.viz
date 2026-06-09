/**
 * Align a dataset's points to a fixed set of category labels.
 *
 * Missing categories are filled with zero-value placeholder points so stacked
 * and filled bars remain aligned after dynamic category filtering.
 *
 * @param {Array<Object>} data - point objects to align
 * @param {Array} labels - category labels that should appear in order
 * @param {string} catKey - point property containing the category value
 * @param {string} valKey - point property containing the numeric value
 * @returns {Array<Object>} aligned point objects
 */
export default function alignDataToLabels(data, labels, catKey, valKey) {
    const pointByCategory = new Map(
        data.map((point) => [point[catKey], point])
    );

    return labels.map(
        (cat) =>
            pointByCategory.get(cat) || {
                [catKey]: cat,
                [valKey]: 0,
                _rawY: 0,
                _placeholder: true,
            }
    );
}
