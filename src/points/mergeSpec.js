import defaults from './defaults.js';

function mergeDefaults(defaultValues, userValues = {}) {
    return Object.keys(defaultValues).reduce((merged, field) => {
        merged[field] =
            userValues[field] === undefined
                ? defaultValues[field]
                : userValues[field];
        return merged;
    }, {});
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
        },
        labels: mergeDefaults(defaults.labels, spec.labels),
        tooltip: mergeDefaults(defaults.tooltip, spec.tooltip),
        callbacks: mergeDefaults(defaults.callbacks, spec.callbacks),
        selection: mergeDefaults(defaults.selection, spec.selection),
        theme: mergeDefaults(defaults.theme, spec.theme),
    };
}
