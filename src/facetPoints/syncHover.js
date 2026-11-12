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

function isDestroyed(chart) {
    // Chart.js nulls the canvas when a chart is destroyed.
    return !chart.canvas;
}

function isSameActive(current, next) {
    return (
        current.length === next.length &&
        current.every(
            (element, index) =>
                element.datasetIndex === next[index].datasetIndex &&
                element.index === next[index].index
        )
    );
}

function synchronizeHover(charts, origin, key) {
    charts.forEach((sibling) => {
        if (sibling === origin || isDestroyed(sibling)) return;

        const point =
            key !== undefined && sibling.data._spec_.mapping.key
                ? findPoint(sibling, key)
                : undefined;
        const active = point ? [point] : [];
        if (isSameActive(sibling.getActiveElements(), active)) return;

        sibling.setActiveElements(active);
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
            const spec = chartInstance.data._spec_;
            original?.call(this, event, activeElements, chartInstance);
            // A callback that rebuilt or destroyed the chart leaves the hit index stale.
            if (
                isDestroyed(chartInstance) ||
                chartInstance.data._spec_ !== spec
            ) {
                return;
            }

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
        chart._facetPointsHoverExitCleanup?.();
        // Chart.js skips onHover for mouseout, so clear siblings explicitly.
        const onExit = () => synchronizeHover(charts, chart, undefined);
        chart.canvas.addEventListener('mouseout', onExit);
        const destroy = chart.destroy;
        const cleanup = () => {
            chart.canvas.removeEventListener('mouseout', onExit);
            if (chart.destroy === wrappedDestroy) chart.destroy = destroy;
            delete chart._facetPointsHoverExitCleanup;
        };
        const wrappedDestroy = function (...args) {
            cleanup();
            return destroy.apply(this, args);
        };
        chart.destroy = wrappedDestroy;
        chart._facetPointsHoverExitCleanup = cleanup;
        chart._facetPointsHoverOriginal = original;
        chart._facetPointsHoverSyncWrapper = wrapper;
        chart.options.onHover = wrapper;
    });
}
