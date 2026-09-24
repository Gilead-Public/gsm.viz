export default function onClick(event, activeElements, chart) {
    if (!activeElements.length) return;

    const { datasetIndex, index } = activeElements[0];
    const dataset = chart.data.datasets[datasetIndex];
    if (dataset?._annotation) return;
    const point = dataset?.data[index];

    if (point && chart.data._spec_.callbacks.onClick) {
        chart.data._spec_.callbacks.onClick(point, event);
    }
}
