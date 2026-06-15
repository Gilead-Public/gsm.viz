import validateBarsSpec from '../bars/validateSpec.js';

/**
 * Validate the facetBars data and spec objects.
 *
 * Delegates common bars-level validation (data, mapping, position, orientation,
 * callbacks, etc.) to the existing bars/validateSpec, then adds facet-specific
 * checks on top.
 *
 * @param {Array}  data - array of data objects
 * @param {Object} spec - the chart specification
 * @throws {Error} if required fields are missing or invalid
 */
export default function validateSpec(data, spec) {
    // Reuse bars validation for shared keys (data, mapping, position, callbacks, etc.)
    validateBarsSpec(data, spec);

    if (!spec.facet) {
        throw new Error('spec.facet is required');
    }

    if (
        spec.facet === null ||
        typeof spec.facet !== 'object' ||
        Array.isArray(spec.facet) ||
        (Object.getPrototypeOf(spec.facet) !== Object.prototype &&
            Object.getPrototypeOf(spec.facet) !== null)
    ) {
        throw new Error('spec.facet must be a plain object');
    }

    if (!spec.facet.field) {
        throw new Error('spec.facet.field is required');
    }

    if (typeof spec.facet.field !== 'string') {
        throw new Error('spec.facet.field must be a string');
    }

    if (spec.facet.order !== undefined && !Array.isArray(spec.facet.order)) {
        throw new Error('spec.facet.order must be an array');
    }

    if (
        spec.facet.nCol !== undefined &&
        (!Number.isInteger(spec.facet.nCol) || spec.facet.nCol < 1)
    ) {
        throw new Error('spec.facet.nCol must be a positive integer');
    }

    const xFree = spec.facet?.scales?.x?.free;
    if (xFree !== undefined && typeof xFree !== 'boolean') {
        throw new Error('spec.facet.scales.x.free must be a boolean');
    }

    const yFree = spec.facet?.scales?.y?.free;
    if (yFree !== undefined && typeof yFree !== 'boolean') {
        throw new Error('spec.facet.scales.y.free must be a boolean');
    }

    const legendChart = spec.facet?.legend?.chart;
    if (legendChart !== undefined && typeof legendChart !== 'string') {
        throw new Error(
            "spec.facet.legend.chart must be 'first', 'last', or a string facet value"
        );
    }
}
