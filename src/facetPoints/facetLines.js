import structureLines from '../points/structureLines.js';
import { normalizeFacetValue } from './splitData.js';

function isMissingGroup(value) {
    return (
        value === null ||
        value === undefined ||
        value === '' ||
        (typeof value === 'string' && value.trim().length === 0) ||
        (typeof value === 'number' && Number.isNaN(value))
    );
}

function isFacetAware(line, facetField) {
    return line.data.some(
        (row) =>
            row !== null &&
            row !== undefined &&
            Object.prototype.hasOwnProperty.call(row, facetField)
    );
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

function addGroup(order, seen, value) {
    const normalized = isMissingGroup(value) ? null : value;
    const key = getGroupKey(normalized);
    if (!seen.has(key)) {
        seen.add(key);
        order.push(normalized);
    }
}

function getGroupKey(value) {
    return value === null ? 'missing' : JSON.stringify([typeof value, value]);
}

/**
 * Validate and partition auxiliary lines once for a facet grid.
 *
 * @param {Object} spec - Merged facet points spec.
 * @param {Array} facetValues - Ordered rendered facet identities.
 * @returns {Object} Prepared common and facet-aware auxiliary lines.
 */
export default function prepareFacetLines(spec, facetValues) {
    const { lines } = spec.annotations;
    const { field } = spec.facet;

    validateFacetLines(lines, field);
    structureLines(spec);

    const byFacet = new Map(facetValues.map((value) => [value, []]));
    const facetAwareByFacet = new Map(facetValues.map((value) => [value, []]));
    const common = [];

    lines.forEach((line) => {
        const facetAware = isFacetAware(line, field);
        const partitions = facetAware
            ? new Map(facetValues.map((value) => [value, []]))
            : undefined;
        const order = line.mapping.group ? [...(line.order || [])] : undefined;
        const seenGroups = order
            ? new Set((line.order || []).map((value) => getGroupKey(value)))
            : undefined;

        line.data.forEach((row) => {
            if (order) addGroup(order, seenGroups, row?.[line.mapping.group]);
            if (facetAware) {
                const facetValue = normalizeFacetValue(row?.[field]);
                partitions.get(facetValue)?.push(row);
            }
        });

        const makeLine = (data) => ({
            ...line,
            ...(order ? { order } : {}),
            data,
        });

        if (facetAware) {
            facetValues.forEach((facetValue) => {
                const prepared = makeLine(partitions.get(facetValue));
                byFacet.get(facetValue).push(prepared);
                facetAwareByFacet.get(facetValue).push(prepared);
            });
        } else {
            const prepared = makeLine([...line.data]);
            common.push(prepared);
            facetValues.forEach((facetValue) =>
                byFacet.get(facetValue).push(prepared)
            );
        }
    });

    return { byFacet, facetAwareByFacet, common };
}
