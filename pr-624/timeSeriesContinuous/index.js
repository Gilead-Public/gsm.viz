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
        const results = filterOnMetricID(datasets[0], MetricID);

        // chart configuration
        const config = selectMetricID(datasets[1], MetricID);
        config.displayTitle = true;
        config.y = 'Score';
        config.hoverCallback = function (datum) {
            //console.log(datum.GroupID);
        };
        config.clickCallback = function (datum) {
            instance.helpers.updateSelectedGroupIDs(datum.GroupID);
            document.querySelector('#group').value = datum.GroupID;
        };
        config.groupTooltipKeys = groupTooltipKeys[config.GroupLevel];

        // Threshold annotations
        const thresholds = config.Threshold.split(',').map((d) => +d);

        // group metadata
        const groupMetadata = datasets[2];

        // visualization
        const instance = gsmViz.default.timeSeries(
            document.getElementById('container'),
            results,
            config,
            thresholds,
            null,
            groupMetadata
        );

        addEventListener('riskSignalSelected');

        metric(config, datasets, true);
        group(datasets, true);
        country(datasets, true);
        yAxis(config, datasets, true);
        download(true);
    });
