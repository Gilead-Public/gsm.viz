const dataFiles = [
    '../data/deprecated/results_summary_over_time.csv',
    '../data/deprecated/meta_workflow.csv',
    '../data/deprecated/results_analysis_over_time.csv',
];

const dataPromises = dataFiles.map((dataFile) =>
    fetch(dataFile).then((response) => response.text())
);

Promise.all(dataPromises)
    .then((texts) => texts.map((text) => d3.csvParse(text)))
    .then((datasets) => {
        const MetricID = 'qtl0006';

        datasets = datasets.map((dataset) => {
            return dataset.filter((d) => /^qtl/.test(d.MetricID));
        });

        // analysis results
        const results = filterOnMetricID(datasets[0], MetricID);

        // chart configuration
        const config = selectMetricID(datasets[1], MetricID);
        config.y = 'Metric';

        // Threshold annotations
        const thresholds = [+config.Thresholds];

        // additional analysis output
        const resultsVertical = filterOnMetricID(datasets[2], MetricID);

        // visualization
        const instance = gsmViz.default.timeSeries(
            document.getElementById('container'),
            results,
            config,
            thresholds,
            resultsVertical
        );

        addEventListener('riskSignalSelected');

        metric(datasets, true, config.MetricID);
    });
