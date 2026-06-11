/**
 * Chart.js onHover handler for the bars module.
 *
 * Sets cursor to 'pointer' when hovering a bar element and a click or hover
 * callback is registered; resets to 'default' otherwise.
 * Calls spec.callbacks.onHover(point, event) when hovering a bar element.
 * point is the Chart.js data point: { x, y, _fill?, _datum }.
 *
 * @param {Object} event - Chart.js event object
 * @param {Array}  activeElements - Chart.js active element descriptors
 * @param {Object} chart - Chart.js chart instance
 */
export default function onHover(event, activeElements, chart) {
    const spec = chart.data._spec_;
    const target = event?.native?.target;
    const hasClickCallback = !!spec.callbacks?.onClick;
    const hasHoverCallback = !!spec.callbacks?.onHover;

    if (!hasClickCallback && !hasHoverCallback) {
        // Avoid leaving a stale pointer cursor if callbacks were removed via updateSpec().
        if (target?.style?.cursor === 'pointer')
            target.style.cursor = 'default';
        return;
    }
    if (activeElements.length) {
        if (target) target.style.cursor = 'pointer';
        if (hasHoverCallback) {
            const { datasetIndex, index } = activeElements[0];
            const point = chart.data.datasets[datasetIndex].data[index];
            spec.callbacks.onHover(point, event);
        }
    } else {
        if (target) target.style.cursor = 'default';
    }
}
