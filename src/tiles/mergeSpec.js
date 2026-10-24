import defaults from './defaults.js';

const isPlainObject = (value) =>
    value !== null && typeof value === 'object' && !Array.isArray(value);

/**
 * Merge a user spec with defaults. Idempotent, so it can be re-applied to an
 * already merged spec.
 *
 * @param {Object} spec - validated user spec
 * @returns {Object} merged spec
 */
export default function mergeSpec(spec) {
    const scales = spec.scales ?? {};
    const expand = spec.expand;

    return {
        mapping: { ...spec.mapping },
        scales: {
            x: { ...defaults.scales.x, ...scales.x },
            y: { ...defaults.scales.y, ...scales.y },
            fill: {
                ...defaults.scales.fill,
                ...scales.fill,
                colors: { ...scales.fill?.colors },
            },
        },
        expand: expand
            ? {
                  data: expand.data,
                  mapping: { ...expand.mapping },
                  scales: {
                      fill: {
                          order: null,
                          label: undefined,
                          ...expand.scales?.fill,
                          colors: { ...expand.scales?.fill?.colors },
                      },
                  },
                  initial: expand.initial ?? [],
                  tooltip: { ...expand.tooltip },
              }
            : null,
        tooltip: { ...spec.tooltip },
        callbacks: {
            onClick: null,
            onRowClick: null,
            onExpand: null,
            ...spec.callbacks,
        },
        rows: { ...defaults.rows, ...spec.rows },
        labels: { ...defaults.labels, ...spec.labels },
        theme: { ...defaults.theme, ...spec.theme },
    };
}

/**
 * Deep-merge plain objects; arrays, functions and scalars in `delta` replace
 * the corresponding value in `target`.
 *
 * @param {Object} target
 * @param {Object} delta
 * @returns {Object} new merged object
 */
export function deepMerge(target, delta) {
    const out = { ...target };
    Object.keys(delta ?? {}).forEach((key) => {
        out[key] =
            isPlainObject(delta[key]) && isPlainObject(target?.[key])
                ? deepMerge(target[key], delta[key])
                : delta[key];
    });
    return out;
}
