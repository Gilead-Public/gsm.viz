import ChartDataLabels from 'chartjs-plugin-datalabels';

import buildState from './buildState.js';
import { setAccessibleLabel } from './accessibility.js';
import getDatasetIdentity from './datasetIdentity.js';
import { syncKeyboardSelection } from './keyboardSelection.js';
import { resetSelectionForUpdate } from './selection.js';

function getHiddenDatasetIdentities(chart) {
    const identities = new Set();

    chart.data.datasets.forEach((dataset, index) => {
        if (!chart.isDatasetVisible(index)) {
            const identity = getDatasetIdentity(dataset, chart.data._spec_);
            if (identity !== undefined) identities.add(identity);
        }
    });

    return identities;
}

function syncDataLabelsPlugin(chart, enabled) {
    const plugins = chart.config.plugins;
    const index = plugins.findIndex((plugin) => plugin.id === 'datalabels');

    if (enabled && index === -1) {
        ChartDataLabels.beforeInit(chart);
        plugins.unshift(ChartDataLabels);
    }
    if (!enabled && index !== -1) {
        plugins.splice(index, 1);
        delete chart.$datalabels;
    }
}

function applyOptions(chart, state) {
    const options = chart.config.options;
    options.animation = state.merged.theme.animation;
    options.maintainAspectRatio = state.merged.theme.maintainAspectRatio;
    options.plugins = state.plugins;
    options.scales = state.scales;

    if (state.interaction) {
        options.interaction = state.interaction;
    } else {
        delete options.interaction;
    }
}

function resetZoomForUpdate(chart) {
    if (chart.isZoomedOrPanned?.()) {
        chart.resetZoom('none');
    }
}

/**
 * Rebuild an existing points chart from validated public inputs.
 *
 * @param {Object} chart - Chart.js chart instance.
 * @param {Array} data - Source point rows.
 * @param {Object} spec - Complete public points specification.
 * @returns {Object} The updated chart instance.
 */
export default function rebuildChart(chart, data, spec) {
    const state = buildState(data, spec);
    const hiddenIdentities = getHiddenDatasetIdentities(chart);

    resetZoomForUpdate(chart);
    resetSelectionForUpdate(chart);
    chart.data.datasets = state.chartData.datasets;
    chart.data._spec_ = state.merged;
    applyOptions(chart, state);
    syncDataLabelsPlugin(chart, !!state.merged.annotations.labels.point);
    setAccessibleLabel(chart.canvas, state.accessibleLabel);

    state.chartData.datasets.forEach((dataset, index) => {
        const identity = getDatasetIdentity(dataset, state.merged);
        chart.setDatasetVisibility(
            index,
            identity === undefined || !hiddenIdentities.has(identity)
        );
    });

    chart.update('none');
    syncKeyboardSelection(chart);
    return chart;
}
