const data = [
    {
        exposure: 5,
        events: 1,
        site: 'Site 01',
        region: 'Americas',
        participants: 12,
        completeness: 0.72,
        status: 'Review',
    },
    {
        exposure: 12,
        events: 3,
        site: 'Site 02',
        region: 'Europe',
        participants: 35,
        completeness: 0.94,
        status: 'On target',
    },
    {
        exposure: 18,
        events: 2,
        site: 'Site 03',
        region: 'Americas',
        participants: 24,
        completeness: 0.83,
        status: 'On target',
    },
    {
        exposure: 25,
        events: 6,
        site: 'Site 04',
        region: 'Asia Pacific',
        participants: 48,
        completeness: 0.9,
        status: 'Review',
    },
    {
        exposure: 33,
        events: 5,
        site: 'Site 05',
        region: 'Europe',
        participants: 31,
        completeness: 0.79,
        status: 'On target',
    },
    {
        exposure: 41,
        events: 9,
        site: 'Site 06',
        region: 'Asia Pacific',
        participants: 62,
        completeness: 1,
        status: 'Review',
    },
    {
        exposure: 54,
        events: 8,
        site: 'Site 07',
        region: 'Europe',
        participants: 53,
        completeness: 0.88,
        status: 'On target',
    },
    {
        exposure: 63,
        events: 12,
        site: 'Site 08',
        region: null,
        participants: 70,
        completeness: 0.65,
        status: 'Review',
    },
];

const thresholds = [
    { exposure: 1, events: 2, threshold: 'Review threshold' },
    { exposure: 10, events: 5, threshold: 'Review threshold' },
    { exposure: 100, events: 10, threshold: 'Review threshold' },
    { exposure: 1, events: 4, threshold: 'Alert threshold' },
    { exposure: 10, events: 8, threshold: 'Alert threshold' },
    { exposure: 100, events: 16, threshold: 'Alert threshold' },
];

gsmViz.default.points(document.getElementById('points-container'), data, {
    mapping: {
        x: 'exposure',
        y: 'events',
        key: 'site',
        color: 'region',
        size: 'participants',
        opacity: 'completeness',
        shape: 'status',
    },
    scales: {
        x: {
            type: 'log',
            label: 'Participant exposure',
            range: [1, 100],
            breaks: [1, 10, 100],
            labels: ['1', '10', '100'],
        },
        y: {
            label: 'Reported events',
            beginAtZero: true,
        },
        color: {
            colors: {
                Americas: '#4e79a7',
                Europe: '#f28e2b',
                'Asia Pacific': '#59a14f',
            },
            order: ['Americas', 'Europe', 'Asia Pacific', null],
            label: 'Region',
        },
        size: { range: [4, 12] },
        opacity: { range: [0.35, 1] },
        shape: {
            values: {
                'On target': 'circle',
                Review: 'triangle',
            },
            order: ['On target', 'Review'],
            label: 'Monitoring status',
        },
    },
    labels: {
        title: 'Events by exposure',
        caption: 'Simulated site-level data',
        description:
            'Each point represents one site and compares participant exposure with reported events.',
    },
    annotations: {
        referenceLines: [
            {
                axis: 'y',
                value: 10,
                label: '10-event reference',
                color: '#666666',
                dash: [3, 3],
            },
        ],
        lines: [
            {
                data: thresholds,
                mapping: {
                    x: 'exposure',
                    y: 'events',
                    group: 'threshold',
                },
                order: ['Review threshold', 'Alert threshold'],
                colors: {
                    'Review threshold': '#e5a919',
                    'Alert threshold': '#e15759',
                },
                width: 2,
                dash: [6, 3],
                showInLegend: true,
            },
        ],
    },
    tooltip: {
        format: '{site}: {events} events at {exposure} exposure ({color})',
    },
    callbacks: {
        onClick: (point) => {
            console.log('Selected source row:', point._datum);
        },
    },
});
