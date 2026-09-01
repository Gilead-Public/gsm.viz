import mergePointsSpec from '../points/mergeSpec.js';
import defaults from './defaults.js';

/**
 * Immutably merge points and facet defaults.
 *
 * @param {Array} data - Source rows.
 * @param {Object} spec - Validated facet points spec.
 * @returns {Object} Complete internal specification.
 */
export default function mergeSpec(data, spec) {
    const { facet: userFacet, ...pointsSpec } = spec;
    const points = mergePointsSpec(data, pointsSpec);

    return {
        ...points,
        facet: {
            field: userFacet.field,
            order:
                userFacet.order === undefined
                    ? undefined
                    : [...userFacet.order],
            nCol: userFacet.nCol,
            chartHeight: userFacet.chartHeight,
            label: {
                ...defaults.facet.label,
                ...(userFacet.label || {}),
            },
            scales: {
                x: {
                    ...defaults.facet.scales.x,
                    ...(userFacet.scales?.x || {}),
                },
                y: {
                    ...defaults.facet.scales.y,
                    ...(userFacet.scales?.y || {}),
                },
            },
        },
    };
}
