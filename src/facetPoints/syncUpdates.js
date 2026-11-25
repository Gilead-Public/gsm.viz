import getDatasetIdentity from '../points/datasetIdentity.js';
import { wrapCallback } from './buildSubSpec.js';
import getLegendIdentity from './legendIdentity.js';
import buildState from '../points/buildState.js';
import { getUpdateSpec } from '../points/updateSpec.js';
import { applyGlobalStyles } from './globalStyles.js';
import syncHover from './syncHover.js';
import syncLegendClicks from './syncLegendClicks.js';
import syncSelection, { propagateDroppedSelection } from './syncSelection.js';

function getHiddenIdentities(chart) {
    const hidden = new Set();

    chart.data.datasets.forEach((_dataset, index) => {
        if (!chart.isDatasetVisible(index)) {
            hidden.add(getLegendIdentity(chart, index));
        }
    });

    return hidden;
}

function decorateChart(chart, charts, templates, legend, hidden) {
    chart.options.plugins.legend.display =
        legend.display && chart.options.plugins.legend.display;
    applyGlobalStyles(chart, templates, hidden);
    const activeCharts = charts.filter((sibling) => sibling.canvas);
    syncHover(activeCharts);
    syncSelection(activeCharts);
    syncLegendClicks(activeCharts, { sync: legend.sync });
}

function validateUpdate(chart, name, args, templates, mapping) {
    let data;
    let spec;

    if (name === 'updateData') {
        const { data: _data, ...storedSpec } = chart.data._spec_;
        data = args[0];
        spec = args[1] === undefined ? storedSpec : args[1];
    } else {
        ({ data, spec } = getUpdateSpec(chart, args[0]));
    }

    const state = buildState(data, spec);
    if (
        ['color', 'shape'].some(
            (aesthetic) => spec.mapping?.[aesthetic] !== mapping[aesthetic]
        )
    ) {
        throw new Error(
            'facetPoints child updates cannot change color or shape mappings'
        );
    }

    const templatesByIdentity = new Map(
        templates.map((template) => [
            getDatasetIdentity(template, state.merged),
            template,
        ])
    );
    const pointDatasets = state.chartData.datasets.filter(
        (dataset) => !dataset._annotation
    );
    const identities = pointDatasets.map((dataset) =>
        getDatasetIdentity(dataset, state.merged)
    );
    const unexpected = identities.find(
        (identity) => !templatesByIdentity.has(identity)
    );

    if (unexpected !== undefined) {
        throw new Error(
            `facetPoints could not resolve point dataset identity ${unexpected}`
        );
    }

    // Ghosts and legend order come from the templates, so a local restyle or
    // reorder would give distinct groups the same style across panels.
    const templateOrder = [...templatesByIdentity.keys()];
    const ranks = identities.map((identity) => templateOrder.indexOf(identity));
    const reordered = ranks.some((rank, index) => rank < ranks[index - 1]);
    const restyled = pointDatasets.some((dataset, index) => {
        const template = templatesByIdentity.get(identities[index]);
        return (
            getBaseColor(dataset) !== getBaseColor(template) ||
            dataset.pointStyle !== template.pointStyle
        );
    });

    if (reordered || restyled) {
        throw new Error(
            'facetPoints child updates cannot change shared color or shape styles or order; reinvoke facetPoints to restyle the grid'
        );
    }
}

function getBaseColor(dataset) {
    return dataset._baseColor ?? dataset.backgroundColor;
}

const CALLBACK_NAMES = ['onClick', 'onHover', 'onSelect'];

function isPlainObject(value) {
    if (value === null || typeof value !== 'object' || Array.isArray(value)) {
        return false;
    }

    const prototype = Object.getPrototypeOf(value);
    return prototype === Object.prototype || prototype === null;
}

function getSharedScales(globalStyles, globalScales) {
    return [
        globalScales.xMin !== undefined && {
            aesthetic: 'x',
            key: 'range',
            value: [globalScales.xMin, globalScales.xMax],
        },
        globalScales.yMin !== undefined && {
            aesthetic: 'y',
            key: 'range',
            value: [globalScales.yMin, globalScales.yMax],
        },
        { aesthetic: 'color', key: 'order', value: globalStyles.colorOrder },
        { aesthetic: 'shape', key: 'order', value: globalStyles.shapeOrder },
        { aesthetic: 'size', key: 'domain', value: globalStyles.sizeDomain },
        {
            aesthetic: 'opacity',
            key: 'domain',
            value: globalStyles.opacityDomain,
        },
    ].filter((shared) => shared && shared.value !== undefined);
}

function isSameField(spec, mapping, aesthetic) {
    return (
        mapping[aesthetic] !== undefined &&
        spec.mapping?.[aesthetic] === mapping[aesthetic]
    );
}

// Shared values follow the original field; an explicit update value wins.
// Inherited values are dropped only by the update that leaves that field.
function alignSharedScales(spec, resolved, current, sharedScales, mapping) {
    if (!isPlainObject(spec)) return spec;
    if (spec.scales !== undefined && !isPlainObject(spec.scales)) return spec;

    const scales = { ...spec.scales };
    sharedScales.forEach(({ aesthetic, key, value }) => {
        const scale = scales[aesthetic];
        if (scale !== undefined && !isPlainObject(scale)) return;
        if (scale?.[key] !== undefined) return;

        if (isSameField(resolved, mapping, aesthetic)) {
            if (resolved.scales?.[aesthetic]?.[key] === undefined) {
                scales[aesthetic] = { ...scale, [key]: [...value] };
            }
        } else if (
            current !== undefined &&
            isSameField(current, mapping, aesthetic) &&
            resolved.scales?.[aesthetic]?.[key] !== undefined
        ) {
            scales[aesthetic] = { ...scale, [key]: undefined };
        }
    });
    return { ...spec, scales };
}

// Replacement specs and partial specs resolve against different baselines.
function withSharedScales(chart, name, spec, sharedScales, mapping) {
    if (name === 'updateData') {
        return alignSharedScales(spec, spec, undefined, sharedScales, mapping);
    }
    if (!isPlainObject(spec)) return spec;

    const { spec: resolved } = getUpdateSpec(chart, spec);
    return alignSharedScales(
        spec,
        resolved,
        chart.data._spec_,
        sharedScales,
        mapping
    );
}

// Callbacks supplied by a later update still receive the facet value.
function wrapSpecCallbacks(spec, facetValue) {
    if (!isPlainObject(spec) || !isPlainObject(spec.callbacks)) return spec;

    const callbacks = { ...spec.callbacks };
    CALLBACK_NAMES.forEach((name) => {
        if (typeof callbacks[name] === 'function') {
            callbacks[name] = wrapCallback(callbacks[name], facetValue);
        }
    });
    return { ...spec, callbacks };
}

/**
 * Keep shared facet scales and synchronization after local updates.
 *
 * @param {Object[]} charts - Child points charts.
 * @param {Object} globalStyles - Initial global templates, orders, and domains.
 * @param {Object} globalScales - Initial fixed axis bounds.
 * @param {Object} legend - Merged facet legend options.
 * @param {Array} facetValues - Typed facet identity for each child chart.
 * @param {Object} mapping - Merged facet mapping used for the global styles.
 */
export default function syncUpdates(
    charts,
    globalStyles,
    globalScales,
    legend,
    facetValues,
    mapping
) {
    const { templates } = globalStyles;
    const sharedScales = getSharedScales(globalStyles, globalScales);

    charts.forEach((chart, chartIndex) => {
        const specIndex = { updateData: 1, updateSpec: 0 };

        ['updateData', 'updateSpec'].forEach((name) => {
            const update = chart.helpers[name];

            chart.helpers[name] = function (chartInstance, ...args) {
                const index = specIndex[name];
                args[index] = withSharedScales(
                    chartInstance,
                    name,
                    args[index],
                    sharedScales,
                    mapping
                );
                validateUpdate(chartInstance, name, args, templates, mapping);
                const hidden = getHiddenIdentities(chartInstance);
                args[index] = wrapSpecCallbacks(
                    args[index],
                    facetValues[chartIndex]
                );
                const result = update.call(this, chartInstance, ...args);
                propagateDroppedSelection(charts, chartInstance);
                decorateChart(chartInstance, charts, templates, legend, hidden);
                return result;
            };
        });
    });
}
