const data = [
    { exposure: 5, events: 1, site: 'Site 01', region: 'Americas' },
    { exposure: 12, events: 3, site: 'Site 02', region: 'Europe' },
    { exposure: 18, events: 2, site: 'Site 03', region: 'Americas' },
    { exposure: 25, events: 6, site: 'Site 04', region: 'Asia Pacific' },
    { exposure: 33, events: 5, site: 'Site 05', region: 'Europe' },
    { exposure: 41, events: 9, site: 'Site 06', region: 'Asia Pacific' },
    { exposure: 54, events: 8, site: 'Site 07', region: 'Europe' },
    { exposure: 63, events: 12, site: 'Site 08', region: null },
];

gsmViz.default.points(document.getElementById('points-container'), data, {
    mapping: {
        x: 'exposure',
        y: 'events',
        key: 'site',
        color: 'region',
    },
    scales: {
        x: { label: 'Participant exposure' },
        y: { label: 'Reported events' },
        color: {
            colors: {
                Americas: '#4e79a7',
                Europe: '#f28e2b',
                'Asia Pacific': '#59a14f',
            },
            order: ['Americas', 'Europe', 'Asia Pacific', '(Missing)'],
            label: 'Region',
        },
    },
    labels: {
        title: 'Events by exposure',
        caption: 'Simulated site-level data',
        description:
            'Each point represents one site and compares participant exposure with reported events.',
    },
});
