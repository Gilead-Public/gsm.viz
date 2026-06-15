import syncCharts from '../../src/facetBars/syncCharts.js';

const makeChart = (labels, datasets, indexAxis = 'x') => {
    const setActiveElements = jest.fn();
    const update = jest.fn();
    const chartDatasets = datasets.map((d, i) => ({
        label: `ds${i}`,
        data: d,
    }));
    return {
        data: {
            labels,
            datasets: chartDatasets,
        },
        options: {
            indexAxis,
            onHover: null,
        },
        // Default: every dataset has a truthy element at every data index
        getDatasetMeta: jest.fn((dsIndex) => ({
            data: (chartDatasets[dsIndex]?.data ?? []).map(() => ({})),
        })),
        setActiveElements,
        update,
    };
};

describe('facetBars/syncCharts', () => {
    test('replaces onHover on every chart', () => {
        const charts = [
            makeChart(
                ['A', 'B'],
                [
                    [
                        { x: 'A', y: 10 },
                        { x: 'B', y: 20 },
                    ],
                ]
            ),
            makeChart(
                ['A', 'B'],
                [
                    [
                        { x: 'A', y: 5 },
                        { x: 'B', y: 15 },
                    ],
                ]
            ),
        ];
        syncCharts(charts);
        charts.forEach((c) =>
            expect(typeof c.options.onHover).toBe('function')
        );
    });

    test('calls setActiveElements on sibling charts when a bar is hovered', () => {
        const charts = [
            makeChart(
                ['A', 'B'],
                [
                    [
                        { x: 'A', y: 10 },
                        { x: 'B', y: 20 },
                    ],
                ]
            ),
            makeChart(
                ['A', 'B'],
                [
                    [
                        { x: 'A', y: 5 },
                        { x: 'B', y: 15 },
                    ],
                ]
            ),
            makeChart(
                ['A', 'B'],
                [
                    [
                        { x: 'A', y: 3 },
                        { x: 'B', y: 7 },
                    ],
                ]
            ),
        ];
        syncCharts(charts);

        // Simulate hovering over label 'A' (index 0) in chart[0]
        charts[0].options.onHover(
            { native: null },
            [{ datasetIndex: 0, index: 0 }],
            charts[0]
        );

        // Siblings (charts[1] and charts[2]) should have setActiveElements called
        expect(charts[1].setActiveElements).toHaveBeenCalled();
        expect(charts[2].setActiveElements).toHaveBeenCalled();
        // The hovering chart itself should NOT have setActiveElements called
        expect(charts[0].setActiveElements).not.toHaveBeenCalled();
    });

    test('highlights matching category index in sibling charts', () => {
        const charts = [
            makeChart(
                ['A', 'B'],
                [
                    [
                        { x: 'A', y: 10 },
                        { x: 'B', y: 20 },
                    ],
                ]
            ),
            makeChart(
                ['A', 'B'],
                [
                    [
                        { x: 'A', y: 5 },
                        { x: 'B', y: 15 },
                    ],
                ]
            ),
        ];
        syncCharts(charts);

        // Hover 'B' (index 1) in chart[0]
        charts[0].options.onHover(
            { native: null },
            [{ datasetIndex: 0, index: 1 }],
            charts[0]
        );

        const callArg = charts[1].setActiveElements.mock.calls[0][0];
        // Should point to index 1 in chart[1] (matching 'B')
        expect(callArg[0].index).toBe(1);
    });

    test('clears sibling active elements when hover leaves a chart', () => {
        const charts = [
            makeChart(
                ['A', 'B'],
                [
                    [
                        { x: 'A', y: 10 },
                        { x: 'B', y: 20 },
                    ],
                ]
            ),
            makeChart(
                ['A', 'B'],
                [
                    [
                        { x: 'A', y: 5 },
                        { x: 'B', y: 15 },
                    ],
                ]
            ),
        ];
        syncCharts(charts);

        // Empty activeElements = mouse left chart
        charts[0].options.onHover({ native: null }, [], charts[0]);

        expect(charts[1].setActiveElements).toHaveBeenCalledWith([]);
        expect(charts[1].update).toHaveBeenCalledWith('none');
    });

    test('calls update("none") on sibling charts after setting active elements', () => {
        const charts = [
            makeChart(
                ['A', 'B'],
                [
                    [
                        { x: 'A', y: 10 },
                        { x: 'B', y: 20 },
                    ],
                ]
            ),
            makeChart(
                ['A', 'B'],
                [
                    [
                        { x: 'A', y: 5 },
                        { x: 'B', y: 15 },
                    ],
                ]
            ),
        ];
        syncCharts(charts);

        charts[0].options.onHover(
            { native: null },
            [{ datasetIndex: 0, index: 0 }],
            charts[0]
        );

        expect(charts[1].update).toHaveBeenCalledWith('none');
    });

    test('preserves original onHover callback', () => {
        const original = jest.fn();
        const chart0 = makeChart(['A'], [[{ x: 'A', y: 10 }]]);
        const chart1 = makeChart(['A'], [[{ x: 'A', y: 5 }]]);
        chart0.options.onHover = original;

        syncCharts([chart0, chart1]);

        chart0.options.onHover(
            { native: null },
            [{ datasetIndex: 0, index: 0 }],
            chart0
        );

        expect(original).toHaveBeenCalled();
    });

    test('skips highlighting when hovered category is not in sibling labels', () => {
        const charts = [
            makeChart(
                ['A', 'B'],
                [
                    [
                        { x: 'A', y: 10 },
                        { x: 'B', y: 20 },
                    ],
                ]
            ),
            makeChart(
                ['C', 'D'],
                [
                    [
                        { x: 'C', y: 5 },
                        { x: 'D', y: 15 },
                    ],
                ]
            ),
        ];
        syncCharts(charts);

        // Hover 'A' in chart[0]; 'A' does not exist in chart[1]
        charts[0].options.onHover(
            { native: null },
            [{ datasetIndex: 0, index: 0 }],
            charts[0]
        );

        expect(charts[1].setActiveElements).not.toHaveBeenCalled();
    });

    test('handles multiple datasets in sibling charts', () => {
        const charts = [
            makeChart(
                ['A', 'B'],
                [
                    [
                        { x: 'A', y: 10 },
                        { x: 'B', y: 20 },
                    ],
                    [
                        { x: 'A', y: 3 },
                        { x: 'B', y: 7 },
                    ],
                ]
            ),
            makeChart(
                ['A', 'B'],
                [
                    [
                        { x: 'A', y: 5 },
                        { x: 'B', y: 15 },
                    ],
                    [
                        { x: 'A', y: 2 },
                        { x: 'B', y: 8 },
                    ],
                ]
            ),
        ];
        syncCharts(charts);

        charts[0].options.onHover(
            { native: null },
            [{ datasetIndex: 0, index: 0 }],
            charts[0]
        );

        const activeElements = charts[1].setActiveElements.mock.calls[0][0];
        // Should have one entry per dataset
        expect(activeElements).toHaveLength(2);
        expect(activeElements[0]).toEqual({ datasetIndex: 0, index: 0 });
        expect(activeElements[1]).toEqual({ datasetIndex: 1, index: 0 });
    });

    test('handles horizontal charts (indexAxis y, category in point.y)', () => {
        // For horizontal, after swapPointAxes: point.x = value, point.y = category
        const charts = [
            makeChart(
                ['A', 'B'],
                [
                    [
                        { x: 10, y: 'A' },
                        { x: 20, y: 'B' },
                    ],
                ],
                'y'
            ),
            makeChart(
                ['A', 'B'],
                [
                    [
                        { x: 5, y: 'A' },
                        { x: 15, y: 'B' },
                    ],
                ],
                'y'
            ),
        ];
        syncCharts(charts);

        charts[0].options.onHover(
            { native: null },
            [{ datasetIndex: 0, index: 1 }], // hovering 'B' at index 1
            charts[0]
        );

        const callArg = charts[1].setActiveElements.mock.calls[0][0];
        expect(callArg[0].index).toBe(1); // 'B' is at index 1 in sibling too
    });

    test('finds correct data-array index within each dataset when categories are sparse', () => {
        // ds1 in sibling only has data for 'B', not 'A' — its 'B' is at data[0], not labels[1]
        const charts = [
            makeChart(
                ['A', 'B'],
                [
                    [
                        { x: 'A', y: 10 },
                        { x: 'B', y: 20 },
                    ],
                ]
            ),
            makeChart(
                ['A', 'B'],
                [
                    [
                        { x: 'A', y: 5 },
                        { x: 'B', y: 15 },
                    ],
                    [{ x: 'B', y: 8 }], // sparse: only 'B'
                ]
            ),
        ];
        syncCharts(charts);

        // Hover 'B' (label index 1) in chart[0]
        charts[0].options.onHover(
            { native: null },
            [{ datasetIndex: 0, index: 1 }],
            charts[0]
        );

        const activeElements = charts[1].setActiveElements.mock.calls[0][0];
        expect(activeElements).toHaveLength(2);
        expect(activeElements[0]).toEqual({ datasetIndex: 0, index: 1 }); // 'B' at data[1] in ds0
        expect(activeElements[1]).toEqual({ datasetIndex: 1, index: 0 }); // 'B' at data[0] in ds1
    });

    test('skips dataset when hovered category is absent from that dataset data', () => {
        // ds1 only has 'B'; hovering 'A' should not include ds1
        const charts = [
            makeChart(
                ['A', 'B'],
                [
                    [
                        { x: 'A', y: 10 },
                        { x: 'B', y: 20 },
                    ],
                ]
            ),
            makeChart(
                ['A', 'B'],
                [
                    [
                        { x: 'A', y: 5 },
                        { x: 'B', y: 15 },
                    ],
                    [{ x: 'B', y: 8 }], // sparse: only 'B'
                ]
            ),
        ];
        syncCharts(charts);

        // Hover 'A' (label index 0) — ds1 has no 'A'
        charts[0].options.onHover(
            { native: null },
            [{ datasetIndex: 0, index: 0 }],
            charts[0]
        );

        const activeElements = charts[1].setActiveElements.mock.calls[0][0];
        expect(activeElements).toHaveLength(1);
        expect(activeElements[0]).toEqual({ datasetIndex: 0, index: 0 });
    });

    test('excludes dataset indices with no rendered element at the resolved data index', () => {
        const charts = [
            makeChart(
                ['A', 'B'],
                [
                    [
                        { x: 'A', y: 10 },
                        { x: 'B', y: 20 },
                    ],
                ]
            ),
            makeChart(
                ['A', 'B'],
                [
                    [
                        { x: 'A', y: 5 },
                        { x: 'B', y: 15 },
                    ],
                    [
                        { x: 'A', y: 2 },
                        { x: 'B', y: 8 },
                    ],
                ]
            ),
        ];
        // Simulate ds1 in sibling having no rendered Chart.js element at data index 0
        charts[1].getDatasetMeta = jest.fn((dsIndex) => {
            if (dsIndex === 1) return { data: [undefined, {}] };
            return { data: [{}, {}] };
        });
        syncCharts(charts);

        charts[0].options.onHover(
            { native: null },
            [{ datasetIndex: 0, index: 0 }],
            charts[0]
        );

        const activeElements = charts[1].setActiveElements.mock.calls[0][0];
        // ds1 has no element at data index 0 — should be excluded
        expect(activeElements).toHaveLength(1);
        expect(activeElements[0]).toEqual({ datasetIndex: 0, index: 0 });
    });
});
