/**
 * Default spec values for tiles. Labels left undefined fall back to the
 * mapped field name at render time so they track mapping changes.
 */
const defaults = {
    scales: {
        x: { order: null, label: undefined },
        y: { order: null, label: undefined },
        fill: { colors: {}, order: null, label: undefined, missing: '#f6f6f6' },
    },
    rows: { pageSize: null },
    labels: { title: null, subtitle: null },
    theme: {
        cellWidth: 64,
        detailCellWidth: 32,
        cellHeight: 28,
        rowHeaderWidth: 120,
        maxHeight: '600px',
        fontSize: 12,
        legend: true,
    },
    // Fill for cells whose value has no configured color (not a spec option).
    neutralFill: '#d9d9d9',
};

export default defaults;
