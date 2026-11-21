import defaults from './defaults.js';

/**
 * Merge the user spec with the metricDistribution defaults.
 *
 * @param {Object} [spec] - validated user spec
 * @returns {Object} merged spec
 */
export default function mergeSpec(spec = {}) {
    return {
        sections: spec.sections,
        values: spec.values,
        labels: { ...spec.labels },
        topN: spec.topN ?? defaults.topN,
        colors: { ...spec.colors },
        theme: { ...defaults.theme, ...spec.theme },
    };
}
