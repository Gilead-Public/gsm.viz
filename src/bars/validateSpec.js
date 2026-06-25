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

    const xSortDir = spec.scales?.x?.sortDir;
    if (xSortDir !== undefined && xSortDir !== 'asc' && xSortDir !== 'desc') {
        throw new Error("spec.scales.x.sortDir must be 'asc' or 'desc'");
    }

    const xGrid = spec.scales?.x?.grid;
    if (xGrid !== undefined && typeof xGrid !== 'boolean') {
        throw new Error('spec.scales.x.grid must be a boolean');
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

    function validateFormatter(value, path) {
        if (
            value !== undefined &&
            typeof value !== 'string' &&
            typeof value !== 'function'
        ) {
            throw new Error(`${path} must be a string or function`);
        }
    }

    validateFormatter(
        spec.annotations?.labels?.segment?.formatter,
        'spec.annotations.labels.segment.formatter'
    );
    validateFormatter(
        spec.annotations?.labels?.total?.formatter,
        'spec.annotations.labels.total.formatter'
    );

    const referenceLines = spec.annotations?.referenceLines;
    if (referenceLines !== undefined) {
        if (!Array.isArray(referenceLines)) {
            throw new Error('spec.annotations.referenceLines must be an array');
        }

        referenceLines.forEach((line, i) => {
            const prefix = `spec.annotations.referenceLines[${i}]`;

            if (
                line === null ||
                typeof line !== 'object' ||
                Array.isArray(line) ||
                (Object.getPrototypeOf(line) !== Object.prototype &&
                    Object.getPrototypeOf(line) !== null)
            ) {
                throw new Error(`${prefix} must be a plain object`);
            }

            if (!Number.isFinite(line.value)) {
                throw new Error(
                    `${prefix}.value is required and must be a finite number`
                );
            }

            if (
                line.label !== undefined &&
                line.label !== null &&
                typeof line.label !== 'string'
            ) {
                throw new Error(`${prefix}.label must be a string`);
            }

            if (line.color !== undefined && typeof line.color !== 'string') {
                throw new Error(`${prefix}.color must be a string`);
            }

            if (
                line.lineWidth !== undefined &&
                (!Number.isFinite(line.lineWidth) || line.lineWidth <= 0)
            ) {
                throw new Error(
                    `${prefix}.lineWidth must be a positive number`
                );
            }

            if (line.lineDash !== undefined) {
                if (
                    !Array.isArray(line.lineDash) ||
                    !line.lineDash.every((n) => Number.isFinite(n) && n >= 0)
                ) {
                    throw new Error(
                        `${prefix}.lineDash must be an array of non-negative numbers`
                    );
                }
            }

            if (
                line.labelPosition !== undefined &&
                line.labelPosition !== 'start' &&
                line.labelPosition !== 'center' &&
                line.labelPosition !== 'end'
            ) {
                throw new Error(
                    `${prefix}.labelPosition must be 'start', 'center', or 'end'`
                );
            }
        });
    }

    const zoom = spec.zoom;
    if (zoom !== undefined) {
        if (
            zoom === null ||
            typeof zoom !== 'object' ||
            Array.isArray(zoom) ||
            (Object.getPrototypeOf(zoom) !== Object.prototype &&
                Object.getPrototypeOf(zoom) !== null)
        ) {
            throw new Error('spec.zoom must be a plain object');
        }

        if (zoom.enabled !== undefined && typeof zoom.enabled !== 'boolean') {
            throw new Error('spec.zoom.enabled must be a boolean');
        }

        if (
            zoom.mode !== undefined &&
            zoom.mode !== 'x' &&
            zoom.mode !== 'y' &&
            zoom.mode !== 'xy'
        ) {
            throw new Error("spec.zoom.mode must be 'x', 'y', or 'xy'");
        }

        if (zoom.pan !== undefined && typeof zoom.pan !== 'boolean') {
            throw new Error('spec.zoom.pan must be a boolean');
        }

        if (zoom.wheel !== undefined && typeof zoom.wheel !== 'boolean') {
            throw new Error('spec.zoom.wheel must be a boolean');
        }

        if (zoom.pinch !== undefined && typeof zoom.pinch !== 'boolean') {
            throw new Error('spec.zoom.pinch must be a boolean');
        }
    }

    const legend = spec.legend;
    if (legend !== undefined) {
        if (
            legend === null ||
            typeof legend !== 'object' ||
            Array.isArray(legend) ||
            (Object.getPrototypeOf(legend) !== Object.prototype &&
                Object.getPrototypeOf(legend) !== null)
        ) {
            throw new Error('spec.legend must be a plain object');
        }

        if (legend.dense !== undefined && typeof legend.dense !== 'boolean') {
            throw new Error('spec.legend.dense must be a boolean');
        }
    }
}
