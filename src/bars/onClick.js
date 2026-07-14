import {
    selectCategory,
    clearSelection,
    getSelection,
} from './selection.js';

/**
 * Chart.js onClick handler for the bars module.
 *
 * When selection.enabled is true, clicking a bar auto-selects its category.
 * Calls spec.callbacks.onClick(point, event) when a bar element is clicked.
 * point is the Chart.js data point: { x, y, _fill?, _datum }.
 *
 * @param {Object} event - Chart.js event object
 * @param {Array}  activeElements - Chart.js active element descriptors
 * @param {Object} chart - Chart.js chart instance
 */
export default function onClick(event, activeElements, chart) {
    const spec = chart.data._spec_;

    // Handle click on empty space — clear selection if enabled.
    if (!activeElements.length) {
        if (spec.selection?.enabled) {
            const current = getSelection(chart);
            if (current.type !== null) {
                clearSelection(chart, event);
            }
        }
        return;
    }

    const { datasetIndex, index } = activeElements[0];
    const point = chart.data.datasets[datasetIndex].data[index];

    // Fire onClick callback regardless of selection mode.
    if (spec.callbacks?.onClick) {
        spec.callbacks.onClick(point, event);
    }

    // Handle click-to-select when enabled.
    if (spec.selection?.enabled) {
        const orientation = spec.orientation;
        const category =
            orientation === 'horizontal' ? point.y : point.x;

        const current = getSelection(chart);
        const multiple = spec.selection.multiple;

        if (current.type === 'category' && current.values.includes(category)) {
            // Clicking an already-selected category — toggle it off.
            if (multiple) {
                const remaining = current.values.filter(
                    (v) => v !== category
                );
                if (remaining.length === 0) {
                    clearSelection(chart, event);
                } else {
                    selectCategory(chart, remaining, event);
                }
            } else {
                clearSelection(chart, event);
            }
        } else if (multiple && current.type === 'category') {
            // Add to existing selection.
            selectCategory(chart, [...current.values, category], event);
        } else {
            // New single selection.
            selectCategory(chart, category, event);
        }
    }
}
