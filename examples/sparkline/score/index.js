const dataFiles = [
    '../../data/deprecated/results_summary_over_time.csv',
    '../../data/deprecated/meta_workflow.csv',
];

const dataPromises = dataFiles.map((dataFile) =>
    fetch(dataFile).then((response) => response.text())
);

Promise.all(dataPromises)
    .then((texts) => texts.map((text) => d3.csvParse(text)))
    .then((datasets) => {
        datasets = datasets.map((dataset) =>
            dataset.filter((d) => /^kri/.test(d.MetricID))
        );

        const MetricID = metric(datasets, true);

        // data
        const results = datasets[0].filter((d) => d.MetricID === MetricID);

        // configuration
        const config = datasets[1].find((d) => d.MetricID === MetricID);
        config.y = 'Score';
        config.nSnapshots = 25;

        // Threshold annotations
        const thresholds = config.Thresholds.split(',').map(
            (threshold) => +threshold
        );

        // loop over Group IDs
        const GroupIDs = [...new Set(datasets[0].map((d) => d.GroupID))];
        for (const i in GroupIDs) {
            const GroupID = GroupIDs[i];

            // container
            const container = document.getElementById('container');
            const subcontainer = document.createElement('div');
            subcontainer.id = `container_${i}`;
            container.appendChild(subcontainer);
            subcontainer.style.display = 'inline-block';

            // display
            const instance = gsmViz.default.sparkline(
                subcontainer,
                results.filter((d) => d.GroupID === GroupID),
                config,
                thresholds
            );
        }
    });
