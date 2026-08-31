import { normalizeFacetValue } from './splitData.js';

function isFacetAware(line, facetField) {
    return line.data.some(
        (row) =>
            row !== null &&
            row !== undefined &&
            Object.prototype.hasOwnProperty.call(row, facetField)
    );
}

function getLineData(line, facetField, facetValue) {
    return isFacetAware(line, facetField)
        ? line.data.filter(
              (row) => normalizeFacetValue(row?.[facetField]) === facetValue
          )
        : [...line.data];
}

/**
 * Validate identities on every facet-aware row before allowlist filtering.
 *
 * @param {Object[]} lines - Merged auxiliary line configurations.
 * @param {string} facetField - Source field used to split facets.
 */
export function validateFacetLines(lines, facetField) {
    lines.forEach((line, lineIndex) => {
        if (!isFacetAware(line, facetField)) return;

        line.data.forEach((row, rowIndex) => {
            const value = normalizeFacetValue(row?.[facetField]);
            if (
                value !== null &&
                typeof value !== 'string' &&
                (typeof value !== 'number' || !Number.isFinite(value))
            ) {
                throw new Error(
                    `spec.annotations.lines[${lineIndex}].data[${rowIndex}].${facetField} mapped by spec.facet.field must be a string, finite number, or missing`
                );
            }
        });
    });
}

/**
 * Filter facet-aware auxiliary rows while repeating global line layers.
 *
 * @param {Object[]} lines - Merged auxiliary line configurations.
 * @param {string} facetField - Source field used to split facets.
 * @param {*} facetValue - Canonical typed facet value.
 * @returns {Object[]} Independent line configurations for one facet.
 */
export default function getFacetLines(lines, facetField, facetValue) {
    return lines.map((line) => ({
        ...line,
        data: getLineData(line, facetField, facetValue),
    }));
}
