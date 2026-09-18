export default function onClick(event, activeElements, chart) {
    if (!activeElements.length) return;

    const { datasetIndex, index } = activeElements[0];
    const point = chart.data.datasets[datasetIndex]?.data[index];

    if (point && chart.data._spec_.callbacks.onClick) {
        chart.data._spec_.callbacks.onClick(point, event);
    }
}
