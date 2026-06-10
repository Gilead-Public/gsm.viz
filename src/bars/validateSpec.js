/**
 * Validate the bars data and spec objects.
 *
 * @param {Array}  data - array of data objects
 * @param {Object} spec - the chart specification
 * @throws {Error} if required fields are missing or invalid
 */
export default function validateSpec(data, spec) {
    if (data === undefined || data === null) {
        throw new Error('data is required');
    }

    if (!Array.isArray(data)) {
        throw new Error('data must be an array');
    }

    if (spec === undefined || spec === null) {
        throw new Error('spec is required');
    }

    if (typeof spec !== 'object' || Array.isArray(spec)) {
        throw new Error('spec must be a plain object');
    }

    if (!spec.mapping) {
        throw new Error('spec.mapping is required');
    }

    if (!spec.mapping.x) {
        throw new Error('spec.mapping.x is required');
    }

    if (
        spec.position !== undefined &&
        spec.position !== 'stack' &&
        spec.position !== 'dodge' &&
        spec.position !== 'identity' &&
        spec.position !== 'fill'
    ) {
        throw new Error(
            "spec.position must be 'stack', 'dodge', 'identity', or 'fill'"
        );
    }

    if (
        spec.orientation !== undefined &&
        spec.orientation !== 'vertical' &&
        spec.orientation !== 'horizontal'
    ) {
        throw new Error("spec.orientation must be 'vertical' or 'horizontal'");
    }

    const colors = spec.scales?.fill?.colors;
    if (colors !== undefined) {
        if (
            colors === null ||
            typeof colors !== 'object' ||
            Array.isArray(colors)
        ) {
            throw new Error('scales.fill.colors must be a plain object');
        }
    }
}
