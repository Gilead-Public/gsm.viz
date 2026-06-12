const dataFiles = [
    '../data/results.csv',
    '../data/metricMetadata.csv',
    '../data/groupMetadata.csv',
];

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

        // All results at the latest snapshot (used to feed scatterPlot on click).
        const allResults = datasets[0].filter(
            (d) => d.SnapshotDate === SnapshotDate
        );

        // KRI-only results for the bar chart.
        const results = allResults.filter(
            (d) => !EXCLUDED_PREFIXES.some((p) => d.MetricID.startsWith(p))
        );

        const metricMetadata = datasets[1];
        const groupMetadata = datasets[2];

        const hoverTableEl = document.getElementById('kri-hover-table');
        const scatterContainerEl = document.getElementById(
            'kri-scatter-container'
        );

        // Hover → render a table of the sites that make up the hovered bar segment.
        function onHover(point) {
            const rows = Array.isArray(point._datum)
                ? point._datum
                : [point._datum];

            const flagLabel =
                point._fill !== undefined ? ` — Flag ${point._fill}` : '';

            const sorted = [...rows].sort(
                (a, b) => Number(b.Score) - Number(a.Score)
            );

            hoverTableEl.innerHTML = '';

            const heading = document.createElement('h4');
            heading.textContent = `${point.x}${flagLabel} — ${
                rows.length
            } site${rows.length !== 1 ? 's' : ''}`;
            hoverTableEl.appendChild(heading);

            const table = document.createElement('table');
            table.innerHTML =
                '<thead><tr>' +
                '<th>Group ID</th><th>Score</th><th>Flag</th>' +
                '<th>Numerator</th><th>Denominator</th>' +
                '</tr></thead>';

            const tbody = document.createElement('tbody');
            for (const row of sorted) {
                const tr = document.createElement('tr');
                [
                    row.GroupID,
                    Number(row.Score).toFixed(3),
                    row.Flag,
                    row.Numerator,
                    row.Denominator,
                ].forEach((val) => {
                    const td = document.createElement('td');
                    td.textContent = val;
                    tr.appendChild(td);
                });
                tbody.appendChild(tr);
            }
            table.appendChild(tbody);
            hoverTableEl.appendChild(table);
        }

        // Click → render a scatterPlot for the clicked MetricID.
        function onClick(point) {
            const metricID = point.x;
            const resultsForMetric = filterOnMetricID(allResults, metricID);
            if (!resultsForMetric.length) return;

            const config = selectMetricID(metricMetadata, metricID);
            if (!config) return;

            config.displayTitle = true;
            config.groupTooltipKeys = groupTooltipKeys[config.GroupLevel];

            gsmViz.default.scatterPlot(
                scatterContainerEl,
                resultsForMetric,
                config,
                null,
                groupMetadata
            );
        }

        const callbacks = { onClick, onHover };

        function buildAnnotations(mode) {
            if (mode === 'none') return {};
            if (mode === 'total-outside')
                return {
                    labels: { total: { display: true, placement: 'outside' } },
                };
            if (mode === 'total-inside')
                return {
                    labels: { total: { display: true, placement: 'inside' } },
                };
            if (mode === 'segment-outside')
                return {
                    labels: {
                        segment: { display: true, placement: 'end' },
                    },
                };
            if (mode === 'segment-inside')
                return {
                    labels: {
                        segment: { display: true, placement: 'center' },
                    },
                };
            return {};
        }

        function buildSpec(
            orientation,
            fillKey,
            position,
            dynamicSizing,
            dynamicCategoryAxis,
            annotationsMode,
            nCategories
        ) {
            const spec = {
                mapping: {
                    x: 'MetricID',
                },
                orientation: orientation,
                position: position,
                nCategories,
                scales: {
                    x: { label: 'Metric ID', sort: 'total' },
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
                callbacks,
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
                getValue('kri-annotations'),
                getNCategories('kri-n-categories')
            )
        );

        document
            .getElementById('kri-export-btn')
            .addEventListener('click', () =>
                instance.helpers.exportImage(instance, 'kri-by-flag.png')
            );

        function rerender() {
            hoverTableEl.innerHTML = '';
            scatterContainerEl.innerHTML = '';
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
                    getValue('kri-annotations'),
                    getNCategories('kri-n-categories')
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
                'kri-n-categories',
            ],
            rerender
        );
    });
