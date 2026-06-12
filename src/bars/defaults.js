// Tableau-10 categorical palette — perceptually distinct, accessible.
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
];

/**
 * Default spec values for the bars module.
 * Mirrors ggplot2 defaults where applicable.
 */
const defaults = {
    orientation: 'vertical',
    position: 'stack',
    scales: {
        x: {
            type: 'category',
            label: undefined,
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
    },
};

export default defaults;
