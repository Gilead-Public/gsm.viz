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
                const point =
                    chartInstance.data.datasets[datasetIndex].data[index];

                // For vertical: category is in point.x; for horizontal: point.y
                const hoveredCategory = horizontal ? point.y : point.x;

                charts.forEach((sibling) => {
                    if (sibling === chartInstance) return;

                    const siblingLabels = sibling.data.labels;
                    if (!siblingLabels.includes(hoveredCategory)) return;

                    // For each dataset, find the actual data-array index for the
                    // hovered category (a dataset may omit categories it has no data
                    // for, so the data index can differ from the labels index).
                    const newActiveElements = sibling.data.datasets
                        .map((ds, dsIndex) => {
                            const pointIndex = ds.data.findIndex((p) => {
                                const cat = horizontal ? p.y : p.x;
                                return String(cat) === String(hoveredCategory);
                            });
                            if (pointIndex === -1) return null;
                            const meta = sibling.getDatasetMeta(dsIndex);
                            if (!meta?.data?.[pointIndex]) return null;
                            return { datasetIndex: dsIndex, index: pointIndex };
                        })
                        .filter(Boolean);

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
