// Deterministic pseudo-random numbers so the demo is stable across reloads.
let seed = 614;
const random = () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
};

const vitals = ['Weight', 'Pulse', 'SBP', 'DBP', 'Resp', 'Temp'];
const ranges = {
    Weight: [55, 110],
    Pulse: [55, 100],
    SBP: [100, 160],
    DBP: [60, 100],
    Resp: [12, 22],
    Temp: [36, 38],
};
const nParticipants = 683;

const data = [];
const detail = [];
for (let i = 1; i <= nParticipants; i++) {
    const subjid = `P${String(i).padStart(4, '0')}`;
    vitals.forEach((vital) => {
        const nMeasurements = 1 + Math.floor(random() * 8);
        let nRepeat = 0;
        const [low, high] = ranges[vital];
        for (let seq = 1; seq <= nMeasurements; seq++) {
            const inWindow = seq > 1 && random() < 0.2;
            if (inWindow) nRepeat++;
            detail.push({
                subjid,
                vital,
                seq,
                inWindow,
                value: Math.round(low + random() * (high - low)),
            });
        }
        const rate = nRepeat / nMeasurements;
        const flag =
            nMeasurements < 2
                ? 'Not evaluable'
                : rate >= 0.4
                ? 'Red'
                : rate >= 0.2
                ? 'Amber'
                : 'Green';
        const pct = `${Math.round(rate * 100)}%`;
        const nd = `${nRepeat}/${nMeasurements}`;
        data.push({
            subjid,
            vital,
            flag,
            rate: pct,
            nd,
            both: `${pct}\n${nd}`,
        });
    });
}

const status = document.getElementById('tiles-status');
const show = (label, value) => {
    status.textContent = `${label}\n${JSON.stringify(value, null, 2)}`;
};

const chart = gsmViz.default.tiles('#tiles-container', data, {
    mapping: { x: 'vital', y: 'subjid', fill: 'flag', label: 'rate' },
    scales: {
        x: { label: 'Vital sign' },
        y: { label: 'Participant' },
        fill: {
            label: 'Flag',
            colors: {
                Green: '#3DAF06',
                Amber: '#FEAA02',
                Red: '#FF5859',
                'Not evaluable': '#CCCCCC',
            },
        },
    },
    expand: {
        data: detail,
        mapping: { x: 'seq', fill: 'inWindow', label: 'value' },
        scales: {
            fill: {
                label: 'In repeat window',
                colors: { true: '#B5462F', false: '#E8E8E8' },
            },
        },
        tooltip: { format: '{subjid} · {vital} #{seq}: {value}' },
    },
    tooltip: { format: '{subjid} · {vital}: {nd} repeats ({rate}) — {flag}' },
    callbacks: {
        onClick: (datum) => show('Clicked cell', datum),
        onRowClick: (info) => {
            chart.helpers.selectRow(chart, info.y);
            show(`Selected ${info.y}`, info.rows);
        },
        onExpand: (x, expanded) =>
            show('Column toggled', {
                x,
                expanded,
                state: chart.helpers.getState(chart),
            }),
    },
    rows: { pageSize: 50 },
    labels: {
        title: 'Repeat vital sign measurements',
        subtitle: `${nParticipants} synthetic participants`,
    },
});

document.querySelectorAll('[data-label]').forEach((button) => {
    button.addEventListener('click', () =>
        chart.helpers.updateSpec(chart, {
            mapping: { label: button.dataset.label },
        })
    );
});

const participants = [...new Set(data.map((d) => d.subjid))];
document
    .getElementById('sort-id')
    .addEventListener('click', () =>
        chart.helpers.updateSpec(chart, {
            scales: { y: { order: participants } },
        })
    );
document.getElementById('sort-red').addEventListener('click', () => {
    const nRed = {};
    data.forEach((d) => {
        nRed[d.subjid] = (nRed[d.subjid] ?? 0) + (d.flag === 'Red' ? 1 : 0);
    });
    const order = [...participants].sort((a, b) => nRed[b] - nRed[a]);
    chart.helpers.updateSpec(chart, { scales: { y: { order } } });
});
document
    .getElementById('clear-selection')
    .addEventListener('click', () => chart.helpers.clearSelection(chart));
