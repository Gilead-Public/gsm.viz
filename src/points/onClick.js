import {
    clearSelection,
    getSelection,
    togglePointSelection,
} from './selection.js';

export default function onClick(event, activeElements, chart) {
    const spec = chart.data._spec_;

    if (!activeElements.length) {
        if (spec.selection.enabled && getSelection(chart).type !== null) {
            clearSelection(chart, event);
        }
        return;
    }

    const { datasetIndex, index } = activeElements[0];
    const dataset = chart.data.datasets[datasetIndex];
    if (dataset?._annotation) return;
    const point = dataset?.data[index];

    if (point && spec.callbacks.onClick) spec.callbacks.onClick(point, event);
    if (point && spec.selection.enabled) {
        togglePointSelection(chart, point._key, event);
    }
}
