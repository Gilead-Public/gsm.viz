export default function onHover(event, activeElements, chart) {
    const callbacks = chart.data._spec_.callbacks;
    const target = event?.native?.target;
    const isInteractive = !!(callbacks.onClick || callbacks.onHover);

    if (!isInteractive) {
        if (target?.style?.cursor === 'pointer') {
            target.style.cursor = 'default';
        }
        return;
    }

    if (!activeElements.length) {
        if (target) target.style.cursor = 'default';
        return;
    }

    const { datasetIndex, index } = activeElements[0];
    const dataset = chart.data.datasets[datasetIndex];
    if (dataset?._annotation) {
        if (target) target.style.cursor = 'default';
        return;
    }

    if (target) target.style.cursor = 'pointer';

    if (callbacks.onHover) {
        const point = dataset?.data[index];
        if (point) callbacks.onHover(point, event);
    }
}
