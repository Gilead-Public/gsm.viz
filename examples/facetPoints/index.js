const initialData = [
    {
        visit: 'Baseline',
        site: 'Site 01',
        exposure: 12,
        events: 3,
        region: 'Americas',
        status: 'On target',
    },
    {
        visit: 'Baseline',
        site: 'Site 02',
        exposure: 22,
        events: 7,
        region: 'Europe',
        status: 'Review',
    },
    {
        visit: 'Baseline',
        site: 'Site 03',
        exposure: 35,
        events: 5,
        region: 'Asia Pacific',
        status: 'On target',
    },
    {
        visit: 'Week 4',
        site: 'Site 01',
        exposure: 28,
        events: 6,
        region: 'Americas',
        status: 'On target',
    },
    {
        visit: 'Week 4',
        site: 'Site 02',
        exposure: 42,
        events: 12,
        region: 'Europe',
        status: 'Review',
    },
    {
        visit: 'Week 4',
        site: 'Site 04',
        exposure: 55,
        events: 8,
        region: null,
        status: 'Review',
    },
];

const week8Data = [
    {
        visit: 'Week 8',
        site: 'Site 01',
        exposure: 48,
        events: 9,
        region: 'Americas',
        status: 'On target',
    },
    {
        visit: 'Week 8',
        site: 'Site 02',
        exposure: 64,
        events: 15,
        region: 'Europe',
        status: 'Review',
    },
    {
        visit: 'Week 8',
        site: 'Site 04',
        exposure: 72,
        events: 11,
        region: null,
        status: 'Review',
    },
];

const container = document.getElementById('facet-points-container');
const status = document.getElementById('interaction-status');
let displayedData = initialData;
let freeY = false;
let result;

function render() {
    result = gsmViz.default.facetPoints(container, displayedData, {
        mapping: {
            x: 'exposure',
            y: 'events',
            key: 'site',
            color: 'region',
            shape: 'status',
        },
        scales: {
            x: {
                label: 'Participant exposure',
                beginAtZero: true,
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
            description:
                'Each panel compares participant exposure and reported events for one visit.',
        },
        annotations: {
            referenceLines: [
                {
                    axis: 'y',
                    value: 10,
                    label: 'Review threshold',
                    color: '#777777',
                    dash: [4, 3],
                },
            ],
        },
        tooltip: {
            format: '{site}: {events} events at {exposure} exposure',
        },
        callbacks: {
            onHover: (point, facetValue) => {
                status.textContent = `${point._datum.site} in ${facetValue}`;
            },
            onSelect: (selection, facetValue) => {
                status.textContent =
                    selection.type === null
                        ? `Selection cleared in ${facetValue}.`
                        : `Selected ${selection.values.join(
                              ', '
                          )} from ${facetValue}.`;
            },
        },
        selection: {
            enabled: true,
            multiple: true,
            opacity: 0.2,
        },
        facet: {
            field: 'visit',
            order: ['Baseline', 'Week 4', 'Week 8'],
            nCol: 2,
            chartHeight: 300,
            label: {
                position: 'top',
                font: '600 14px sans-serif',
            },
            scales: {
                x: { free: false },
                y: { free: freeY },
            },
            legend: {
                display: true,
                sync: true,
            },
        },
    });
}

document.getElementById('fixed-scales').addEventListener('click', () => {
    freeY = false;
    render();
});
document.getElementById('free-y-scale').addEventListener('click', () => {
    freeY = true;
    render();
});
document.getElementById('select-site').addEventListener('click', () => {
    const origin = result.charts.find((chart) =>
        chart.data.datasets.some((dataset) =>
            dataset.data.some((point) => point._key === 'Site 01')
        )
    );
    if (origin) origin.helpers.selectPoint(origin, 'Site 01');
});
document.getElementById('add-week-8').addEventListener('click', () => {
    displayedData = [...initialData, ...week8Data];
    render();
});
document.getElementById('reset-data').addEventListener('click', () => {
    displayedData = initialData;
    freeY = false;
    status.textContent = 'No point selected.';
    render();
});

render();
