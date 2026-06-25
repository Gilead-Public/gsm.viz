const dataFiles = [
    '../data/results.csv',
    '../data/metricMetadata.csv',
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
        config.y = 'Score';
        config.clickCallback = function (datum) {
            instance.data.config.selectedGroupIDs = datum.GroupID;
            instance.helpers.updateConfig(
                instance,
                instance.data.config,
                instance.data._thresholds_
            );
            document.querySelector('#group').value = datum.GroupID;
        };
        config.groupTooltipKeys = groupTooltipKeys[config.GroupLevel];

        // threshold annotations
        const thresholds = config.Threshold.split(',').map((d) => +d);

        // group metadata
        const groupMetadata = datasets[2];

        // visualization
        const instance = gsmViz.default.barChart(
            document.getElementById('container'),
            results,
            config,
            thresholds,
            groupMetadata
        );

        addEventListener('riskSignalSelected');

        // controls
        metric(datasets, true, MetricID);
        group(datasets, true);
        country(datasets, true);
        yAxis(datasets, true, config.y);
        threshold(datasets, true);
        lifecycle(datasets, true);
        download(true);
    });
