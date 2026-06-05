import Chart from 'chart.js/auto';

import validateSpec from './bars/validateSpec.js';
import mergeSpec from './bars/mergeSpec.js';
import structureData from './bars/structureData.js';
import getScales from './bars/getScales.js';
import getPlugins from './bars/getPlugins.js';
import addCanvas from './util/addCanvas.js';
import displayWhiteBackground from './util/displayWhiteBackground.js';
import getDynamicSize from './util/getDynamicSize.js';

// update methods
import updateData from './bars/updateData.js';
import updateSpec from './bars/updateSpec.js';

/**
 * Render a bar chart using a ggplot2-inspired spec.
 *
 * @param {(Node|string)} element - DOM element or selector
 * @param {Array}  data - array of data objects
 * @param {Object} spec - chart specification
 * @param {Object} spec.mapping - aesthetic mappings (x, y, fill)
 * @param {string} [spec.orientation='vertical'] - 'vertical' or 'horizontal'
 * @param {Object} [spec.scales] - axis scale configuration
 * @param {Object} [spec.labels] - title, subtitle, axis labels
 * @param {Object} [spec.theme] - theme overrides
 *
 * @returns {Object} Chart.js chart instance
 */
export default function bars(element = 'body', data = [], spec = {}) {
    // Validate inputs.
    validateSpec(data, spec);

    // Resolve string selectors to DOM nodes.
    let el = element;
    if (typeof el === 'string') {
        el = document.querySelector(el);
        if (!el) {
            throw new Error(
                `bars: could not find element matching "${element}"`
            );
        }
    }

    // Merge user spec with defaults.
    const merged = mergeSpec(data, spec);

    // Add or select canvas element.
    const canvas = addCanvas(el, {
        maintainAspectRatio: merged.theme.maintainAspectRatio,
    });

    // Transform data into Chart.js datasets.
    const { datasets, labels } = structureData(merged);

    // Build Chart.js configuration.
    const scalesConfig = getScales(merged);

    const options = {
        animation: merged.theme.animation,
        indexAxis: scalesConfig._indexAxis,
        maintainAspectRatio: merged.theme.maintainAspectRatio,
        plugins: getPlugins(merged),
        scales: {
            x: scalesConfig.x,
            y: scalesConfig.y,
        },
    };

    // Instantiate Chart.js chart.
    const chart = new Chart(canvas, {
        type: 'bar',
        data: {
            datasets,
            labels,
            _spec_: merged,
        },
        options,
        plugins: [displayWhiteBackground()],
    });

    // Attach chart to canvas element.
    canvas.chart = chart;

    // Apply dynamic container dimension when enabled (set after Chart.js init).
    // Chart.js observes the container via ResizeObserver; sizing the container
    // rather than the canvas ensures Chart.js reflects the new dimension.
    if (merged.theme.dynamicSizing) {
        const numCategories = labels.length;
        const size = getDynamicSize(numCategories) + 'px';
        if (merged.orientation === 'horizontal') {
            el.style.height = size;
        } else {
            el.style.width = size;
        }
    }

    // Attach update helpers.
    chart.helpers = {
        updateData,
        updateSpec,
    };

    return chart;
}
