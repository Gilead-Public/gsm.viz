// Add event listener to QTL dropdown.
const metric = function (datasets, setup = false, initialValue = null) {
    const instance = getChart();
    const qtlDropdown = document.querySelector('#metric');

    if (setup === true) {
        const qtls = [...new Set(datasets[1].map((d) => d.MetricID)).values()];

        for (const i in qtls) {
            const option = document.createElement('option');
            option.value = qtls[i];
            option.innerHTML = qtls[i];
            qtlDropdown.appendChild(option);
        }

        qtlDropdown.value = initialValue;
        qtlDropdown.addEventListener('change', (event) => {
            const MetricID = event.target.value;

            // analysis results
            const results = filterOnMetricID(datasets[0], MetricID);

            // chart configuration
            const config = selectMetricID(datasets[1], MetricID);
            config.y = 'Metric';

            // threshold annotations
            const thresholds = [+config.Thresholds];

            // additional analysis output
            const resultsVertical = filterOnMetricID(datasets[2], MetricID);

            instance.helpers.updateData(
                instance,
                results,
                config,
                thresholds,
                resultsVertical
            );
        });
    }

    return qtlDropdown.value;
};
