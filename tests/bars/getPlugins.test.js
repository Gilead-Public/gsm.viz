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
});
