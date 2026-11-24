import defaults from './defaults.js';

/**
 * Merge a validated user spec with the defaults.
 *
 * @param {Object} spec - user-supplied spec (already validated)
 * @returns {Object} merged spec
 */
export default function mergeSpec(spec) {
    return {
        studyId: spec.studyId,
        groupLevel: spec.groupLevel,
        groupId: spec.groupId,
        snapshotDate: spec.snapshotDate,
        layout: spec.layout ?? defaults.layout,
        fields: [...(spec.fields ?? defaults.fields)],
        labels: { ...spec.labels },
        format: { ...defaults.format, ...spec.format },
        unavailable: { ...defaults.unavailable, ...spec.unavailable },
    };
}
