import { Chart } from 'chart.js';
import getIdentity from './legendIdentity.js';

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
                if (sibling === chart || !sibling.canvas) return;

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
