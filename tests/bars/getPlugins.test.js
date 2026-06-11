import getPlugins from '../../src/bars/getPlugins.js';

describe('bars/getPlugins', () => {
    describe('title', () => {
        test('displays title when labels.title is set', () => {
            const spec = {
                mapping: {},
                scales: { fill: {} },
                labels: { title: 'My Chart' },
            };
            const plugins = getPlugins(spec);
            expect(plugins.title.display).toBe(true);
            expect(plugins.title.text).toBe('My Chart');
        });

        test('hides title when labels.title is absent', () => {
            const spec = {
                mapping: {},
                scales: { fill: {} },
                labels: {},
            };
            const plugins = getPlugins(spec);
            expect(plugins.title.display).toBe(false);
        });
    });

    describe('legend visibility', () => {
        test('shows legend when mapping.fill is set', () => {
            const spec = {
                mapping: { fill: 'group' },
                scales: { fill: {} },
                labels: {},
            };
            const plugins = getPlugins(spec);
            expect(plugins.legend.display).toBe(true);
        });

        test('hides legend when mapping.fill is absent', () => {
            const spec = {
                mapping: {},
                scales: { fill: {} },
                labels: {},
            };
            const plugins = getPlugins(spec);
            expect(plugins.legend.display).toBe(false);
        });
    });

    describe('legend title (fill label)', () => {
        test('defaults legend title to mapping.fill variable name', () => {
            const spec = {
                mapping: { fill: 'group' },
                scales: { fill: {} },
                labels: {},
            };
            const plugins = getPlugins(spec);
            expect(plugins.legend.title.display).toBe(true);
            expect(plugins.legend.title.text).toBe('group');
        });

        test('uses scales.fill.label when provided', () => {
            const spec = {
                mapping: { fill: 'group' },
                scales: { fill: { label: 'Treatment Arm' } },
                labels: {},
            };
            const plugins = getPlugins(spec);
            expect(plugins.legend.title.display).toBe(true);
            expect(plugins.legend.title.text).toBe('Treatment Arm');
        });

        test('disables legend title when scales.fill.label is null', () => {
            const spec = {
                mapping: { fill: 'group' },
                scales: { fill: { label: null } },
                labels: {},
            };
            const plugins = getPlugins(spec);
            expect(plugins.legend.title.display).toBe(false);
        });

        test('disables legend title when scales.fill.label is empty string', () => {
            const spec = {
                mapping: { fill: 'group' },
                scales: { fill: { label: '' } },
                labels: {},
            };
            const plugins = getPlugins(spec);
            expect(plugins.legend.title.display).toBe(false);
        });

        test('no legend title when mapping.fill is absent', () => {
            const spec = {
                mapping: {},
                scales: { fill: {} },
                labels: {},
            };
            const plugins = getPlugins(spec);
            expect(plugins.legend.title.display).toBe(false);
        });
    });

    describe('dynamicCategoryAxis', () => {
        const baseSpec = {
            mapping: { fill: 'group' },
            scales: { fill: {} },
            labels: {},
            tooltip: {},
        };

        test('no onClick on legend when dynamicCategoryAxis is absent', () => {
            const plugins = getPlugins(baseSpec);
            expect(plugins.legend.onClick).toBeUndefined();
        });

        test('no onClick on legend when dynamicCategoryAxis is false', () => {
            const spec = { ...baseSpec, theme: { dynamicCategoryAxis: false } };
            const plugins = getPlugins(spec);
            expect(plugins.legend.onClick).toBeUndefined();
        });

        test('onClick is a function when dynamicCategoryAxis is true', () => {
            const spec = { ...baseSpec, theme: { dynamicCategoryAxis: true } };
            const plugins = getPlugins(spec);
            expect(typeof plugins.legend.onClick).toBe('function');
        });

        describe('onClick behavior', () => {
            // Mock chart that mirrors the Chart.js 3 visibility API used by the
            // dynamicCategoryAxis handler: setDatasetVisibility / isDatasetVisible
            // use an internal _meta map; hide/show are kept for completeness.
            function makeChart(
                datasets,
                allLabels,
                orientation = 'vertical',
                initiallyHidden = []
            ) {
                const _meta = {};
                initiallyHidden.forEach((i) => {
                    _meta[i] = true;
                    // Simulate state after a prior hide click: data is emptied,
                    // backup is stored — mirrors what the handler does.
                    if (datasets[i]) {
                        datasets[i]._backup_ = datasets[i].data;
                        datasets[i].data = [];
                    }
                });
                return {
                    data: {
                        datasets,
                        labels: [...allLabels],
                        _allLabels_: [...allLabels],
                        _spec_: { orientation },
                    },
                    _meta,
                    update: jest.fn(),
                    isDatasetVisible(i) {
                        return this._meta[i] !== true;
                    },
                    setDatasetVisibility(i, visible) {
                        this._meta[i] = !visible;
                    },
                    hide(i) {
                        this._meta[i] = true;
                    },
                    show(i) {
                        this._meta[i] = false;
                    },
                };
            }

            function makeDataset(label, categories) {
                return {
                    label,
                    data: categories.map((cat) => ({ x: cat, y: 1 })),
                };
            }

            function clickLegend(plugins, chart, datasetIndex) {
                const legendItem = { datasetIndex };
                const legend = { chart };
                plugins.legend.onClick({}, legendItem, legend);
            }

            test('hides clicked dataset: empties data and marks invisible', () => {
                const spec = {
                    ...baseSpec,
                    theme: {
                        dynamicCategoryAxis: true,
                        orientation: 'vertical',
                    },
                };
                const plugins = getPlugins(spec);

                const originalData = [
                    { x: 'cat1', y: 1 },
                    { x: 'cat2', y: 1 },
                ];
                const ds0 = { label: 'A', data: [...originalData] };
                const ds1 = makeDataset('B', ['cat2', 'cat3']);
                const chart = makeChart([ds0, ds1], ['cat1', 'cat2', 'cat3']);

                clickLegend(plugins, chart, 0);

                expect(chart.isDatasetVisible(0)).toBe(false);
                expect(chart.data.datasets[0].data).toEqual([]);
                expect(chart.data.datasets[0]._backup_).toEqual(originalData);
            });

            test('does not mutate Chart.js private dataset metadata when hiding a dataset', () => {
                const spec = {
                    ...baseSpec,
                    theme: {
                        dynamicCategoryAxis: true,
                        orientation: 'vertical',
                    },
                };
                const plugins = getPlugins(spec);

                const ds0 = makeDataset('A', ['cat1']);
                const ds1 = makeDataset('B', ['cat2']);
                const chart = makeChart([ds0, ds1], ['cat1', 'cat2']);
                const meta = {
                    _parsed: [{ x: 'cat1', y: 1 }],
                    _sorted: false,
                };
                chart.getDatasetMeta = jest.fn(() => meta);

                clickLegend(plugins, chart, 0);

                expect(chart.getDatasetMeta).not.toHaveBeenCalled();
                expect(meta._parsed).toEqual([{ x: 'cat1', y: 1 }]);
                expect(meta._sorted).toBe(false);
            });

            test('shows previously-hidden dataset: restores data and marks visible', () => {
                const spec = {
                    ...baseSpec,
                    theme: {
                        dynamicCategoryAxis: true,
                        orientation: 'vertical',
                    },
                };
                const plugins = getPlugins(spec);

                const ds0 = makeDataset('A', ['cat1', 'cat2']);
                const ds1 = makeDataset('B', ['cat2', 'cat3']);
                const chart = makeChart(
                    [ds0, ds1],
                    ['cat1', 'cat2', 'cat3'],
                    'vertical',
                    [0]
                );

                clickLegend(plugins, chart, 0);

                expect(chart.isDatasetVisible(0)).toBe(true);
                expect(chart.data.datasets[0].data).toHaveLength(2);
                expect(chart.data.datasets[0]._backup_).toBeUndefined();
            });

            test('filters labels to categories in visible datasets only', () => {
                const spec = {
                    ...baseSpec,
                    theme: {
                        dynamicCategoryAxis: true,
                        orientation: 'vertical',
                    },
                };
                const plugins = getPlugins(spec);

                const ds0 = makeDataset('A', ['cat1', 'cat2']);
                const ds1 = makeDataset('B', ['cat2', 'cat3']);
                const chart = makeChart([ds0, ds1], ['cat1', 'cat2', 'cat3']);

                // Hide dataset A — cat1 is only in A, so it should be removed
                clickLegend(plugins, chart, 0);

                expect(chart.data.labels).toEqual(['cat2', 'cat3']);
            });

            test('restores full labels when a hidden dataset is re-selected', () => {
                const spec = {
                    ...baseSpec,
                    theme: {
                        dynamicCategoryAxis: true,
                        orientation: 'vertical',
                    },
                };
                const plugins = getPlugins(spec);

                const ds0 = makeDataset('A', ['cat1', 'cat2']);
                const ds1 = makeDataset('B', ['cat2', 'cat3']);
                const chart = makeChart(
                    [ds0, ds1],
                    ['cat1', 'cat2', 'cat3'],
                    'vertical',
                    [0]
                );

                // Re-show dataset A — cat1 should come back
                clickLegend(plugins, chart, 0);

                expect(chart.data.labels).toEqual(['cat1', 'cat2', 'cat3']);
            });

            test('preserves original category order from _allLabels_', () => {
                const spec = {
                    ...baseSpec,
                    theme: {
                        dynamicCategoryAxis: true,
                        orientation: 'vertical',
                    },
                };
                const plugins = getPlugins(spec);

                const ds0 = makeDataset('A', ['cat3', 'cat1']);
                const ds1 = makeDataset('B', ['cat2']);
                const allLabels = ['cat1', 'cat2', 'cat3'];
                const chart = makeChart([ds0, ds1], allLabels);

                // Hide dataset B — only cat1 and cat3 remain
                clickLegend(plugins, chart, 1);

                // Order must follow _allLabels_, not dataset data order
                expect(chart.data.labels).toEqual(['cat1', 'cat3']);
            });

            test('calls chart.update() after adjusting labels', () => {
                const spec = {
                    ...baseSpec,
                    theme: {
                        dynamicCategoryAxis: true,
                        orientation: 'vertical',
                    },
                };
                const plugins = getPlugins(spec);

                const ds0 = makeDataset('A', ['cat1']);
                const ds1 = makeDataset('B', ['cat2']);
                const chart = makeChart([ds0, ds1], ['cat1', 'cat2']);

                clickLegend(plugins, chart, 0);

                expect(chart.update).toHaveBeenCalledTimes(1);
            });

            describe('dynamicSizing integration', () => {
                function makeChartWithSizing(
                    datasets,
                    allLabels,
                    orientation,
                    chartArea,
                    chartDim,
                    theme = { dynamicSizing: true }
                ) {
                    const chart = makeChart(datasets, allLabels, orientation);
                    chart.data._spec_.theme = theme;
                    chart.chartArea = chartArea;
                    chart.height = chartDim;
                    chart.width = chartDim;
                    chart.canvas = {
                        parentElement: { style: { width: '', height: '' } },
                    };
                    return chart;
                }

                test('updates container width for vertical chart after hide', () => {
                    const spec = {
                        ...baseSpec,
                        theme: {
                            dynamicCategoryAxis: true,
                            dynamicSizing: true,
                        },
                    };
                    const plugins = getPlugins(spec);

                    // Simulate a chart with 3 categories; after hiding ds0 only 2 remain.
                    // chartArea: left=40, right=340 → chartAreaWidth=300; chart.width=400 → overhead=100
                    const ds0 = makeDataset('A', ['cat1']);
                    const ds1 = makeDataset('B', ['cat2', 'cat3']);
                    const chart = makeChartWithSizing(
                        [ds0, ds1],
                        ['cat1', 'cat2', 'cat3'],
                        'vertical',
                        { left: 40, right: 340, top: 10, bottom: 210 },
                        400
                    );

                    clickLegend(plugins, chart, 0); // hides ds0, labels → ['cat2','cat3']

                    // 2 categories × 30 + 100 overhead = 160
                    expect(chart.canvas.parentElement.style.width).toBe(
                        '160px'
                    );
                });

                test('updates container height for horizontal chart after hide', () => {
                    const spec = {
                        ...baseSpec,
                        theme: {
                            dynamicCategoryAxis: true,
                            dynamicSizing: true,
                            orientation: 'horizontal',
                        },
                    };
                    const plugins = getPlugins(spec);

                    // category key is y for horizontal datasets
                    const ds0 = { label: 'A', data: [{ x: 1, y: 'cat1' }] };
                    const ds1 = {
                        label: 'B',
                        data: [
                            { x: 2, y: 'cat2' },
                            { x: 3, y: 'cat3' },
                        ],
                    };
                    // chartArea: top=20, bottom=320 → chartAreaHeight=300; chart.height=400 → overhead=100
                    const chart = makeChartWithSizing(
                        [ds0, ds1],
                        ['cat1', 'cat2', 'cat3'],
                        'horizontal',
                        { top: 20, bottom: 320, left: 40, right: 340 },
                        400
                    );

                    clickLegend(plugins, chart, 0); // hides ds0, labels → ['cat2','cat3']

                    // 2 categories × 30 + 100 overhead = 160
                    expect(chart.canvas.parentElement.style.height).toBe(
                        '160px'
                    );
                });

                test('does not set container dimensions when dynamicSizing is false', () => {
                    const spec = {
                        ...baseSpec,
                        theme: {
                            dynamicCategoryAxis: true,
                            dynamicSizing: false,
                        },
                    };
                    const plugins = getPlugins(spec);

                    const ds0 = makeDataset('A', ['cat1']);
                    const ds1 = makeDataset('B', ['cat2', 'cat3']);
                    const chart = makeChartWithSizing(
                        [ds0, ds1],
                        ['cat1', 'cat2', 'cat3'],
                        'vertical',
                        { left: 40, right: 340, top: 10, bottom: 210 },
                        400,
                        { dynamicSizing: false }
                    );

                    clickLegend(plugins, chart, 0);

                    expect(chart.canvas.parentElement.style.width).toBe('');
                    expect(chart.canvas.parentElement.style.height).toBe('');
                });
            });

            test('uses y key for category values in horizontal orientation', () => {
                const spec = {
                    ...baseSpec,
                    theme: {
                        dynamicCategoryAxis: true,
                        orientation: 'horizontal',
                    },
                };
                const plugins = getPlugins(spec);

                // In horizontal mode, swapPointAxes has been applied:
                // category is in y, value is in x
                const ds0 = {
                    label: 'A',
                    data: [
                        { x: 1, y: 'cat1' },
                        { x: 2, y: 'cat2' },
                    ],
                };
                const ds1 = {
                    label: 'B',
                    data: [
                        { x: 3, y: 'cat2' },
                        { x: 4, y: 'cat3' },
                    ],
                };
                const chart = makeChart(
                    [ds0, ds1],
                    ['cat1', 'cat2', 'cat3'],
                    'horizontal'
                );

                // Hide dataset A — cat1 exclusive to A
                clickLegend(plugins, chart, 0);

                expect(chart.data.labels).toEqual(['cat2', 'cat3']);
            });

            test('aligns visible stacked datasets to filtered labels after a hide', () => {
                const spec = {
                    ...baseSpec,
                    position: 'stack',
                    theme: {
                        dynamicCategoryAxis: true,
                        orientation: 'vertical',
                    },
                };
                const plugins = getPlugins(spec);

                const ds0 = makeDataset('A', ['cat1', 'cat3']);
                const ds1 = makeDataset('B', ['cat2', 'cat3']);
                const ds2 = makeDataset('C', ['cat4']);
                const chart = makeChart(
                    [ds0, ds1, ds2],
                    ['cat1', 'cat2', 'cat3', 'cat4']
                );
                chart.data._spec_.position = 'stack';
                chart.data._spec_.mapping = { fill: 'group' };

                clickLegend(plugins, chart, 2);

                expect(chart.data.labels).toEqual(['cat1', 'cat2', 'cat3']);
                expect(chart.data.datasets[0].data.map((d) => d.x)).toEqual([
                    'cat1',
                    'cat2',
                    'cat3',
                ]);
                expect(chart.data.datasets[0].data.map((d) => d.y)).toEqual([
                    1, 0, 1,
                ]);
                expect(chart.data.datasets[1].data.map((d) => d.x)).toEqual([
                    'cat1',
                    'cat2',
                    'cat3',
                ]);
                expect(chart.data.datasets[1].data.map((d) => d.y)).toEqual([
                    0, 1, 1,
                ]);
            });

            test("preserves position='fill' percentages when aligning after a hide", () => {
                const spec = {
                    ...baseSpec,
                    position: 'fill',
                    theme: {
                        dynamicCategoryAxis: true,
                        orientation: 'vertical',
                    },
                };
                const plugins = getPlugins(spec);

                const ds0 = {
                    label: 'A',
                    data: [
                        { x: 'cat1', y: 25, _rawY: 1 },
                        { x: 'cat3', y: 40, _rawY: 2 },
                    ],
                };
                const ds1 = {
                    label: 'B',
                    data: [
                        { x: 'cat2', y: 30, _rawY: 3 },
                        { x: 'cat3', y: 60, _rawY: 3 },
                    ],
                };
                const ds2 = makeDataset('C', ['cat4']);
                const chart = makeChart(
                    [ds0, ds1, ds2],
                    ['cat1', 'cat2', 'cat3', 'cat4']
                );
                chart.data._spec_.position = 'fill';
                chart.data._spec_.mapping = { fill: 'group' };

                clickLegend(plugins, chart, 2);

                expect(chart.data.labels).toEqual(['cat1', 'cat2', 'cat3']);
                expect(chart.data.datasets[0].data.map((d) => d.y)).toEqual([
                    25, 0, 40,
                ]);
                expect(chart.data.datasets[1].data.map((d) => d.y)).toEqual([
                    0, 30, 60,
                ]);
            });
        });
    });

    describe('datalabel annotations', () => {
        const baseSpec = {
            mapping: { x: 'category', y: 'value', fill: 'group' },
            scales: { fill: {} },
            labels: {},
            tooltip: {},
            position: 'stack',
            orientation: 'vertical',
        };

        function makeContext({
            datasetIndex = 0,
            dataIndex = 0,
            point = { x: 'A', y: 10 },
            datasets = [{ data: [point] }],
            indexAxis = 'x',
            element = { width: 30, height: 30 },
            hidden = [],
        } = {}) {
            return {
                datasetIndex,
                dataIndex,
                dataset: datasets[datasetIndex],
                chart: {
                    data: { datasets },
                    options: { indexAxis },
                    isDatasetVisible(i) {
                        return !hidden.includes(i);
                    },
                    getDatasetMeta(i) {
                        return {
                            data: i === datasetIndex ? [element] : [],
                        };
                    },
                },
            };
        }

        test('keeps datalabels disabled by default', () => {
            const plugins = getPlugins(baseSpec);
            expect(plugins.datalabels.display).toBe(false);
            expect(plugins.datalabels.labels).toBeUndefined();
        });

        test('formats inside segment labels with raw values by default', () => {
            const plugins = getPlugins({
                ...baseSpec,
                annotations: {
                    labels: {
                        segment: { display: true },
                    },
                },
            });
            const segment = plugins.datalabels.labels.segment;
            const context = makeContext();

            expect(segment.display(context)).toBe(true);
            expect(segment.formatter(context.dataset.data[0], context)).toBe(
                '10'
            );
            expect(segment.anchor(context)).toBe('center');
            expect(segment.align(context)).toBe('center');
        });

        test("formats position='fill' segment labels as percentages by default", () => {
            const plugins = getPlugins({
                ...baseSpec,
                position: 'fill',
                annotations: {
                    labels: {
                        segment: { display: true },
                    },
                },
            });
            const context = makeContext({
                point: { x: 'A', y: 33.333, _rawY: 1 },
                datasets: [{ data: [{ x: 'A', y: 33.333, _rawY: 1 }] }],
            });

            expect(
                plugins.datalabels.labels.segment.formatter(
                    context.dataset.data[0],
                    context
                )
            ).toBe('33.3%');
        });

        test('supports d3 number format strings', () => {
            const plugins = getPlugins({
                ...baseSpec,
                annotations: {
                    labels: {
                        segment: { display: true, format: ',.1f' },
                    },
                },
            });
            const context = makeContext({
                point: { x: 'A', y: 1234.56 },
                datasets: [{ data: [{ x: 'A', y: 1234.56 }] }],
            });

            expect(
                plugins.datalabels.labels.segment.formatter(
                    context.dataset.data[0],
                    context
                )
            ).toBe('1,234.6');
        });

        test('supports d3 percent format strings for percent labels', () => {
            const plugins = getPlugins({
                ...baseSpec,
                position: 'fill',
                annotations: {
                    labels: {
                        segment: {
                            display: true,
                            format: '.1%',
                        },
                    },
                },
            });
            const context = makeContext({
                point: { x: 'A', y: 33.333, _rawY: 1 },
                datasets: [{ data: [{ x: 'A', y: 33.333, _rawY: 1 }] }],
            });

            expect(
                plugins.datalabels.labels.segment.formatter(
                    context.dataset.data[0],
                    context
                )
            ).toBe('33.3%');
        });

        test('supports custom formatter callbacks', () => {
            const formatter = jest.fn((value) => `custom ${value}`);
            const plugins = getPlugins({
                ...baseSpec,
                annotations: {
                    labels: {
                        segment: { display: true, formatter },
                    },
                },
            });
            const context = makeContext();

            expect(
                plugins.datalabels.labels.segment.formatter(
                    context.dataset.data[0],
                    context
                )
            ).toBe('custom 10');
            expect(formatter).toHaveBeenCalledWith(
                10,
                context,
                expect.objectContaining({
                    mode: 'segment',
                    valueType: 'raw',
                })
            );
        });

        test('hides inside segment labels when the rendered segment is smaller than minSize', () => {
            const plugins = getPlugins({
                ...baseSpec,
                annotations: {
                    labels: {
                        segment: { display: true, minSize: 16 },
                    },
                },
            });
            const context = makeContext({
                element: { width: 30, height: 10 },
            });

            expect(plugins.datalabels.labels.segment.display(context)).toBe(
                false
            );
        });

        test("segment placement='end' uses anchor 'end' and align 'end' (vertical)", () => {
            const plugins = getPlugins({
                ...baseSpec,
                annotations: {
                    labels: {
                        segment: { display: true, placement: 'end' },
                    },
                },
            });
            const segment = plugins.datalabels.labels.segment;
            const context = makeContext();

            expect(segment.anchor(context)).toBe('end');
            expect(segment.align(context)).toBe('end');
        });

        test("segment placement='end' uses align 'right' for horizontal orientation", () => {
            const plugins = getPlugins({
                ...baseSpec,
                orientation: 'horizontal',
                annotations: {
                    labels: {
                        segment: { display: true, placement: 'end' },
                    },
                },
            });
            const segment = plugins.datalabels.labels.segment;
            const context = makeContext({
                point: { x: 10, y: 'A' },
                datasets: [{ data: [{ x: 10, y: 'A' }] }],
                indexAxis: 'y',
            });

            expect(segment.anchor(context)).toBe('end');
            expect(segment.align(context)).toBe('right');
        });

        test("segment placement='center' (default) still uses anchor 'center' and align 'center'", () => {
            const plugins = getPlugins({
                ...baseSpec,
                annotations: {
                    labels: {
                        segment: { display: true, placement: 'center' },
                    },
                },
            });
            const segment = plugins.datalabels.labels.segment;
            const context = makeContext();

            expect(segment.anchor(context)).toBe('center');
            expect(segment.align(context)).toBe('center');
        });

        test('renders total labels only on the last visible dataset for a category', () => {
            const datasets = [
                { label: 'A', data: [{ x: 'site-1', y: 10 }] },
                { label: 'B', data: [{ x: 'site-1', y: 20 }] },
            ];
            const plugins = getPlugins({
                ...baseSpec,
                annotations: {
                    labels: {
                        total: { display: true },
                    },
                },
            });
            const total = plugins.datalabels.labels.total;
            const firstContext = makeContext({ datasetIndex: 0, datasets });
            const lastContext = makeContext({ datasetIndex: 1, datasets });

            expect(total.display(firstContext)).toBe(false);
            expect(total.display(lastContext)).toBe(true);
            expect(total.formatter(datasets[1].data[0], lastContext)).toBe(
                '30'
            );
            expect(total.anchor(lastContext)).toBe('end');
            expect(total.align(lastContext)).toBe('end');
        });

        test('uses raw values for totals when bars are normalized to percentages', () => {
            const datasets = [
                { label: 'A', data: [{ x: 'site-1', y: 25, _rawY: 1 }] },
                { label: 'B', data: [{ x: 'site-1', y: 75, _rawY: 3 }] },
            ];
            const plugins = getPlugins({
                ...baseSpec,
                position: 'fill',
                annotations: {
                    labels: {
                        total: { display: true },
                    },
                },
            });
            const context = makeContext({ datasetIndex: 1, datasets });

            expect(
                plugins.datalabels.labels.total.formatter(
                    datasets[1].data[0],
                    context
                )
            ).toBe('4');
        });

        test("total placement='inside' uses anchor 'end' and align 'start'", () => {
            const datasets = [
                { label: 'A', data: [{ x: 'site-1', y: 10 }] },
                { label: 'B', data: [{ x: 'site-1', y: 20 }] },
            ];
            const plugins = getPlugins({
                ...baseSpec,
                annotations: {
                    labels: {
                        total: { display: true, placement: 'inside' },
                    },
                },
            });
            const total = plugins.datalabels.labels.total;
            const context = makeContext({ datasetIndex: 1, datasets });

            expect(total.anchor(context)).toBe('end');
            expect(total.align(context)).toBe('start');
        });

        test("total placement='outside' (default) uses anchor 'end' and align 'end'", () => {
            const datasets = [
                { label: 'A', data: [{ x: 'site-1', y: 10 }] },
                { label: 'B', data: [{ x: 'site-1', y: 20 }] },
            ];
            const plugins = getPlugins({
                ...baseSpec,
                annotations: {
                    labels: {
                        total: { display: true, placement: 'outside' },
                    },
                },
            });
            const total = plugins.datalabels.labels.total;
            const context = makeContext({ datasetIndex: 1, datasets });

            expect(total.anchor(context)).toBe('end');
            expect(total.align(context)).toBe('end');
        });

        test('total annotation shows visible-only total when a group is disabled via legend', () => {
            const datasets = [
                { label: 'A', data: [{ x: 'cat', y: 10 }] },
                { label: 'B', data: [{ x: 'cat', y: 20 }] },
            ];
            const plugins = getPlugins({
                ...baseSpec,
                annotations: { labels: { total: { display: true } } },
            });
            const total = plugins.datalabels.labels.total;
            // Dataset 0 (A=10) is hidden; only B=20 is visible.
            const context = makeContext({
                datasetIndex: 1,
                datasets,
                hidden: [0],
            });

            expect(total.formatter(datasets[1].data[0], context)).toBe('20');
        });

        test('total annotation still shows full total when all groups are visible', () => {
            const datasets = [
                { label: 'A', data: [{ x: 'cat', y: 10 }] },
                { label: 'B', data: [{ x: 'cat', y: 20 }] },
            ];
            const plugins = getPlugins({
                ...baseSpec,
                annotations: { labels: { total: { display: true } } },
            });
            const total = plugins.datalabels.labels.total;
            const context = makeContext({ datasetIndex: 1, datasets });

            expect(total.formatter(datasets[1].data[0], context)).toBe('30');
        });

        test('total annotation excludes dynamicCategoryAxis-hidden groups', () => {
            const datasets = [
                {
                    label: 'A',
                    data: [],
                    _backup_: [{ x: 'cat', y: 10 }],
                },
                { label: 'B', data: [{ x: 'cat', y: 20 }] },
            ];
            const plugins = getPlugins({
                ...baseSpec,
                annotations: { labels: { total: { display: true } } },
            });
            const total = plugins.datalabels.labels.total;
            // Dataset 0 hidden via dynamicCategoryAxis (_backup_ set, isDatasetVisible false)
            const context = makeContext({
                datasetIndex: 1,
                datasets,
                hidden: [0],
            });

            expect(total.formatter(datasets[1].data[0], context)).toBe('20');
        });

        describe('segment label dynamic contrast color', () => {
            function makeContextWithBg(backgroundColor) {
                return {
                    datasetIndex: 0,
                    dataIndex: 0,
                    dataset: {
                        data: [{ x: 'A', y: 10 }],
                        backgroundColor,
                    },
                    chart: {
                        data: { datasets: [{ data: [{ x: 'A', y: 10 }] }] },
                        options: { indexAxis: 'x' },
                        isDatasetVisible: () => true,
                        getDatasetMeta: () => ({ data: [{ height: 30 }] }),
                    },
                };
            }

            test('segment color is a function when no explicit color is set', () => {
                const plugins = getPlugins({
                    ...baseSpec,
                    annotations: { labels: { segment: { display: true } } },
                });
                expect(typeof plugins.datalabels.labels.segment.color).toBe(
                    'function'
                );
            });

            test('returns white text for dark bar (#4e79a7)', () => {
                const plugins = getPlugins({
                    ...baseSpec,
                    annotations: { labels: { segment: { display: true } } },
                });
                const context = makeContextWithBg('#4e79a7');
                expect(plugins.datalabels.labels.segment.color(context)).toBe(
                    '#ffffff'
                );
            });

            test('returns white text for dark bar (#9c755f)', () => {
                const plugins = getPlugins({
                    ...baseSpec,
                    annotations: { labels: { segment: { display: true } } },
                });
                const context = makeContextWithBg('#9c755f');
                expect(plugins.datalabels.labels.segment.color(context)).toBe(
                    '#ffffff'
                );
            });

            test('returns dark text for light bar (#edc948)', () => {
                const plugins = getPlugins({
                    ...baseSpec,
                    annotations: { labels: { segment: { display: true } } },
                });
                const context = makeContextWithBg('#edc948');
                expect(plugins.datalabels.labels.segment.color(context)).toBe(
                    '#333333'
                );
            });

            test('explicit color option overrides dynamic color', () => {
                const plugins = getPlugins({
                    ...baseSpec,
                    annotations: {
                        labels: {
                            segment: { display: true, color: '#ff0000' },
                        },
                    },
                });
                expect(plugins.datalabels.labels.segment.color).toBe('#ff0000');
            });

            test('falls back to dark text when backgroundColor is missing', () => {
                const plugins = getPlugins({
                    ...baseSpec,
                    annotations: { labels: { segment: { display: true } } },
                });
                const context = makeContextWithBg(undefined);
                expect(plugins.datalabels.labels.segment.color(context)).toBe(
                    '#333333'
                );
            });

            test("segment placement='end' uses static '#333333' (no dynamic contrast)", () => {
                const plugins = getPlugins({
                    ...baseSpec,
                    annotations: {
                        labels: {
                            segment: { display: true, placement: 'end' },
                        },
                    },
                });
                expect(plugins.datalabels.labels.segment.color).toBe('#333333');
            });

            test("segment placement='end' with explicit color uses that color", () => {
                const plugins = getPlugins({
                    ...baseSpec,
                    annotations: {
                        labels: {
                            segment: {
                                display: true,
                                placement: 'end',
                                color: '#ff0000',
                            },
                        },
                    },
                });
                expect(plugins.datalabels.labels.segment.color).toBe('#ff0000');
            });
        });
    });

    describe('tooltip', () => {
        test('tooltip is enabled by default', () => {
            const spec = {
                mapping: {},
                scales: { fill: {} },
                labels: {},
                tooltip: {},
            };
            const plugins = getPlugins(spec);
            expect(plugins.tooltip.enabled).toBe(true);
        });

        test('passes through tooltip callbacks from spec', () => {
            const afterLabel = jest.fn();
            const spec = {
                mapping: {},
                scales: { fill: {} },
                labels: {},
                tooltip: { callbacks: { afterLabel } },
            };
            const plugins = getPlugins(spec);
            expect(plugins.tooltip.callbacks.afterLabel).toBe(afterLabel);
        });

        test('tooltip callbacks are undefined when not specified', () => {
            const spec = {
                mapping: {},
                scales: { fill: {} },
                labels: {},
                tooltip: {},
            };
            const plugins = getPlugins(spec);
            expect(plugins.tooltip.callbacks).toBeUndefined();
        });

        describe("position='fill' percentage label", () => {
            function makeContext({ pct, datasetLabel, indexAxis = 'x' }) {
                return {
                    parsed: {
                        x: indexAxis === 'y' ? pct : 0,
                        y: indexAxis === 'x' ? pct : 0,
                    },
                    dataset: { label: datasetLabel },
                    chart: { options: { indexAxis } },
                };
            }

            test('injects a label callback when position is fill', () => {
                const spec = {
                    mapping: {},
                    scales: { fill: {} },
                    labels: {},
                    tooltip: {},
                    position: 'fill',
                };
                const plugins = getPlugins(spec);
                expect(typeof plugins.tooltip.callbacks?.label).toBe(
                    'function'
                );
            });

            test('does not inject a label callback when position is not fill', () => {
                const spec = {
                    mapping: {},
                    scales: { fill: {} },
                    labels: {},
                    tooltip: {},
                };
                const plugins = getPlugins(spec);
                expect(plugins.tooltip.callbacks?.label).toBeUndefined();
            });

            test('formats percentage to one decimal place (vertical)', () => {
                const spec = {
                    mapping: {},
                    scales: { fill: {} },
                    labels: {},
                    tooltip: {},
                    position: 'fill',
                };
                const plugins = getPlugins(spec);
                const ctx = makeContext({ pct: 33.333, datasetLabel: 'A' });
                expect(plugins.tooltip.callbacks.label(ctx)).toBe('A: 33.3%');
            });

            test('formats percentage to one decimal place (horizontal)', () => {
                const spec = {
                    mapping: {},
                    scales: { fill: {} },
                    labels: {},
                    tooltip: {},
                    position: 'fill',
                };
                const plugins = getPlugins(spec);
                const ctx = makeContext({
                    pct: 66.666,
                    datasetLabel: 'B',
                    indexAxis: 'y',
                });
                expect(plugins.tooltip.callbacks.label(ctx)).toBe('B: 66.7%');
            });

            test('omits label prefix when dataset has no label', () => {
                const spec = {
                    mapping: {},
                    scales: { fill: {} },
                    labels: {},
                    tooltip: {},
                    position: 'fill',
                };
                const plugins = getPlugins(spec);
                const ctx = makeContext({ pct: 50, datasetLabel: undefined });
                expect(plugins.tooltip.callbacks.label(ctx)).toBe('50.0%');
            });

            test('does not override user-provided label callback', () => {
                const customLabel = jest.fn(() => 'custom');
                const spec = {
                    mapping: {},
                    scales: { fill: {} },
                    labels: {},
                    tooltip: { callbacks: { label: customLabel } },
                    position: 'fill',
                };
                const plugins = getPlugins(spec);
                expect(plugins.tooltip.callbacks.label).toBe(customLabel);
            });

            test('preserves other user-provided callbacks alongside fill label', () => {
                const afterLabel = jest.fn();
                const spec = {
                    mapping: {},
                    scales: { fill: {} },
                    labels: {},
                    tooltip: { callbacks: { afterLabel } },
                    position: 'fill',
                };
                const plugins = getPlugins(spec);
                expect(plugins.tooltip.callbacks.afterLabel).toBe(afterLabel);
                expect(typeof plugins.tooltip.callbacks.label).toBe('function');
            });
        });
    });

    describe('subtitle (captions)', () => {
        const baseSpec = {
            mapping: {},
            scales: { fill: {} },
            labels: {},
            tooltip: {},
        };

        test('subtitle is hidden when labels.captions is absent', () => {
            const plugins = getPlugins(baseSpec);
            expect(plugins.subtitle.display).toBe(false);
        });

        test('subtitle is hidden when labels.captions is undefined', () => {
            const spec = { ...baseSpec, labels: { captions: undefined } };
            const plugins = getPlugins(spec);
            expect(plugins.subtitle.display).toBe(false);
        });

        test('subtitle is hidden when labels.captions is null', () => {
            const spec = { ...baseSpec, labels: { captions: null } };
            const plugins = getPlugins(spec);
            expect(plugins.subtitle.display).toBe(false);
        });

        test('subtitle is hidden when labels.captions is an empty array', () => {
            const spec = { ...baseSpec, labels: { captions: [] } };
            const plugins = getPlugins(spec);
            expect(plugins.subtitle.display).toBe(false);
        });

        test('subtitle is hidden when labels.captions is an empty string', () => {
            const spec = { ...baseSpec, labels: { captions: '' } };
            const plugins = getPlugins(spec);
            expect(plugins.subtitle.display).toBe(false);
        });

        test('subtitle is displayed when labels.captions is a non-empty string', () => {
            const spec = {
                ...baseSpec,
                labels: { captions: 'Source: Study XYZ' },
            };
            const plugins = getPlugins(spec);
            expect(plugins.subtitle.display).toBe(true);
        });

        test('subtitle text is an array when captions is a string', () => {
            const spec = {
                ...baseSpec,
                labels: { captions: 'Source: Study XYZ' },
            };
            const plugins = getPlugins(spec);
            expect(plugins.subtitle.text).toEqual(['Source: Study XYZ']);
        });

        test('subtitle is displayed when labels.captions is a non-empty array', () => {
            const spec = {
                ...baseSpec,
                labels: { captions: ['Caption one', 'Caption two'] },
            };
            const plugins = getPlugins(spec);
            expect(plugins.subtitle.display).toBe(true);
        });

        test('subtitle text preserves array order', () => {
            const captions = ['Caption one', 'Caption two', 'Caption three'];
            const spec = { ...baseSpec, labels: { captions } };
            const plugins = getPlugins(spec);
            expect(plugins.subtitle.text).toEqual(captions);
        });

        test('subtitle position defaults to bottom', () => {
            const spec = {
                ...baseSpec,
                labels: { captions: 'Source: Study XYZ' },
            };
            const plugins = getPlugins(spec);
            expect(plugins.subtitle.position).toBe('bottom');
        });

        test('subtitle align defaults to start (left)', () => {
            const spec = {
                ...baseSpec,
                labels: { captions: 'Source: Study XYZ' },
            };
            const plugins = getPlugins(spec);
            expect(plugins.subtitle.align).toBe('start');
        });

        describe('captionsOptions', () => {
            test('overrides position when provided', () => {
                const spec = {
                    ...baseSpec,
                    labels: {
                        captions: 'Footnote',
                        captionsOptions: { position: 'top' },
                    },
                };
                const plugins = getPlugins(spec);
                expect(plugins.subtitle.position).toBe('top');
            });

            test('overrides align when provided', () => {
                const spec = {
                    ...baseSpec,
                    labels: {
                        captions: 'Footnote',
                        captionsOptions: { align: 'end' },
                    },
                };
                const plugins = getPlugins(spec);
                expect(plugins.subtitle.align).toBe('end');
            });

            test('preserves defaults when captionsOptions is absent', () => {
                const spec = {
                    ...baseSpec,
                    labels: { captions: 'Footnote' },
                };
                const plugins = getPlugins(spec);
                expect(plugins.subtitle.position).toBe('bottom');
                expect(plugins.subtitle.align).toBe('start');
            });

            test('passes arbitrary Chart.js subtitle options through', () => {
                const font = { size: 10, style: 'italic' };
                const spec = {
                    ...baseSpec,
                    labels: {
                        captions: 'Footnote',
                        captionsOptions: { font },
                    },
                };
                const plugins = getPlugins(spec);
                expect(plugins.subtitle.font).toEqual(font);
            });

            test('does not bleed captionsOptions.text over captions array', () => {
                const spec = {
                    ...baseSpec,
                    labels: {
                        captions: 'Real caption',
                        captionsOptions: { text: 'should be ignored' },
                    },
                };
                const plugins = getPlugins(spec);
                expect(plugins.subtitle.text).toEqual(['Real caption']);
            });
        });
    });
});
