import structureData from '../points/structureData.js';
import getDatasetIdentity from '../points/datasetIdentity.js';
import { normalizeFacetValue } from './splitData.js';

function getRenderedRows(facets, spec) {
    return spec.data.filter((row) =>
        facets.has(normalizeFacetValue(row?.[spec.facet.field]))
    );
}

function getValue(dataset, aesthetic) {
    if (!Object.prototype.hasOwnProperty.call(dataset, `_${aesthetic}`)) {
        return undefined;
    }
    return dataset[`_${aesthetic}Missing`] ? null : dataset[`_${aesthetic}`];
}

function getKey(value) {
    return value === null ? 'missing' : JSON.stringify([typeof value, value]);
}

function resolveOrder(order, templates, aesthetic) {
    const result = [];
    const seen = new Set();
    const add = (value) => {
        if (value === undefined) return;
        const key = getKey(value);
        if (!seen.has(key)) {
            seen.add(key);
            result.push(value);
        }
    };

    order.forEach(add);
    templates.forEach((dataset) => add(getValue(dataset, aesthetic)));
    return result;
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
 * @returns {{templates: Array, colorOrder: Array, shapeOrder: Array}}
 */
export function getGlobalStyles(facets, spec) {
    const mapping = { ...spec.mapping, key: undefined };
    const datasets = structureData({
        ...spec,
        data: getRenderedRows(facets, spec),
        mapping,
    }).datasets;
    const templates = datasets.map(makeTemplate);

    return {
        templates,
        colorOrder: resolveOrder(spec.scales.color.order, templates, 'color'),
        shapeOrder: resolveOrder(spec.scales.shape.order, templates, 'shape'),
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
