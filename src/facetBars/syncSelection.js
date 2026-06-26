import {
    selectCategory,
    selectSegment,
    clearSelection,
} from '../bars/selection.js';

/**
 * Wire up cross-chart selection synchronization across all facet charts.
 *
 * When selection helpers are called on any one chart, the same selection is
 * applied to all sibling charts. This ensures that clicking a bar in one
 * facet highlights the same category/segment across all facets.
 *
 * Also hooks into the onClick handler so that click-to-select in one facet
 * propagates to siblings.
 *
 * @param {Object[]} charts - array of Chart.js chart instances
 */
export default function syncSelection(charts) {
    charts.forEach((chart) => {
        const baseSelectCategory = chart.helpers.selectCategory;
        const baseSelectSegment = chart.helpers.selectSegment;
        const baseClearSelection = chart.helpers.clearSelection;

        chart.helpers.selectCategory = function (chartInstance, values, event) {
            // Apply to the target chart
            baseSelectCategory(chartInstance, values, event);

            // Propagate to siblings (without firing onSelect again)
            charts.forEach((sibling) => {
                if (sibling === chartInstance) return;
                selectCategory(sibling, values);
            });
        };

        chart.helpers.selectSegment = function (chartInstance, values, event) {
            baseSelectSegment(chartInstance, values, event);

            charts.forEach((sibling) => {
                if (sibling === chartInstance) return;
                selectSegment(sibling, values);
            });
        };

        chart.helpers.clearSelection = function (chartInstance, event) {
            baseClearSelection(chartInstance, event);

            charts.forEach((sibling) => {
                if (sibling === chartInstance) return;
                clearSelection(sibling);
            });
        };
    });

    // Also wrap the onClick handler so click-to-select propagates.
    charts.forEach((chart) => {
        const originalOnClick = chart.options.onClick;

        chart.options.onClick = (event, activeElements, chartInstance) => {
            // Let the original handler process (it handles selection for this chart)
            if (originalOnClick) {
                originalOnClick(event, activeElements, chartInstance);
            }

            // After the click handler runs, sync the resulting selection state
            // to all siblings.
            const state = chartInstance.data._selectionState_;
            if (!state?.selection) return;

            const sel = state.selection;
            charts.forEach((sibling) => {
                if (sibling === chartInstance) return;

                if (sel.type === null) {
                    clearSelection(sibling);
                } else if (sel.type === 'category') {
                    selectCategory(sibling, sel.values);
                } else if (sel.type === 'segment') {
                    selectSegment(sibling, sel.values);
                }
            });
        };
    });
}
