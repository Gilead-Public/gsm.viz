// Add event listener to yaxis dropdown.
const yAxis = function (config, datasets, setup = false) {
    const yAxisDropdown = document.getElementById('yAxis');

    if (setup) {
        yAxisDropdown.value = config.y;
        yAxisDropdown.addEventListener('change', (event) => {
            const instance = getChart();
            const MetricID = metric();

            // analysis results
            const results = filterOnMetricID(datasets[0], MetricID);

            // chart configuration
            const config = selectMetricID(datasets[1], MetricID);
            config.y = event.target.value;
            config.selectedGroupIDs = group();
            config.groupTooltipKeys = groupTooltipKeys[config.GroupLevel];

            // Threshold annotations
            let thresholds = config.Thresholds.split(',').map((d) => +d);
            if (config.y !== 'Score') thresholds = null;

            // group metadata
            const groupMetadata = datasets[2];

            instance.helpers.updateData(
                instance,
                results,
                config,
                thresholds,
                null,
                groupMetadata
            );
        });
    }

    return yAxisDropdown.value;
};
