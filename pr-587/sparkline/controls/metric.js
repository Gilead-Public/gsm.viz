// Add event listener to metric dropdown.
const metric = function (datasets, setup = false, MetricID = null) {
    const metricDropdown = document.querySelector('#metric');

    if (setup === true) {
        const MetricIDs = [
            ...new Set(datasets[0].map((d) => d.MetricID)).values(),
        ];
        const metricMetadata = datasets[1].filter((metric) =>
            MetricIDs.includes(metric.MetricID)
        );

        for (const MetricID of MetricIDs) {
            const option = document.createElement('option');
            const metric = metricMetadata.find(
                (metric) => metric.MetricID === MetricID
            );
            option.value = MetricID;
            option.innerHTML = metric.Metric;
            metricDropdown.appendChild(option);
        }

        metricDropdown.value = MetricID === null ? MetricIDs[0] : MetricID;

        metricDropdown.addEventListener('change', (event) => {
            const results = datasets[0].filter(
                (d) => d.MetricID === event.target.value
            );
            const metric = datasets[1].find(
                (d) => d.MetricID === event.target.value
            );

            const charts = getCharts();
            for (const chart of charts) {
                const config = { ...metric };
                config.y = chart.data.config.y;
                config.nSnapshots = chart.data.config.nSnapshots;
                config.thresholds = null;

                chart.helpers.updateData(
                    chart,
                    results.filter(
                        (d) =>
                            d.GroupID ===
                            chart.data.datasets[0].data[0]?.GroupID
                    ),
                    config
                );
            }
        });
    }

    return metricDropdown.value;
};
