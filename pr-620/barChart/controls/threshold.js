// Add event listener to Threshold dropdown.
const threshold = function (datasets, setup = false) {
    const thresholdToggle = document.getElementById('threshold');

    thresholdToggle.addEventListener('change', (event) => {
        const instance = getChart();
        const MetricID = metric();
        const results = filterOnMetricID(datasets[0], MetricID);
        const config = selectMetricID(datasets[1], MetricID);

        // Threshold annotations
        const thresholds =
            config.y === 'Score' && document.getElementById('threshold').checked
                ? config.Thresholds.split(',').map((d) => +d)
                : null;

        config.selectedGroupIDs = group();
        instance.helpers.updateData(instance, results, config, thresholds);
    });
};
