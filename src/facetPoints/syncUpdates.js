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
 * @param {Object[]} templates - Initial global point dataset templates.
 * @param {Object} legend - Merged facet legend options.
 * @param {Array} facetValues - Typed facet identity for each child chart.
 */
export default function syncUpdates(charts, templates, legend, facetValues) {
    charts.forEach((chart, chartIndex) => {
        const specIndex = { updateData: 1, updateSpec: 0 };

        ['updateData', 'updateSpec'].forEach((name) => {
            const update = chart.helpers[name];

            chart.helpers[name] = function (chartInstance, ...args) {
                const hidden = getHiddenIdentities(chartInstance);
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
