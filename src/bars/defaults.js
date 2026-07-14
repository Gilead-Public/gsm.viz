// Categorical palette — Tableau-10 (first 10) followed by ColorBrewer Set3
// (next 12), for fill mappings with many categories. Perceptually distinct.
const DEFAULT_PALETTE = [
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

/**
 * Default spec values for the bars module.
 * Mirrors ggplot2 defaults where applicable.
 */
const defaults = {
    interactive: true,
    orientation: 'vertical',
    position: 'stack',
    scales: {
        x: {
            type: 'category',
            label: undefined,
            grid: false,
            ticks: {},
        },
        y: {
            type: 'linear',
            label: undefined,
        },
        fill: {
            palette: DEFAULT_PALETTE,
        },
    },
    labels: {
        captions: undefined,
    },
    annotations: {
        referenceLines: [],
        labels: {
            segment: {
                display: false,
                placement: 'center',
                value: 'auto',
                format: undefined,
                formatter: undefined,
                minSize: 16,
                color: undefined,
                font: undefined,
            },
            total: {
                display: false,
                placement: 'outside',
                format: undefined,
                formatter: undefined,
                color: undefined,
                font: undefined,
            },
        },
    },
    callbacks: {
        onClick: null,
        onHover: null,
    },
    tooltip: {
        format: undefined,
        formatter: undefined,
    },
    theme: {
        maintainAspectRatio: false,
        animation: false,
        dynamicSizing: false,
        dynamicCategoryAxis: false,
        pxPerCategory: 30,
    },
    zoom: {
        enabled: false,
        mode: 'x',
        pan: true,
        wheel: true,
        pinch: true,
    },
    legend: {
        dense: false,
    },
    selection: {
        enabled: false,
        opacity: 0.2,
        multiple: false,
    },
    stat: 'count',
};

export default defaults;
