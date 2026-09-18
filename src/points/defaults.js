const DEFAULT_COLOR_PALETTE = [
    '#4e79a7',
    '#f28e2b',
    '#e15759',
    '#76b7b2',
    '#59a14f',
    '#edc948',
    '#b07aa1',
    '#ff9da7',
    '#9c755f',
    '#bab0ac',
    '#8dd3c7',
    '#ffffb3',
    '#bebada',
    '#fb8072',
    '#80b1d3',
    '#fdb462',
    '#b3de69',
    '#fccde5',
    '#d9d9d9',
    '#bc80bd',
    '#ccebc5',
    '#ffed6f',
];

const defaults = {
    scales: {
        x: {
            type: 'linear',
            label: undefined,
            range: undefined,
            beginAtZero: false,
            breaks: [],
            labels: [],
        },
        y: {
            type: 'linear',
            label: undefined,
            range: undefined,
            beginAtZero: false,
            breaks: [],
            labels: [],
        },
        color: {
            colors: {},
            palette: DEFAULT_COLOR_PALETTE,
            order: [],
            label: undefined,
        },
    },
    labels: {
        title: undefined,
        caption: undefined,
        description: undefined,
    },
    tooltip: {
        format: undefined,
        formatter: undefined,
    },
    callbacks: {
        onClick: null,
        onHover: null,
        onSelect: null,
    },
    selection: {
        enabled: false,
        opacity: 0.2,
        multiple: false,
    },
    theme: {
        maintainAspectRatio: false,
        animation: false,
    },
};

export default defaults;
