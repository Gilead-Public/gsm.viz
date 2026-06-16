import facetDefaults from './defaults.js';
import barsmergeSpec from '../bars/mergeSpec.js';

/**
 * Deep-merge user spec with facetBars defaults.
 *
 * Delegates common bars-level merging to bars/mergeSpec, then overlays the
 * facet-specific configuration on top.
 *
 * @param {Array}  data - user-supplied data array (already validated)
 * @param {Object} spec - user-supplied spec (already validated)
 * @returns {Object} merged spec
 */
export default function mergeSpec(data, spec) {
    // Delegate all bars-level keys to the existing bars merge.
    const barsMerged = barsmergeSpec(data, spec);

    const userFacet = spec.facet ?? {};
    const defaultFacet = facetDefaults.facet;

    const userLabel = userFacet.label ?? {};
    const userScales = userFacet.scales ?? {};
    const userLegend = userFacet.legend ?? {};

    return {
        ...barsMerged,
        facet: {
            field: userFacet.field,
            order: userFacet.order,
            nCol: userFacet.nCol,
            chartHeight: userFacet.chartHeight,
            label: {
                ...defaultFacet.label,
                ...userLabel,
            },
            scales: {
                x: {
                    ...defaultFacet.scales.x,
                    ...(userScales.x ?? {}),
                },
                y: {
                    ...defaultFacet.scales.y,
                    ...(userScales.y ?? {}),
                },
            },
            legend: {
                ...defaultFacet.legend,
                ...userLegend,
            },
        },
    };
}
