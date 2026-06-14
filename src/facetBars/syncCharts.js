/**
 * Wire up cross-chart hover highlight synchronisation across all facet charts.
 *
 * For each chart, wraps the existing onHover handler so that when a bar is
 * hovered, the matching category is highlighted (via setActiveElements) in all
 * sibling charts. When hover ends, active elements are cleared on siblings.
 *
 * Only the visual highlight is synced — no tooltip is shown in sibling charts.
 *
 * @param {Object[]} charts - array of Chart.js chart instances
 */
export default function syncCharts(charts) {
    charts.forEach((chart) => {
        const originalOnHover = chart.options.onHover;

        chart.options.onHover = (event, activeElements, chartInstance) => {
            // Forward to original handler first (user callback + cursor)
            if (originalOnHover) {
                originalOnHover(event, activeElements, chartInstance);
            }

            const horizontal = chartInstance.options.indexAxis === 'y';

            if (activeElements.length > 0) {
                const { datasetIndex, index } = activeElements[0];
                const point = chartInstance.data.datasets[datasetIndex].data[index];

                // For vertical: category is in point.x; for horizontal: point.y
                const hoveredCategory = horizontal ? point.y : point.x;

                charts.forEach((sibling) => {
                    if (sibling === chartInstance) return;

                    const siblingLabels = sibling.data.labels;
                    const labelIndex = siblingLabels.indexOf(hoveredCategory);
                    if (labelIndex === -1) return;

                    // Highlight the matching category across all datasets in the sibling
                    const newActiveElements = sibling.data.datasets.map((_, dsIndex) => ({
                        datasetIndex: dsIndex,
                        index: labelIndex,
                    }));

                    sibling.setActiveElements(newActiveElements);
                    sibling.update('none');
                });
            } else {
                // Hover ended — clear highlights on all siblings
                charts.forEach((sibling) => {
                    if (sibling === chartInstance) return;
                    sibling.setActiveElements([]);
                    sibling.update('none');
                });
            }
        };
    });
}
