// Add event listener to y-axis dropdown.
const yAxis = function (datasets, setup = false, initialValue = null) {
    const yAxisDropdown = document.getElementById('yAxis');

    if (setup) {
        yAxisDropdown.value = initialValue;
        yAxisDropdown.addEventListener('change', (event) => {
            const instance = getChart();
            const MetricID = metric();

            // analysis results
            const results = filterOnMetricID(datasets[0], MetricID);

            // chart configuration
            const config = selectMetricID(datasets[1], MetricID);
            config.y = event.target.value;
            config.selectedGroupIDs = [
                group(),
                ...datasets[2]
                    .filter(
                        (d) =>
                            d.GroupLevel === 'Site' &&
                            d.Param === 'Country' &&
                            d.Value === country()
                    )
                    .map((d) => d.GroupID),
            ];

            // Threshold annotations
            const thresholds =
                config.y === 'Score' &&
                document.getElementById('threshold').checked
                    ? config.Thresholds.split(',').map((d) => +d)
                    : null;

            instance.helpers.updateData(instance, results, config, thresholds);
        });
    }

    return yAxisDropdown.value;
};
