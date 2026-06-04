const dataFiles = ['../data/results.csv', '../data/metricMetadata.csv'];

const dataPromises = dataFiles.map((dataFile) =>
    fetch(dataFile).then((response) => response.text())
);

// Symmetric traffic-light palette: Red, Amber, Green, Amber, Red
// Maps to flag order: -2, -1, 0, 1, 2
const FLAG_PALETTE = ['#FF5859', '#FEAA02', '#3DAF06', '#FEAA02', '#FF5859']; //, '#CCCCCC'];
const FLAG_ORDER = ['-2', '-1', '0', '1', '2']; //, ''];

// Exclude country, qtl, and srs metrics — keep only KRI metrics.
const EXCLUDED_PREFIXES = ['cou', 'qtl', 'srs'];

Promise.all(dataPromises)
    .then((texts) => texts.map((text) => d3.csvParse(text)))
    .then((datasets) => {
        const SnapshotDate = d3.max(datasets[0], (d) => d.SnapshotDate);
        const results = datasets[0].filter(
            (d) =>
                d.SnapshotDate === SnapshotDate &&
                !EXCLUDED_PREFIXES.some((p) => d.MetricID.startsWith(p))
        );

        function buildSpec(orientation, fillKey, position) {
            const spec = {
                mapping: {
                    x: 'MetricID',
                },
                orientation: orientation,
                position: position,
                scales: {
                    x: { label: 'Metric ID' },
                    y: { label: 'Count' },
                },
                labels: {
                    title: 'Record Count by Metric ID',
                },
            };

            if (fillKey) {
                spec.mapping.fill = fillKey;
                spec.scales.fill = {
                    order: FLAG_ORDER,
                    palette: FLAG_PALETTE,
                };
            }

            return spec;
        }

        const orientationSelect = document.getElementById('orientation');
        const fillSelect = document.getElementById('fill');
        const positionSelect = document.getElementById('position');
        const container = document.getElementById('kri-container');

        let instance = gsmViz.default.bars(
            container,
            results,
            buildSpec(
                orientationSelect.value,
                fillSelect.value || undefined,
                positionSelect.value
            )
        );

        function rerender() {
            instance.destroy();
            instance = gsmViz.default.bars(
                container,
                results,
                buildSpec(
                    orientationSelect.value,
                    fillSelect.value || undefined,
                    positionSelect.value
                )
            );
        }

        orientationSelect.addEventListener('change', rerender);
        fillSelect.addEventListener('change', rerender);
        positionSelect.addEventListener('change', rerender);
    });
