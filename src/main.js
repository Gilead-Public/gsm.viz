// dependencies
import { CategoryScale, Chart, LinearScale } from 'chart.js';
import annotationPlugin from 'chartjs-plugin-annotation';
import zoomPlugin from 'chartjs-plugin-zoom';
import {
    BoxAndWiskers,
    BoxPlotController,
    Violin,
    ViolinController,
} from '@sgratzl/chartjs-chart-boxplot';

// modules
import barChart from './barChart.js';
import bars from './bars.js';
import facetBars from './facetBars.js';
import groupOverview from './groupOverview.js';
import renderPoints from './points.js';
import scatterPlot from './scatterPlot.js';
import sparkline from './sparkline.js';
import timeSeries from './timeSeries.js';

Chart.register(
    annotationPlugin,
    BoxAndWiskers,
    BoxPlotController,
    CategoryScale,
    LinearScale,
    Violin,
    ViolinController,
    zoomPlugin
);

// TODO: implement class-based modules
const gsmViz = {
    barChart,
    bars,
    facetBars,
    groupOverview,
    points: renderPoints,
    scatterPlot,
    sparkline,
    timeSeries,
};

export default gsmViz;
