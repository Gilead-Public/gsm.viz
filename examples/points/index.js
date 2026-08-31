const data = [
    {
        exposure: 5,
        events: 1,
        site: 'Site 01',
        region: 'Americas',
        participants: 12,
        completeness: 0.72,
    },
    {
        exposure: 12,
        events: 3,
        site: 'Site 02',
        region: 'Europe',
        participants: 35,
        completeness: 0.94,
    },
    {
        exposure: 18,
        events: 2,
        site: 'Site 03',
        region: 'Americas',
        participants: 24,
        completeness: 0.83,
    },
    {
        exposure: 25,
        events: 6,
        site: 'Site 04',
        region: 'Asia Pacific',
        participants: 48,
        completeness: 0.9,
    },
    {
        exposure: 33,
        events: 5,
        site: 'Site 05',
        region: 'Europe',
        participants: 31,
        completeness: 0.79,
    },
    {
        exposure: 41,
        events: 9,
        site: 'Site 06',
        region: 'Asia Pacific',
        participants: 62,
        completeness: 1,
    },
    {
        exposure: 54,
        events: 8,
        site: 'Site 07',
        region: 'Europe',
        participants: 53,
        completeness: 0.88,
    },
    {
        exposure: 63,
        events: 12,
        site: 'Site 08',
        region: null,
        participants: 70,
        completeness: 0.65,
    },
];

gsmViz.default.points(document.getElementById('points-container'), data, {
    mapping: {
        x: 'exposure',
        y: 'events',
        key: 'site',
        color: 'region',
        size: 'participants',
        opacity: 'completeness',
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
            order: ['Americas', 'Europe', 'Asia Pacific', '(Missing)'],
            label: 'Region',
        },
        size: { range: [4, 12] },
        opacity: { range: [0.35, 1] },
    },
    labels: {
        title: 'Events by exposure',
        caption: 'Simulated site-level data',
        description:
            'Each point represents one site and compares participant exposure with reported events.',
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
