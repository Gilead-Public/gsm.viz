import { max } from 'd3';

// Chart.js
import Chart from 'chart.js/auto';
import ChartDataLabels from 'chartjs-plugin-datalabels';

// check inputs > configure > add canvas, structure data
import checkInputs from './barChart/checkInputs.js';
import configure from './barChart/configure.js';
import addCanvas from './util/addCanvas.js';
import structureData from './barChart/structureData.js';

// Chart.js options
import onClick from './util/onClick.js';
import onHover from './util/onHover.js';
import getPlugins from './barChart/getPlugins.js';
import getScales from './barChart/getScales.js';

// custom plugins
import displayWhiteBackground from './util/displayWhiteBackground.js';

// update methods
import updateData from './barChart/updateData.js';
import updateConfig from './barChart/updateConfig.js';
import updateOption from './util/updateOption.js';
import triggerTooltip from './util/triggerTooltip.js';

/**
 * Generate a bar chart.
 *
 * @param {(Node|string)} _element_ - DOM element or ID in which to render chart
 * @param {Array} _results_ - analysis results data with one object per group ID
 * @param {Object} _config_ - chart configuration and metadata
 * @param {Array} _thresholds_ - optional threshold annotation values
 * @param {Array} _groupMetadata_ - optional group metadata
 *
 * @returns {Object} Chart.js chart object
 */
export default function barChart(
    _element_ = 'body',
    _results_ = [],
    _config_ = null,
    _thresholds_ = null,
    _groupMetadata_ = null
) {
    // Check input data against data schema.
    checkInputs(_results_, _config_, _thresholds_, _groupMetadata_);

    // Merge custom settings with default settings.
    const config = configure(_config_, _results_, _thresholds_);

    // Add or select canvas element in which to render chart.
    const canvas = addCanvas(_element_, config);

    // Define array of Chart.js dataset objects.
    const datasets = structureData(_results_, config, _groupMetadata_);

    // Configure Chart.js options.
    const options = {
        animation: false,
        clip: false,
        interaction: {
            intersect: false,
            mode: 'x',
        },
        layout: {
            padding: {
                top:
                    config.y === 'Metric'
                        ? max(datasets[0].data, (d) => d.GroupID.length) * 8
                        : null,
            },
        },
        maintainAspectRatio: config.maintainAspectRatio,
        onClick,
        onHover,
        plugins: getPlugins(config),
        scales: getScales(config, datasets),
    };

    // Instantiate Chart.js chart object.
    const chart = new Chart(canvas, {
        data: {
            datasets, // required by Chart.js
            config,

            // inputs
            _results_,
            _config_,
            _thresholds_,
            _groupMetadata_,
        },
        options,
        plugins: [ChartDataLabels, displayWhiteBackground()],
    });

    // Attach chart to canvas element.
    canvas.chart = chart;

    // Reset any previously applied dynamic sizing, then re-apply if enabled.
    // Two-pass: measure Chart.js overhead from the initial render and correct
    // the container width so the chart area is exactly numCategories × 30px.
    canvas.parentNode.style.width = '';
    if (config.dynamicSizing) {
        const numCategories = datasets[0].data.length;
        const pxPerCategory = 30;
        const area = chart.chartArea;
        const chartAreaWidth =
            area ? area.right - area.left : 0;
        const overhead =
            chartAreaWidth > 0 ? chart.width - chartAreaWidth : 0;
        canvas.parentNode.style.width =
            numCategories * pxPerCategory + overhead + 'px';
    }

    // Attach update methods to chart.
    chart.helpers = {
        updateConfig,
        updateData,
        updateOption,
        triggerTooltip,
    };

    // Trigger tooltip when a Group ID is selected.
    triggerTooltip(chart);

    return chart;
}
