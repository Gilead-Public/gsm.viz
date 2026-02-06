// dependencies
import { CategoryScale, Chart, LinearScale } from 'chart.js';
import annotationPlugin from 'chartjs-plugin-annotation';
import {
    BoxAndWiskers,
    BoxPlotController,
    Violin,
    ViolinController,
} from '@sgratzl/chartjs-chart-boxplot';

// modules
import barChart from './barChart.js';
import groupOverview from './groupOverview.js';
import groupOverviewSubset from './groupOverviewSubset.js';
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
    ViolinController
);

// TODO: implement class-based modules
const gsmViz = {
    barChart,
    groupOverview,
    groupOverviewSubset,
    scatterPlot,
    sparkline,
    timeSeries,
};

export default gsmViz;
