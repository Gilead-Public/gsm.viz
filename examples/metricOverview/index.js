const dataFiles = ['../data/results.csv', '../data/metricMetadata.csv'];

const resultColumns = [
    'StudyID',
    'GroupLevel',
    'MetricID',
    'GroupID',
    'Numerator',
    'Denominator',
    'Metric',
    'Score',
    'Flag',
    'SnapshotDate',
];
const labelColumns = ['Metric', 'Numerator', 'Denominator', 'Score'];

const controls = {
    metric: document.getElementById('metric'),
    group: document.getElementById('group'),
    snapshot: document.getElementById('snapshot'),
    format: document.getElementById('metric-format'),
};

function setOptions(select, values, labelOf = (value) => value) {
    const current = select.value;
    select.replaceChildren(
        ...values.map((value) => new Option(labelOf(value), value))
    );
    if (values.includes(current)) select.value = current;
}

function showInputRows(row, metric) {
    const table = document.getElementById('input-rows');
    const rows = [
        ...resultColumns.map((column) => [
            `Reporting_Results.${column}`,
            row ? row[column] : '(no row)',
        ]),
        ...labelColumns.map((column) => [
            `Reporting_Metrics.${column}`,
            metric[column],
        ]),
    ];
    table.replaceChildren(
        ...rows.map(([name, value]) => {
            const tr = document.createElement('tr');
            const th = document.createElement('th');
            const td = document.createElement('td');
            th.textContent = name;
            td.textContent = JSON.stringify(value);
            tr.append(th, td);
            return tr;
        })
    );
}

function renderStates() {
    const metric = {
        MetricID: 'sim0001',
        Metric: 'Simulated Discontinuation Rate',
        Numerator: 'Simulated Discontinued Participants',
        Denominator: 'Simulated Enrolled Participants',
    };
    const results = [
        {
            MetricID: 'sim0001',
            GroupID: 'Unavailable values',
            Numerator: 'NA',
            Denominator: 120,
            Metric: null,
        },
        {
            MetricID: 'sim0001',
            GroupID: 'Business labels',
            Numerator: 9,
            Denominator: 120,
            Metric: 0.075,
        },
    ];
    const states = [
        {
            title: 'Unavailable values (list)',
            spec: { groupId: 'Unavailable values' },
        },
        {
            title: 'Unavailable values (header)',
            spec: { groupId: 'Unavailable values', layout: 'header' },
        },
        { title: 'Empty (list)', spec: { groupId: 'No such group' } },
        {
            title: 'Empty (header)',
            spec: { groupId: 'No such group', layout: 'header' },
        },
        {
            title: 'Spec labels and format',
            spec: {
                groupId: 'Business labels',
                labels: {
                    Metric: '% Discontinued',
                    Numerator: 'Discontinued',
                    Denominator: 'Enrolled',
                },
                format: { Metric: '.2%' },
            },
        },
    ];

    document.getElementById('states').replaceChildren(
        ...states.map(({ title, spec }) => {
            const section = document.createElement('section');
            const heading = document.createElement('h3');
            const tile = document.createElement('div');
            heading.textContent = title;
            tile.className = 'tile';
            section.append(heading, tile);
            gsmViz.default.metricOverview(tile, { results, metric }, spec);
            return section;
        })
    );
}

Promise.all(
    dataFiles.map((file) => fetch(file).then((response) => response.text()))
)
    .then((texts) => texts.map((text) => d3.csvParse(text.replace(/^﻿/, ''))))
    .then(([results, metrics]) => {
        const rowsByMetric = d3.group(results, (row) => row.MetricID);
        const metricIds = metrics
            .map((metric) => metric.MetricID)
            .filter((id) => rowsByMetric.has(id));
        const metricById = new Map(
            metrics.map((metric) => [metric.MetricID, metric])
        );

        setOptions(controls.metric, metricIds, (id) => {
            const metric = metricById.get(id);
            return `${metric.Metric} (${metric.GroupLevel})`;
        });
        controls.metric.value = 'qtl0006';

        function update() {
            const metric = metricById.get(controls.metric.value);
            const metricRows = rowsByMetric.get(metric.MetricID);

            const snapshots = [
                ...new Set(metricRows.map((row) => row.SnapshotDate)),
            ].sort(d3.descending);
            setOptions(controls.snapshot, snapshots);

            const groups = [
                ...new Set(
                    metricRows
                        .filter(
                            (row) =>
                                row.SnapshotDate === controls.snapshot.value
                        )
                        .map((row) => row.GroupID)
                ),
            ].sort(d3.ascending);
            setOptions(controls.group, groups);

            const selection = {
                groupId: controls.group.value,
                snapshotDate: controls.snapshot.value,
            };
            const data = { results: metricRows, metric };
            let format;
            try {
                d3.formatSpecifier(controls.format.value);
                format = { Metric: controls.format.value };
                controls.format.removeAttribute('aria-invalid');
            } catch {
                controls.format.setAttribute('aria-invalid', 'true');
            }

            gsmViz.default.metricOverview('#overview-list', data, {
                ...selection,
                fields: ['Metric', 'Numerator', 'Denominator', 'Score', 'Flag'],
                format,
            });
            gsmViz.default.metricOverview('#overview-header', data, {
                ...selection,
                layout: 'header',
                format,
            });
            showInputRows(
                metricRows.find(
                    (row) =>
                        row.GroupID === selection.groupId &&
                        row.SnapshotDate === selection.snapshotDate
                ),
                metric
            );
        }

        Object.values(controls).forEach((control) =>
            control.addEventListener('change', update)
        );
        update();
        renderStates();
    });
