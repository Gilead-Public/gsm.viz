import Chart from 'chart.js/auto';
import annotationPlugin from 'chartjs-plugin-annotation';
import ChartDataLabels from 'chartjs-plugin-datalabels';

import validateSpec from './points/validateSpec.js';
import mergeSpec from './points/mergeSpec.js';
import structureData from './points/structureData.js';
import structureLines from './points/structureLines.js';
import getScales from './points/getScales.js';
import getPlugins from './points/getPlugins.js';
import onClick from './points/onClick.js';
import onHover from './points/onHover.js';
import getPointInteractionMode from './points/pointInteractionMode.js';
import {
    clearSelection,
    getSelection,
    selectGroup,
    selectionInteractionPlugin,
    selectionLegendPlugin,
    selectPoint,
} from './points/selection.js';
import {
    POINT_SELECTION_INSTRUCTIONS,
    selectionAccessibilityPlugin,
    setupKeyboardSelection,
} from './points/keyboardSelection.js';
import addCanvas from './util/addCanvas.js';
import displayWhiteBackground from './util/displayWhiteBackground.js';

Chart.register(annotationPlugin);

function asSentence(value) {
    const text = value?.trim();

    if (!text) {
        return '';
    }

    return /[.!?]$/.test(text) ? text : `${text}.`;
}

function getEncodingLabel(spec, chartData, aesthetic) {
    if (!spec.mapping[aesthetic]) return '';

    const levels = [];
    const seen = new Set();
    chartData.datasets
        .filter((dataset) => !dataset._annotation && dataset.data.length > 0)
        .forEach((dataset) => {
            const value = dataset[`_${aesthetic}`];
            const missing = dataset[`_${aesthetic}Missing`];
            const key = missing
                ? 'missing'
                : JSON.stringify([typeof value, value]);

            if (!seen.has(key)) {
                seen.add(key);
                levels.push({ value, missing });
            }
        });

    const values = levels.map(({ value, missing }) => {
        const label = String(value);
        if (missing) return `${label} (missing value)`;
        if (typeof value === 'string') {
            return `${JSON.stringify(value)} (string)`;
        }
        return `${label} (${typeof value})`;
    });

    return levels.length
        ? `${aesthetic === 'color' ? 'Color' : 'Shape'} ${
              spec.mapping[aesthetic]
          } values: ${values.join(', ')}.`
        : '';
}

function getAccessibleLabel(spec, chartData, pointCount) {
    const xLabel = spec.scales.x.label || spec.mapping.x;
    const yLabel = spec.scales.y.label || spec.mapping.y;
    const parts = [
        asSentence(spec.labels.title),
        asSentence(spec.labels.description),
        `Point chart of ${yLabel} by ${xLabel}.`,
        pointCount === 0
            ? 'No data available.'
            : `${pointCount} ${pointCount === 1 ? 'point' : 'points'}.`,
        getEncodingLabel(spec, chartData, 'color'),
        getEncodingLabel(spec, chartData, 'shape'),
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
    chartData.datasets.push(...structureLines(merged));
    const scales = getScales(merged);

    el._gsmVizPointsHoverCallbackWrapper ??= () => {};
    el._gsmVizPointsClickCallbackWrapper ??= () => {};
    const canvas = addCanvas(el, {
        maintainAspectRatio: merged.theme.maintainAspectRatio,
        hoverCallbackWrapper: el._gsmVizPointsHoverCallbackWrapper,
        clickCallbackWrapper: el._gsmVizPointsClickCallbackWrapper,
    });
    const accessibleLabel = [
        getAccessibleLabel(merged, chartData, data.length),
        merged.selection.enabled ? POINT_SELECTION_INSTRUCTIONS : '',
    ]
        .filter(Boolean)
        .join(' ');
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
            ...(merged.annotations.lines.length
                ? {
                      interaction: {
                          mode: getPointInteractionMode('point'),
                      },
                  }
                : {}),
            maintainAspectRatio: merged.theme.maintainAspectRatio,
            onClick,
            onHover,
            responsive: true,
            plugins: getPlugins(merged),
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
    };
    setupKeyboardSelection(chart);

    return chart;
}
