import structureData from '../points/structureData.js';
import getDatasetIdentity from '../points/datasetIdentity.js';
import { normalizeFacetValue } from './splitData.js';

function getRenderedRows(facets, spec) {
    return spec.data.filter((row) =>
        facets.has(normalizeFacetValue(row?.[spec.facet.field]))
    );
}

function getKey(value) {
    return value === null ? 'missing' : JSON.stringify([typeof value, value]);
}

function isMissing(value) {
    return (
        value === undefined ||
        value === null ||
        (typeof value === 'string' && value.trim().length === 0) ||
        (typeof value === 'number' && Number.isNaN(value))
    );
}

// Source-ordered levels; invalid values are left for structureData to reject.
function getObservedLevels(rows, field) {
    return rows
        .map((row) => row?.[field])
        .map((value) => (isMissing(value) ? null : value))
        .filter(
            (value) =>
                value === null ||
                typeof value === 'string' ||
                (typeof value === 'number' && Number.isFinite(value))
        );
}

function resolveOrder(order, observed) {
    const result = [];
    const seen = new Set();
    const add = (value) => {
        const key = getKey(value);
        if (!seen.has(key)) {
            seen.add(key);
            result.push(value);
        }
    };

    order.forEach(add);
    observed.forEach(add);
    return result;
}
function getRange(datasets, field) {
    // Spreading large row sets into Math.min/max overflows the call stack.
    let min = Infinity;
    let max = -Infinity;
    datasets.forEach((dataset) =>
        dataset.data.forEach((point) => {
            const value = point[field];
            if (value < min) min = value;
            if (value > max) max = value;
        })
    );

    return min === Infinity ? undefined : [min, max];
}

function makeTemplate(dataset) {
    return Object.entries(dataset).reduce((template, [key, value]) => {
        template[key] =
            key === 'data' ? [] : Array.isArray(value) ? [...value] : value;
        return template;
    }, {});
}

/**
 * Resolve global aesthetic order and point-dataset legend templates.
 *
 * @param {Map<*, Array>} facets - Rendered facet rows.
 * @param {Object} spec - Merged facet points spec.
 * @returns {{templates: Array, colorOrder: Array, shapeOrder: Array, sizeDomain?: number[], opacityDomain?: number[]}}
 */
export function getGlobalStyles(facets, spec) {
    const rows = getRenderedRows(facets, spec);
    const colorOrder = spec.mapping.color
        ? resolveOrder(
              spec.scales.color.order,
              getObservedLevels(rows, spec.mapping.color)
          )
        : [...spec.scales.color.order];
    const shapeOrder = spec.mapping.shape
        ? resolveOrder(
              spec.scales.shape.order,
              getObservedLevels(rows, spec.mapping.shape)
          )
        : [...spec.scales.shape.order];

    // Templates use the same source-ordered domains as the child specs.
    const datasets = structureData({
        ...spec,
        data: rows,
        mapping: { ...spec.mapping, key: undefined },
        scales: {
            ...spec.scales,
            color: { ...spec.scales.color, order: colorOrder },
            shape: { ...spec.scales.shape, order: shapeOrder },
        },
    }).datasets;

    return {
        templates: datasets.map(makeTemplate),
        colorOrder,
        shapeOrder,
        ...(spec.mapping.size
            ? { sizeDomain: getRange(datasets, '_size') }
            : {}),
        ...(spec.mapping.opacity
            ? { opacityDomain: getRange(datasets, '_opacity') }
            : {}),
    };
}
function cloneGhost(template) {
    return Object.entries(template).reduce(
        (dataset, [key, value]) => {
            dataset[key] =
                key === 'data' ? [] : Array.isArray(value) ? [...value] : value;
            return dataset;
        },
        { _facetGhost: true }
    );
}

/**
 * Align one child chart's point datasets to the global style templates.
 *
 * @param {Object} chart - Child points chart.
 * @param {Array} templates - Global point dataset templates.
 * @param {Set<string>} [hiddenIdentities] - Identities hidden before an update.
 */
export function applyGlobalStyles(
    chart,
    templates,
    hiddenIdentities = new Set()
) {
    const pointDatasets = chart.data.datasets.filter(
        (dataset) => !dataset._annotation
    );
    const annotationDatasets = chart.data.datasets.filter(
        (dataset) => dataset._annotation
    );
    const byIdentity = new Map();

    pointDatasets.forEach((dataset) => {
        const identity = getDatasetIdentity(dataset, chart.data._spec_);
        if (byIdentity.has(identity)) {
            throw new Error(
                `facetPoints found duplicate point dataset identity ${identity}`
            );
        }
        byIdentity.set(identity, dataset);
    });

    const templateIdentities = new Set(
        templates.map((template) =>
            getDatasetIdentity(template, chart.data._spec_)
        )
    );
    const unexpected = [...byIdentity.keys()].find(
        (identity) => !templateIdentities.has(identity)
    );
    if (unexpected !== undefined) {
        throw new Error(
            `facetPoints could not resolve point dataset identity ${unexpected}`
        );
    }

    const orderedPointDatasets = templates.map((template) => {
        const identity = getDatasetIdentity(template, chart.data._spec_);
        return byIdentity.get(identity) || cloneGhost(template);
    });

    chart.data.datasets = [...orderedPointDatasets, ...annotationDatasets];
    orderedPointDatasets.forEach((dataset, index) => {
        chart.setDatasetVisibility(
            index,
            !hiddenIdentities.has(
                getDatasetIdentity(dataset, chart.data._spec_)
            )
        );
    });
    chart.update('none');
}
