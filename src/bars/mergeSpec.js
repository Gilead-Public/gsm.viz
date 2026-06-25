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
    const labelModes = defaults.annotations.labels;
    const userLabels = spec.annotations?.labels || {};

    return {
        data,
        mapping: { ...spec.mapping },
        interactive: spec.interactive ?? defaults.interactive,
        orientation: spec.orientation ?? defaults.orientation,
        position: spec.position ?? defaults.position,
        nCategories: spec.nCategories,
        scales: {
            x: { ...defaults.scales.x, ...spec.scales?.x },
            y: { ...defaults.scales.y, ...spec.scales?.y },
            fill: { ...defaults.scales.fill, ...spec.scales?.fill },
        },
        labels: { ...defaults.labels, ...spec.labels },
        annotations: {
            ...defaults.annotations,
            ...spec.annotations,
            labels: {
                segment: {
                    ...labelModes.segment,
                    ...userLabels.segment,
                },
                total: {
                    ...labelModes.total,
                    ...userLabels.total,
                },
                inside: {
                    ...labelModes.inside,
                    ...userLabels.inside,
                },
                outside: {
                    ...labelModes.outside,
                    ...userLabels.outside,
                },
            },
        },
        theme: { ...defaults.theme, ...spec.theme },
        tooltip: { ...defaults.tooltip, ...spec.tooltip },
        zoom: { ...defaults.zoom, ...spec.zoom },
        callbacks: {
            onClick: spec.callbacks?.onClick ?? defaults.callbacks.onClick,
            onHover: spec.callbacks?.onHover ?? defaults.callbacks.onHover,
        },
    };
}
