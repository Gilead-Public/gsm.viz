import Chart from 'chart.js/auto';
import annotationPlugin from 'chartjs-plugin-annotation';
import ChartDataLabels from 'chartjs-plugin-datalabels';

import buildState from './points/buildState.js';
import validateSpec from './points/validateSpec.js';
import { setAccessibleLabel } from './points/accessibility.js';
import onClick from './points/onClick.js';
import onHover from './points/onHover.js';
import {
    clearSelection,
    getSelection,
    selectGroup,
    selectionInteractionPlugin,
    selectionLegendPlugin,
    selectPoint,
} from './points/selection.js';
import {
    selectionAccessibilityPlugin,
    setupKeyboardSelection,
} from './points/keyboardSelection.js';
import updateData from './points/updateData.js';
import updateSpec from './points/updateSpec.js';
import addCanvas from './util/addCanvas.js';
import displayWhiteBackground from './util/displayWhiteBackground.js';

Chart.register(annotationPlugin);

/**
 * Render a two-dimensional point chart using a ggplot2-inspired spec.
 *
 * @param {(Node|string)} element - DOM element or CSS selector.
 * @param {Array} data - Source rows.
 * @param {Object} spec - Point chart specification.
 * @returns {Object} Chart.js chart instance.
 */
export default function renderPoints(element = 'body', data = [], spec = {}) {
    validateSpec(data, spec);

    let el = element;
    if (typeof el === 'string') {
        el = document.querySelector(el);
        if (!el) {
            throw new Error(
                `points: could not find element matching "${element}"`
            );
        }
    }

    const { merged, chartData, scales, plugins, interaction, accessibleLabel } =
        buildState(data, spec, true);

    el._gsmVizPointsHoverCallbackWrapper ??= () => {};
    el._gsmVizPointsClickCallbackWrapper ??= () => {};
    const canvas = addCanvas(el, {
        maintainAspectRatio: merged.theme.maintainAspectRatio,
        hoverCallbackWrapper: el._gsmVizPointsHoverCallbackWrapper,
        clickCallbackWrapper: el._gsmVizPointsClickCallbackWrapper,
    });
    canvas.setAttribute('role', 'img');
    setAccessibleLabel(canvas, accessibleLabel);

    const chart = new Chart(canvas, {
        type: 'scatter',
        data: {
            ...chartData,
            _spec_: merged,
        },
        options: {
            animation: merged.theme.animation,
            ...(interaction ? { interaction } : {}),
            maintainAspectRatio: merged.theme.maintainAspectRatio,
            onClick,
            onHover,
            responsive: true,
            plugins,
            scales,
        },
        plugins: [
            ...(merged.annotations.labels.point ? [ChartDataLabels] : []),
            displayWhiteBackground(),
            selectionLegendPlugin(),
            selectionInteractionPlugin(),
            selectionAccessibilityPlugin(),
        ],
    });

    canvas.chart = chart;
    chart.helpers = {
        selectPoint,
        selectGroup,
        clearSelection,
        getSelection,
        updateData,
        updateSpec,
    };
    setupKeyboardSelection(chart);

    return chart;
}
