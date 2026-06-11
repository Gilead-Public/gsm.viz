/**
 * Chart.js onClick handler for the bars module.
 *
 * Calls spec.callbacks.onClick(point, event) when a bar element is clicked.
 * point is the Chart.js data point: { x, y, _fill?, _datum }.
 *
 * @param {Object} event - Chart.js event object
 * @param {Array}  activeElements - Chart.js active element descriptors
 * @param {Object} chart - Chart.js chart instance
 */
export default function onClick(event, activeElements, chart) {
    const spec = chart.data._spec_;
    if (!activeElements.length || !spec.callbacks?.onClick) return;
    const { datasetIndex, index } = activeElements[0];
    const point = chart.data.datasets[datasetIndex].data[index];
    spec.callbacks.onClick(point, event);
}
