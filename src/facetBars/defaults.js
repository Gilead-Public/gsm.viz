/**
 * Default spec values for the facetBars module.
 */
const defaults = {
    facet: {
        field: undefined,
        order: undefined,
        nCol: undefined,
        chartHeight: undefined,
        label: {
            position: 'top',
            font: undefined,
        },
        scales: {
            x: { free: false },
            y: { free: false },
        },
        legend: {
            display: true,
            sync: true,
        },
    },
};

export default defaults;
