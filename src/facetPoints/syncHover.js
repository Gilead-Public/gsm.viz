function findPoint(chart, key) {
    for (
        let datasetIndex = 0;
        datasetIndex < chart.data.datasets.length;
        datasetIndex += 1
    ) {
        const dataset = chart.data.datasets[datasetIndex];
        if (dataset._annotation || !chart.isDatasetVisible(datasetIndex)) {
            continue;
        }

        const index = dataset.data.findIndex((point) => point._key === key);
        const element = chart.getDatasetMeta(datasetIndex).data[index];
        if (index !== -1 && element) {
            return { datasetIndex, index };
        }
    }
    return undefined;
}

function synchronizeHover(charts, origin, key) {
    charts.forEach((sibling) => {
        if (sibling === origin) return;

        const active =
            key !== undefined && sibling.data._spec_.mapping.key
                ? findPoint(sibling, key)
                : undefined;
        sibling.setActiveElements(active ? [active] : []);
        sibling.update('none');
    });
}

/**
 * Mirror pointer hover by exact mapped key without opening sibling tooltips.
 *
 * @param {Object[]} charts - Child points charts.
 */
export default function syncHover(charts) {
    charts.forEach((chart) => {
        const current = chart.options.onHover;
        const original =
            current === chart._facetPointsHoverSyncWrapper
                ? chart._facetPointsHoverOriginal
                : current;

        const wrapper = function (event, activeElements, chartInstance) {
            original?.call(this, event, activeElements, chartInstance);

            const active = activeElements[0];
            const dataset = active
                ? chartInstance.data.datasets[active.datasetIndex]
                : undefined;
            const point =
                dataset && !dataset._annotation
                    ? dataset.data[active.index]
                    : undefined;
            const key = chartInstance.data._spec_.mapping.key
                ? point?._key
                : undefined;
            synchronizeHover(charts, chartInstance, key);
        };
        chart._facetPointsHoverOriginal = original;
        chart._facetPointsHoverSyncWrapper = wrapper;
        chart.options.onHover = wrapper;
    });
}
