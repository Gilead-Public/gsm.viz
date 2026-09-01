import { Chart } from 'chart.js';
import getDatasetIdentity from '../points/datasetIdentity.js';

function getAnnotationOrdinal(datasets, index) {
    return datasets.slice(0, index + 1).filter((dataset) => dataset._annotation)
        .length;
}

function getIdentity(chart, index) {
    const dataset = chart.data.datasets[index];
    const pointIdentity = getDatasetIdentity(dataset, chart.data._spec_);

    return pointIdentity === undefined
        ? JSON.stringify([
              'annotation',
              getAnnotationOrdinal(chart.data.datasets, index),
          ])
        : pointIdentity;
}

/**
 * Synchronize legend visibility using point identity or annotation order.
 *
 * @param {Object[]} charts - Child points charts.
 * @param {Object} [options] - Synchronization options.
 * @param {boolean} [options.sync=true] - Propagate to siblings.
 */
export default function syncLegendClicks(charts, { sync = true } = {}) {
    charts.forEach((chart) => {
        const current = chart.options.plugins.legend.onClick;
        const original =
            current === chart._facetPointsLegendSyncWrapper
                ? chart._facetPointsLegendOriginal
                : current ?? Chart.defaults.plugins.legend.onClick;

        const wrapper = function (event, legendItem, legend) {
            const identity = getIdentity(chart, legendItem.datasetIndex);
            original.call(this, event, legendItem, legend);
            if (!sync) return;

            const visible = chart.isDatasetVisible(legendItem.datasetIndex);
            charts.forEach((sibling) => {
                if (sibling === chart) return;

                const index = sibling.data.datasets.findIndex(
                    (_dataset, datasetIndex) =>
                        getIdentity(sibling, datasetIndex) === identity
                );
                if (index === -1) return;

                sibling.setDatasetVisibility(index, visible);
                sibling.update('none');
            });
        };
        chart._facetPointsLegendOriginal = original;
        chart._facetPointsLegendSyncWrapper = wrapper;
        chart.options.plugins.legend.onClick = wrapper;
    });
}
