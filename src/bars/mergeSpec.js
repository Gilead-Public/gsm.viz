import defaults from './defaults.js';

/**
 * Deep-merge user spec with defaults.
 * User values take precedence. Only merges plain objects one level deep
 * for known keys (scales, labels, theme); everything else is overwritten.
 *
 * @param {Array}  data - user-supplied data array (already validated)
 * @param {Object} spec - user-supplied spec (already validated)
 * @returns {Object} merged spec
 */
export default function mergeSpec(data, spec) {
    return {
        data,
        mapping: { ...spec.mapping },
        orientation: spec.orientation ?? defaults.orientation,
        position: spec.position ?? defaults.position,
        scales: {
            x: { ...defaults.scales.x, ...spec.scales?.x },
            y: { ...defaults.scales.y, ...spec.scales?.y },
            fill: { ...defaults.scales.fill, ...spec.scales?.fill },
        },
        labels: { ...defaults.labels, ...spec.labels },
        theme: { ...defaults.theme, ...spec.theme },
    };
}
