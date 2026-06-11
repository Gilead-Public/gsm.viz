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

        function buildAnnotations(mode) {
            if (mode === 'none') return {};
            return { labels: { [mode]: { display: true } } };
        }

        function buildSpec(
            orientation,
            fillKey,
            position,
            dynamicSizing,
            dynamicCategoryAxis,
            annotationsMode
        ) {
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
                tooltip: {
                    format: 'count+percent',
                },
                theme: {
                    dynamicSizing,
                    dynamicCategoryAxis,
                },
                annotations: buildAnnotations(annotationsMode),
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

        const container = document.getElementById('kri-container');

        let instance = gsmViz.default.bars(
            container,
            results,
            buildSpec(
                getValue('orientation'),
                getValue('fill') || undefined,
                getValue('position'),
                getDynamicSizing('dynamic-sizing'),
                getBoolean('dynamic-category-axis'),
                getValue('kri-annotations')
            )
        );

        function rerender() {
            instance.destroy();
            instance = gsmViz.default.bars(
                container,
                results,
                buildSpec(
                    getValue('orientation'),
                    getValue('fill') || undefined,
                    getValue('position'),
                    getDynamicSizing('dynamic-sizing'),
                    getBoolean('dynamic-category-axis'),
                    getValue('kri-annotations')
                )
            );
        }

        onAnyChange(
            [
                'orientation',
                'fill',
                'position',
                'dynamic-sizing',
                'dynamic-category-axis',
                'kri-annotations',
            ],
            rerender
        );
    });
