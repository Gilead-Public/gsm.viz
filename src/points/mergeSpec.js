import defaults from './defaults.js';

function mergeDefaults(defaultValues, userValues = {}) {
    return Object.keys(defaultValues).reduce((merged, field) => {
        const value =
            userValues[field] === undefined
                ? defaultValues[field]
                : userValues[field];
        merged[field] = Array.isArray(value)
            ? [...value]
            : value !== null && typeof value === 'object'
            ? { ...value }
            : value;
        return merged;
    }, {});
}

function mergeTooltip(tooltip = {}) {
    return {
        ...tooltip,
        ...mergeDefaults(defaults.tooltip, tooltip),
        ...(tooltip.callbacks ? { callbacks: { ...tooltip.callbacks } } : {}),
    };
}

function mergeAnnotations(annotations = {}) {
    const referenceLines =
        annotations.referenceLines === undefined
            ? defaults.annotations.referenceLines
            : annotations.referenceLines;
    const lines =
        annotations.lines === undefined
            ? defaults.annotations.lines
            : annotations.lines;
    const pointLabel =
        annotations.labels?.point === undefined
            ? defaults.annotations.labels.point
            : annotations.labels.point;

    return {
        referenceLines: referenceLines.map((line) => ({
            ...line,
            ...(line.dash ? { dash: [...line.dash] } : {}),
        })),
        lines: lines.map((line) => ({
            ...line,
            data: [...line.data],
            mapping: { ...line.mapping },
            ...(line.order ? { order: [...line.order] } : {}),
            ...(line.colors ? { colors: { ...line.colors } } : {}),
            ...(line.palette ? { palette: [...line.palette] } : {}),
            ...(line.dash ? { dash: [...line.dash] } : {}),
        })),
        labels: {
            point:
                pointLabel === null || pointLabel === false
                    ? pointLabel
                    : {
                          ...pointLabel,
                          ...(pointLabel.font
                              ? { font: { ...pointLabel.font } }
                              : {}),
                      },
        },
    };
}

/**
 * Merge a validated points spec with module defaults without mutating inputs.
 *
 * @param {Array} data - Source rows.
 * @param {Object} spec - Validated point chart specification.
 * @returns {Object} Merged point chart specification.
 */
export default function mergeSpec(data, spec) {
    return {
        data,
        mapping: { ...spec.mapping },
        scales: {
            x: mergeDefaults(defaults.scales.x, spec.scales?.x),
            y: mergeDefaults(defaults.scales.y, spec.scales?.y),
            color: mergeDefaults(defaults.scales.color, spec.scales?.color),
            size: mergeDefaults(defaults.scales.size, spec.scales?.size),
            opacity: mergeDefaults(
                defaults.scales.opacity,
                spec.scales?.opacity
            ),
            shape: mergeDefaults(defaults.scales.shape, spec.scales?.shape),
        },
        labels: mergeDefaults(defaults.labels, spec.labels),
        annotations: mergeAnnotations(spec.annotations),
        tooltip: mergeTooltip(spec.tooltip),
        callbacks: mergeDefaults(defaults.callbacks, spec.callbacks),
        selection: mergeDefaults(defaults.selection, spec.selection),
        zoom: mergeDefaults(defaults.zoom, spec.zoom),
        theme: mergeDefaults(defaults.theme, spec.theme),
    };
}
