/**
 * Default spec values for the metricOverview module.
 */
const defaults = {
    layout: 'list',
    fields: ['Metric', 'Numerator', 'Denominator'],
    // d3-format specifiers, all grouping thousands. The metric reads as a
    // percent, as in the bar-chart header; scores keep the two decimals of the
    // existing result tooltips.
    format: {
        Metric: ',.1%',
        Numerator: ',',
        Denominator: ',',
        Score: ',.2f',
        Flag: ',',
    },
    // The dash matches the placeholder of the existing result tooltips.
    unavailable: {
        value: '—',
        empty: 'No data',
    },
};

export default defaults;
