/**
 * Default spec values for the facetBars module.
 */
const defaults = {
    facet: {
        field: undefined,
        order: undefined,
        nCol: undefined,
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
            chart: 'first',
        },
    },
};

export default defaults;
