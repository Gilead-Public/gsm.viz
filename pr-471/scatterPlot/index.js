const dataFiles = [
    '../data/results.csv',
    '../data/metricMetadata.csv',
    '../data/resultsPredicted.csv',
    '../data/groupMetadata.csv',
];

const dataPromises = dataFiles.map((dataFile) =>
    fetch(dataFile).then((response) => response.text())
);

Promise.all(dataPromises)
    .then((texts) => texts.map((text) => d3.csvParse(text)))
    .then((datasets) => {
        const MetricID = 'kri0001';

        // analysis results
        const SnapshotDate = d3.max(datasets[0], (d) => d.SnapshotDate);
        datasets[0] = datasets[0].filter(
            (d) => d.SnapshotDate === SnapshotDate
        );
        const results = filterOnMetricID(datasets[0], MetricID);

        // chart configuration
        const config = selectMetricID(datasets[1], MetricID);
        config.displayTitle = true;
        config.clickCallback = function (datum) {
            instance.data.config.selectedGroupIDs = datum.GroupID;
            instance.data.config.xType = xAxisType();
            instance.helpers.updateConfig(instance, instance.data.config);
            document.querySelector('#group').value = datum.GroupID;
        };
        config.groupTooltipKeys = groupTooltipKeys[config.GroupLevel];

        // predicted bounds
        const bounds = filterOnMetricID(datasets[2], MetricID);

        // group metadata
        const groupMetadata = datasets[3];

        // visualization
        const instance = gsmViz.default.scatterPlot(
            document.getElementById('container'),
            results,
            config,
            bounds,
            groupMetadata
        );

        addEventListener('riskSignalSelected');

        // controls
        metric(datasets, true, MetricID);
        group(datasets, true);
        country(datasets, true);
        xAxisType(true);
        lifecycle(datasets, true);
        download(true);
    });
