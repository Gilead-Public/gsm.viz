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

    if (
        spec.nCategories !== undefined &&
        (typeof spec.nCategories !== 'number' ||
            !Number.isInteger(spec.nCategories) ||
            spec.nCategories < 1)
    ) {
        throw new Error('spec.nCategories must be a positive integer');
    }

    const xSort = spec.scales?.x?.sort;
    if (xSort !== undefined && xSort !== 'total' && xSort !== 'alphanumeric') {
        throw new Error("spec.scales.x.sort must be 'total' or 'alphanumeric'");
    }

    const colors = spec.scales?.fill?.colors;
    if (colors !== undefined) {
        if (
            colors === null ||
            typeof colors !== 'object' ||
            Array.isArray(colors) ||
            (Object.getPrototypeOf(colors) !== Object.prototype &&
                Object.getPrototypeOf(colors) !== null)
        ) {
            throw new Error('scales.fill.colors must be a plain object');
        }
    }

    const callbacks = spec.callbacks;
    if (callbacks !== undefined) {
        if (
            callbacks === null ||
            typeof callbacks !== 'object' ||
            Array.isArray(callbacks) ||
            (Object.getPrototypeOf(callbacks) !== Object.prototype &&
                Object.getPrototypeOf(callbacks) !== null)
        ) {
            throw new Error('spec.callbacks must be a plain object');
        }
        if (
            callbacks.onClick !== undefined &&
            callbacks.onClick !== null &&
            typeof callbacks.onClick !== 'function'
        ) {
            throw new Error(
                'spec.callbacks.onClick must be a function or null'
            );
        }
        if (
            callbacks.onHover !== undefined &&
            callbacks.onHover !== null &&
            typeof callbacks.onHover !== 'function'
        ) {
            throw new Error(
                'spec.callbacks.onHover must be a function or null'
            );
        }
    }

    const captions = spec.labels?.captions;
    if (captions !== undefined && captions !== null) {
        const isValidString = typeof captions === 'string';
        const isValidStringArray =
            Array.isArray(captions) &&
            captions.every((item) => typeof item === 'string');
        if (!isValidString && !isValidStringArray) {
            throw new Error(
                'spec.labels.captions must be a string or an array of strings'
            );
        }
    }

    const captionsOptions = spec.labels?.captionsOptions;
    if (captionsOptions !== undefined) {
        if (
            captionsOptions === null ||
            typeof captionsOptions !== 'object' ||
            Array.isArray(captionsOptions) ||
            (Object.getPrototypeOf(captionsOptions) !== Object.prototype &&
                Object.getPrototypeOf(captionsOptions) !== null)
        ) {
            throw new Error(
                'spec.labels.captionsOptions must be a plain object'
            );
        }
    }
}
