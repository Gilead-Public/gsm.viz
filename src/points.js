import Chart from 'chart.js/auto';

import validateSpec from './points/validateSpec.js';
import mergeSpec from './points/mergeSpec.js';
import structureData from './points/structureData.js';
import getScales from './points/getScales.js';
import getPlugins from './points/getPlugins.js';
import onClick from './points/onClick.js';
import onHover from './points/onHover.js';
import addCanvas from './util/addCanvas.js';
import displayWhiteBackground from './util/displayWhiteBackground.js';

function asSentence(value) {
    const text = value?.trim();

    if (!text) {
        return '';
    }

    return /[.!?]$/.test(text) ? text : `${text}.`;
}

function getAccessibleLabel(spec, pointCount) {
    const xLabel = spec.scales.x.label || spec.mapping.x;
    const yLabel = spec.scales.y.label || spec.mapping.y;
    const parts = [
        asSentence(spec.labels.title),
        asSentence(spec.labels.description),
        `Point chart of ${yLabel} by ${xLabel}.`,
        pointCount === 0
            ? 'No data available.'
            : `${pointCount} ${pointCount === 1 ? 'point' : 'points'}.`,
    ];

    return parts.filter(Boolean).join(' ');
}

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

    const merged = mergeSpec(data, spec);
    const chartData = structureData(merged);
    const scales = getScales(merged);

    el._gsmVizPointsHoverCallbackWrapper ??= () => {};
    el._gsmVizPointsClickCallbackWrapper ??= () => {};
    const canvas = addCanvas(el, {
        maintainAspectRatio: merged.theme.maintainAspectRatio,
        hoverCallbackWrapper: el._gsmVizPointsHoverCallbackWrapper,
        clickCallbackWrapper: el._gsmVizPointsClickCallbackWrapper,
    });
    const accessibleLabel = getAccessibleLabel(merged, data.length);
    canvas.setAttribute('role', 'img');
    canvas.setAttribute('aria-label', accessibleLabel);
    canvas.textContent = accessibleLabel;

    const chart = new Chart(canvas, {
        type: 'scatter',
        data: {
            ...chartData,
            _spec_: merged,
        },
        options: {
            animation: merged.theme.animation,
            maintainAspectRatio: merged.theme.maintainAspectRatio,
            onClick,
            onHover,
            responsive: true,
            plugins: getPlugins(merged),
            scales,
        },
        plugins: [displayWhiteBackground()],
    });

    canvas.chart = chart;

    return chart;
}
