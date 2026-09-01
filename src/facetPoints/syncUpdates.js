import getDatasetIdentity from '../points/datasetIdentity.js';
import { refreshFacetAccessibleLabel } from './accessibility.js';
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
    refreshFacetAccessibleLabel(chart);
    syncHover(charts);
    syncSelection(charts);
    syncLegendClicks(charts, { sync: legend.sync });
}

/**
 * Keep the initial facet style domain and synchronization after local updates.
 *
 * @param {Object[]} charts - Child points charts.
 * @param {Object[]} templates - Initial global point dataset templates.
 * @param {Object} legend - Merged facet legend options.
 */
export default function syncUpdates(charts, templates, legend) {
    charts.forEach((chart) => {
        ['updateData', 'updateSpec'].forEach((name) => {
            const update = chart.helpers[name];

            chart.helpers[name] = function (chartInstance, ...args) {
                const hidden = getHiddenIdentities(chartInstance);
                const result = update.call(this, chartInstance, ...args);
                decorateChart(chartInstance, charts, templates, legend, hidden);
                return result;
            };
        });
    });
}
