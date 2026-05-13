import defaults from "./defaults.js";

/**
 * Deep-merge user spec with defaults.
 * User values take precedence. Only merges plain objects one level deep
 * for known keys (scales, labels, theme); everything else is overwritten.
 *
 * @param {Object} spec - user-supplied spec (already validated)
 * @returns {Object} merged spec
 */
export default function mergeSpec(spec) {
  return {
    data: spec.data,
    mapping: { ...spec.mapping },
    orientation: spec.orientation ?? defaults.orientation,
    scales: {
      x: { ...defaults.scales.x, ...spec.scales?.x },
      y: { ...defaults.scales.y, ...spec.scales?.y },
    },
    labels: { ...defaults.labels, ...spec.labels },
    theme: { ...defaults.theme, ...spec.theme },
  };
}
