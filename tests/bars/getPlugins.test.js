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
            // Mock chart that mirrors Chart.js visibility API:
            // isDatasetVisible / hide / show use an internal _meta map,
            // matching how Chart.js 3 tracks runtime visibility.
            function makeChart(datasets, allLabels, orientation = 'vertical', initiallyHidden = []) {
                const _meta = {};
                initiallyHidden.forEach((i) => { _meta[i] = true; });
                return {
                    data: {
                        datasets,
                        labels: [...allLabels],
                        _allLabels_: [...allLabels],
                        _spec_: { orientation },
                    },
                    _meta,
                    update: jest.fn(),
                    isDatasetVisible(i) { return this._meta[i] !== true; },
                    hide(i) { this._meta[i] = true; },
                    show(i) { this._meta[i] = false; },
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

            test('toggles the clicked dataset hidden state from visible to hidden', () => {
                const spec = {
                    ...baseSpec,
                    theme: { dynamicCategoryAxis: true, orientation: 'vertical' },
                };
                const plugins = getPlugins(spec);

                const ds0 = makeDataset('A', ['cat1', 'cat2']);
                const ds1 = makeDataset('B', ['cat2', 'cat3']);
                const chart = makeChart([ds0, ds1], ['cat1', 'cat2', 'cat3']);

                clickLegend(plugins, chart, 0);

                expect(chart.isDatasetVisible(0)).toBe(false);
            });

            test('toggles the clicked dataset hidden state from hidden to visible', () => {
                const spec = {
                    ...baseSpec,
                    theme: { dynamicCategoryAxis: true, orientation: 'vertical' },
                };
                const plugins = getPlugins(spec);

                const ds0 = makeDataset('A', ['cat1', 'cat2']);
                const ds1 = makeDataset('B', ['cat2', 'cat3']);
                const chart = makeChart([ds0, ds1], ['cat1', 'cat2', 'cat3'], 'vertical', [0]);

                clickLegend(plugins, chart, 0);

                expect(chart.isDatasetVisible(0)).toBe(true);
            });

            test('filters labels to categories in visible datasets only', () => {
                const spec = {
                    ...baseSpec,
                    theme: { dynamicCategoryAxis: true, orientation: 'vertical' },
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
                    theme: { dynamicCategoryAxis: true, orientation: 'vertical' },
                };
                const plugins = getPlugins(spec);

                const ds0 = makeDataset('A', ['cat1', 'cat2']);
                const ds1 = makeDataset('B', ['cat2', 'cat3']);
                const chart = makeChart([ds0, ds1], ['cat1', 'cat2', 'cat3'], 'vertical', [0]);

                // Re-show dataset A — cat1 should come back
                clickLegend(plugins, chart, 0);

                expect(chart.data.labels).toEqual(['cat1', 'cat2', 'cat3']);
            });

            test('preserves original category order from _allLabels_', () => {
                const spec = {
                    ...baseSpec,
                    theme: { dynamicCategoryAxis: true, orientation: 'vertical' },
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
                    theme: { dynamicCategoryAxis: true, orientation: 'vertical' },
                };
                const plugins = getPlugins(spec);

                const ds0 = makeDataset('A', ['cat1']);
                const ds1 = makeDataset('B', ['cat2']);
                const chart = makeChart([ds0, ds1], ['cat1', 'cat2']);

                clickLegend(plugins, chart, 0);

                expect(chart.update).toHaveBeenCalledTimes(1);
            });

            test('uses y key for category values in horizontal orientation', () => {
                const spec = {
                    ...baseSpec,
                    theme: { dynamicCategoryAxis: true, orientation: 'horizontal' },
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
                const chart = makeChart([ds0, ds1], ['cat1', 'cat2', 'cat3'], 'horizontal');

                // Hide dataset A — cat1 exclusive to A
                clickLegend(plugins, chart, 0);

                expect(chart.data.labels).toEqual(['cat2', 'cat3']);
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
    });
});
