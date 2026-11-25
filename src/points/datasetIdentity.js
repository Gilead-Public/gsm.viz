function encodeLevel(value, missing) {
    return missing ? ['missing'] : ['value', typeof value, String(value)];
}

/**
 * Encode a point dataset's mapped aesthetic identity without label coercion.
 *
 * @param {Object} dataset - Chart.js dataset.
 * @param {Object} spec - Merged points spec.
 * @returns {string|undefined} Stable identity, excluding annotations.
 */
export default function getDatasetIdentity(dataset, spec) {
    if (dataset._annotation) return undefined;

    return JSON.stringify([
        'points',
        spec.mapping.color
            ? [
                  spec.mapping.color,
                  ...encodeLevel(dataset._color, dataset._colorMissing),
              ]
            : null,
        spec.mapping.shape
            ? [
                  spec.mapping.shape,
                  ...encodeLevel(dataset._shape, dataset._shapeMissing),
              ]
            : null,
    ]);
}
