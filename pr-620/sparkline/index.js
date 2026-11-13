const dataFiles = [
    '../data/deprecated/results_summary_over_time.csv',
    '../data/deprecated/meta_workflow.csv',
    '../data/deprecated/flag_counts_by_metric.csv',
    '../data/deprecated/flag_counts_by_group.csv',
];

const dataPromises = dataFiles.map((dataFile) =>
    fetch(dataFile).then((response) => response.text())
);

Promise.all(dataPromises)
    .then((texts) => texts.map((text) => d3.csvParse(text)))
    .then((datasets) => {
        const MetricIDs = d3
            .range(12)
            .map((i) => 'kri' + d3.format('04d')(i + 1));
        const MetricID =
            MetricIDs[Math.floor(MetricIDs.length * Math.random())];

        // continuous outcome: metric results
        let results = filterOnMetricID(datasets[0], MetricID);

        const GroupIDs = [...new Set(results.map((d) => d.GroupID))];
        const GroupID = GroupIDs[Math.floor(GroupIDs.length * Math.random())];
        results = results.filter((d) => d.GroupID === GroupID);

        // discrete outcome: Flag counts by metric
        const flagCountsByMetric = datasets[2].filter(
            (d) => d.MetricID === MetricID
        );
        flagCountsByMetric.forEach((d) => {
            d.n_at_risk_or_flagged = +d.n_at_risk + +d.n_flagged;
        });

        // discrete outcome: Flag counts by Group
        const flagCountsByGroup = datasets[3].filter(
            (d) => d.GroupID === GroupID
        );
        flagCountsByGroup.forEach((d) => {
            d.n_at_risk_or_flagged = +d.n_at_risk + +d.n_flagged;
        });

        // configuration
        const config = selectMetricID(datasets[1], MetricID);
        config.nSnapshots = 25;

        // Threshold annotations
        const thresholds = config.Thresholds.split(',').map(
            (threshold) => +threshold
        );

        // continuous outcomes
        gsmViz.default.sparkline(
            document.getElementById('Score'),
            results,
            {
                ...config,
                y: 'Score',
            },
            thresholds
        );

        gsmViz.default.sparkline(document.getElementById('Metric'), results, {
            ...config,
            y: 'Metric',
        });

        // discrete outcomes
        const discreteOutcomes = [
            'n_at_risk',
            'n_flagged',
            'n_at_risk_or_flagged',
        ];
        gsmViz.default.sparkline(
            document.getElementById('flag-counts-by-metric'),
            flagCountsByMetric,
            {
                nSnapshots: config.nSnapshots,
                y: discreteOutcomes[
                    Math.floor(discreteOutcomes.length * Math.random())
                ],
            }
        );

        gsmViz.default.sparkline(
            document.getElementById('flag-counts-by-group'),
            flagCountsByGroup,
            {
                nSnapshots: config.nSnapshots,
                y: discreteOutcomes[
                    Math.floor(discreteOutcomes.length * Math.random())
                ],
            }
        );
    });
