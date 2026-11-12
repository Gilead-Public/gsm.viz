import getDatasetIdentity from '../points/datasetIdentity.js';
import { wrapCallback } from './buildSubSpec.js';
import { applyGlobalStyles } from './globalStyles.js';
import syncHover from './syncHover.js';
import syncLegendClicks from './syncLegendClicks.js';
import syncSelection from './syncSelection.js';

function getHiddenIdentities(chart) {
    const hidden = new Set();

    chart.data.datasets.forEach((dataset, index) => {
        if (dataset._annotation || chart.isDatasetVisible(index)) return;

        const identity = getDatasetIdentity(dataset, chart.data._spec_);
        if (identity !== undefined) hidden.add(identity);
    });

    return hidden;
}

function decorateChart(chart, charts, templates, legend, hidden) {
    chart.options.plugins.legend.display =
        legend.display && chart.options.plugins.legend.display;
    applyGlobalStyles(chart, templates, hidden);
    syncHover(charts);
    syncSelection(charts);
    syncLegendClicks(charts, { sync: legend.sync });
}

const CALLBACK_NAMES = ['onClick', 'onHover', 'onSelect'];

function withScale(scales, name, key, value) {
    if (value === undefined || scales[name]?.[key] !== undefined) return;
    scales[name] = { ...scales[name], [key]: [...value] };
}

// A replacement spec would otherwise rebuild styles from local rows only.
function injectGlobalStyles(spec, globalStyles, mapping) {
    if (!spec || typeof spec !== 'object') return spec;

    const scales = { ...spec.scales };
    const sameField = (aesthetic) =>
        mapping[aesthetic] !== undefined &&
        spec.mapping?.[aesthetic] === mapping[aesthetic];

    if (sameField('color')) {
        withScale(scales, 'color', 'order', globalStyles.colorOrder);
    }
    if (sameField('shape')) {
        withScale(scales, 'shape', 'order', globalStyles.shapeOrder);
    }
    if (sameField('size')) {
        withScale(scales, 'size', 'domain', globalStyles.sizeDomain);
    }
    if (sameField('opacity')) {
        withScale(scales, 'opacity', 'domain', globalStyles.opacityDomain);
    }
    return { ...spec, scales };
}

// Callbacks supplied by a later update still receive the facet value.
function wrapSpecCallbacks(spec, facetValue) {
    if (!spec?.callbacks) return spec;

    const callbacks = { ...spec.callbacks };
    CALLBACK_NAMES.forEach((name) => {
        if (typeof callbacks[name] === 'function') {
            callbacks[name] = wrapCallback(callbacks[name], facetValue);
        }
    });
    return { ...spec, callbacks };
}

/**
 * Keep the initial facet style domain and synchronization after local updates.
 *
 * @param {Object[]} charts - Child points charts.
 * @param {Object} globalStyles - Initial global templates, orders, and domains.
 * @param {Object} legend - Merged facet legend options.
 * @param {Array} facetValues - Typed facet identity for each child chart.
 * @param {Object} mapping - Merged facet mapping used for the global styles.
 */
export default function syncUpdates(
    charts,
    globalStyles,
    legend,
    facetValues,
    mapping
) {
    const { templates } = globalStyles;

    charts.forEach((chart, chartIndex) => {
        const specIndex = { updateData: 1, updateSpec: 0 };

        ['updateData', 'updateSpec'].forEach((name) => {
            const update = chart.helpers[name];

            chart.helpers[name] = function (chartInstance, ...args) {
                const hidden = getHiddenIdentities(chartInstance);
                if (name === 'updateData') {
                    args[1] = injectGlobalStyles(
                        args[1],
                        globalStyles,
                        mapping
                    );
                }
                args[specIndex[name]] = wrapSpecCallbacks(
                    args[specIndex[name]],
                    facetValues[chartIndex]
                );
                const result = update.call(this, chartInstance, ...args);
                decorateChart(chartInstance, charts, templates, legend, hidden);
                return result;
            };
        });
    });
}
