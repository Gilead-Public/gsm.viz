const data = [
    { exposure: 5, events: 1, site: 'Site 01' },
    { exposure: 12, events: 3, site: 'Site 02' },
    { exposure: 18, events: 2, site: 'Site 03' },
    { exposure: 25, events: 6, site: 'Site 04' },
    { exposure: 33, events: 5, site: 'Site 05' },
    { exposure: 41, events: 9, site: 'Site 06' },
    { exposure: 54, events: 8, site: 'Site 07' },
    { exposure: 63, events: 12, site: 'Site 08' },
];

gsmViz.default.points(document.getElementById('points-container'), data, {
    mapping: {
        x: 'exposure',
        y: 'events',
        key: 'site',
    },
    scales: {
        x: { label: 'Participant exposure' },
        y: { label: 'Reported events' },
    },
    labels: {
        title: 'Events by exposure',
        caption: 'Simulated site-level data',
        description:
            'Each point represents one site and compares participant exposure with reported events.',
    },
});
