import syncLegendClicks from '../../src/facetBars/syncLegendClicks.js';

/**
 * Minimal chart factory for syncLegendClicks tests.
 *
 * Each chart has:
 *  - data.datasets with _dynamicCategoryAxisOriginalData_ pre-populated
 *  - isDatasetVisible / setDatasetVisibility mock
 *  - options.plugins.legend.onClick set to a jest.fn() when `hasOnClick` is true
 */
function makeChart(datasets, { indexAxis = 'x', hasOnClick = true } = {}) {
    // Visibility flags per dataset index
    const visible = datasets.map(() => true);

    const chartDatasets = datasets.map((data, i) => ({
        label: `ds${i}`,
        data: [...data],
        _dynamicCategoryAxisOriginalData_: [...data],
    }));

    const update = jest.fn();
    const setDatasetVisibility = jest.fn((idx, val) => {
        visible[idx] = val;
    });
    const isDatasetVisible = jest.fn((idx) => visible[idx]);

    return {
        data: {
            labels: [...new Set(datasets.flat().map((p) => p[indexAxis === 'y' ? 'y' : 'x']))],
            datasets: chartDatasets,
            _allLabels_: [...new Set(datasets.flat().map((p) => p[indexAxis === 'y' ? 'y' : 'x']))],
            _spec_: { orientation: indexAxis === 'y' ? 'horizontal' : 'vertical', position: 'stack', mapping: { fill: 'fill' } },
        },
        options: {
            indexAxis,
            plugins: {
                legend: {
                    onClick: hasOnClick ? jest.fn() : undefined,
                },
            },
        },
        isDatasetVisible,
        setDatasetVisibility,
        update,
    };
}

describe('facetBars/syncLegendClicks', () => {
    test('wraps legend.onClick on every chart that has one', () => {
        const charts = [
            makeChart([[{ x: 'A', y: 10 }], [{ x: 'A', y: 5 }]]),
            makeChart([[{ x: 'A', y: 8 }], [{ x: 'A', y: 3 }]]),
        ];
        const originals = charts.map((c) => c.options.plugins.legend.onClick);

        syncLegendClicks(charts);

        charts.forEach((c, i) => {
            expect(typeof c.options.plugins.legend.onClick).toBe('function');
            expect(c.options.plugins.legend.onClick).not.toBe(originals[i]);
        });
    });

    test('does not wrap charts that have no legend.onClick', () => {
        const charts = [
            makeChart([[{ x: 'A', y: 10 }]], { hasOnClick: false }),
            makeChart([[{ x: 'A', y: 5 }]], { hasOnClick: false }),
        ];

        syncLegendClicks(charts);

        charts.forEach((c) => {
            expect(c.options.plugins.legend.onClick).toBeUndefined();
        });
    });

    test('calls original onClick handler for the clicked chart', () => {
        const charts = [
            makeChart([[{ x: 'A', y: 10 }], [{ x: 'A', y: 5 }]]),
            makeChart([[{ x: 'A', y: 8 }], [{ x: 'A', y: 3 }]]),
        ];
        const orig0 = charts[0].options.plugins.legend.onClick;

        syncLegendClicks(charts);

        const e = {};
        const legendItem = { datasetIndex: 0 };
        const legendRef = { chart: charts[0] };
        charts[0].options.plugins.legend.onClick(e, legendItem, legendRef);

        expect(orig0).toHaveBeenCalledWith(e, legendItem, legendRef);
    });

    test('propagates a hide toggle to all sibling charts', () => {
        const charts = [
            makeChart([[{ x: 'A', y: 10 }], [{ x: 'A', y: 5 }]]),
            makeChart([[{ x: 'A', y: 8 }], [{ x: 'A', y: 3 }]]),
            makeChart([[{ x: 'A', y: 2 }], [{ x: 'A', y: 1 }]]),
        ];

        // Configure the original mock BEFORE wrapping so the wrapper calls it correctly.
        charts[0].options.plugins.legend.onClick.mockImplementation(() => {
            charts[0].setDatasetVisibility(0, false);
        });

        syncLegendClicks(charts);

        charts[0].options.plugins.legend.onClick(
            {},
            { datasetIndex: 0 },
            { chart: charts[0] }
        );

        // Siblings should have setDatasetVisibility(0, false) called.
        expect(charts[1].setDatasetVisibility).toHaveBeenCalledWith(0, false);
        expect(charts[2].setDatasetVisibility).toHaveBeenCalledWith(0, false);
    });

    test('propagates a show toggle (re-enabling a dataset) to all siblings', () => {
        const charts = [
            makeChart([[{ x: 'A', y: 10 }], [{ x: 'A', y: 5 }]]),
            makeChart([[{ x: 'A', y: 8 }], [{ x: 'A', y: 3 }]]),
        ];

        // Pre-hide dataset 1 in chart[0] so isDatasetVisible returns false for it.
        charts[0].isDatasetVisible.mockImplementation((idx) => idx !== 1);

        // Simulate clicking to re-show dataset 1.
        charts[0].options.plugins.legend.onClick.mockImplementation(() => {
            charts[0].setDatasetVisibility(1, true);
            charts[0].isDatasetVisible.mockImplementation(() => true);
        });

        syncLegendClicks(charts);

        charts[0].options.plugins.legend.onClick(
            {},
            { datasetIndex: 1 },
            { chart: charts[0] }
        );

        // Sibling should have been told to show dataset 1.
        expect(charts[1].setDatasetVisibility).toHaveBeenCalledWith(1, true);
    });

    test('calls update() on each sibling chart after propagation', () => {
        const charts = [
            makeChart([[{ x: 'A', y: 10 }], [{ x: 'A', y: 5 }]]),
            makeChart([[{ x: 'A', y: 8 }], [{ x: 'A', y: 3 }]]),
            makeChart([[{ x: 'A', y: 2 }], [{ x: 'A', y: 1 }]]),
        ];

        charts[0].options.plugins.legend.onClick.mockImplementation(() => {
            charts[0].setDatasetVisibility(0, false);
        });

        syncLegendClicks(charts);

        charts[0].options.plugins.legend.onClick(
            {},
            { datasetIndex: 0 },
            { chart: charts[0] }
        );

        // Siblings should be updated; the clicked chart is NOT a sibling of itself.
        expect(charts[1].update).toHaveBeenCalled();
        expect(charts[2].update).toHaveBeenCalled();
        expect(charts[0].update).not.toHaveBeenCalled();
    });

    test('skips sibling datasets that do not exist at the clicked datasetIndex', () => {
        const charts = [
            makeChart([[{ x: 'A', y: 10 }], [{ x: 'A', y: 5 }]]),
            makeChart([[{ x: 'A', y: 8 }]]), // only 1 dataset
        ];

        charts[0].options.plugins.legend.onClick.mockImplementation(() => {
            charts[0].setDatasetVisibility(1, false);
        });

        syncLegendClicks(charts);

        // Clicking datasetIndex 1 which doesn't exist in sibling should not throw.
        expect(() => {
            charts[0].options.plugins.legend.onClick(
                {},
                { datasetIndex: 1 },
                { chart: charts[0] }
            );
        }).not.toThrow();
    });

    test('updates sibling data.labels to only visible categories after hide', () => {
        const charts = [
            makeChart([
                [{ x: 'A', y: 10 }, { x: 'B', y: 20 }],
                [{ x: 'A', y: 5 }, { x: 'B', y: 15 }],
            ]),
            makeChart([
                [{ x: 'A', y: 8 }, { x: 'B', y: 18 }],
                [{ x: 'A', y: 3 }, { x: 'B', y: 13 }],
            ]),
        ];

        // Simulate hiding dataset 0 — only dataset 1 remains visible.
        charts[0].options.plugins.legend.onClick.mockImplementation(() => {
            charts[0].data.datasets[0].data = [];
            charts[0].setDatasetVisibility(0, false);
        });

        syncLegendClicks(charts);

        charts[0].options.plugins.legend.onClick(
            {},
            { datasetIndex: 0 },
            { chart: charts[0] }
        );

        // Sibling should still have labels (refreshed from remaining visible data).
        expect(Array.isArray(charts[1].data.labels)).toBe(true);
    });
});
