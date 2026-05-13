const dataFiles = ['../data/results.csv', '../data/metricMetadata.csv'];

const dataPromises = dataFiles.map((dataFile) =>
    fetch(dataFile).then((response) => response.text())
);

Promise.all(dataPromises)
    .then((texts) => texts.map((text) => d3.csvParse(text)))
    .then((datasets) => {
        const MetricID = 'kri0001';

        // Filter to latest snapshot and selected metric.
        const SnapshotDate = d3.max(datasets[0], (d) => d.SnapshotDate);
        const results = datasets[0].filter(
            (d) => d.SnapshotDate === SnapshotDate && d.MetricID === MetricID
        );

        // Get metric metadata for labels.
        const metricMetadatum = datasets[1].find(
            (d) => d.MetricID === MetricID
        );

        // Build ggplot2-style spec.
        function buildSpec(orientation, fillKey) {
            const spec = {
                data: results,
                mapping: {
                    x: 'GroupID',
                    y: 'Score',
                },
                orientation: orientation,
                scales: {
                    x: { label: metricMetadatum?.Group || 'Group' },
                    y: { label: 'Score' },
                },
                labels: {
                    title: metricMetadatum?.Metric || 'Bar Chart',
                },
            };

            if (fillKey) {
                spec.mapping.fill = fillKey;
            }

            return spec;
        }

        // Initial render.
        const container = document.getElementById('container');
        let instance = gsmViz.default.bars(
            container,
            buildSpec('vertical', 'Flag')
        );

        // Orientation control.
        document
            .getElementById('orientation')
            .addEventListener('change', function () {
                const fillSelect = document.getElementById('fill');
                instance.destroy();
                instance = gsmViz.default.bars(
                    container,
                    buildSpec(this.value, fillSelect.value || undefined)
                );
            });

        // Fill control.
        document.getElementById('fill').addEventListener('change', function () {
            const orientationSelect = document.getElementById('orientation');
            instance.destroy();
            instance = gsmViz.default.bars(
                container,
                buildSpec(orientationSelect.value, this.value || undefined)
            );
        });
    });
