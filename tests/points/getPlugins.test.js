import getPlugins from '../../src/points/getPlugins.js';

const spec = {
    mapping: { x: 'xValue', y: 'yValue' },
    scales: { color: { label: undefined } },
    labels: {
        title: undefined,
        caption: undefined,
        description: undefined,
    },
};

describe('points/getPlugins', () => {
    test('disables title, caption, and legend by default', () => {
        expect(getPlugins(spec)).toEqual({
            title: { display: false, text: '' },
            subtitle: {
                display: false,
                position: 'bottom',
                align: 'start',
                text: '',
            },
            legend: { display: false },
            tooltip: {},
        });
    });

    test('renders title and caption labels', () => {
        expect(
            getPlugins({
                ...spec,
                labels: {
                    title: 'Point chart',
                    caption: 'Source: simulated data',
                    description: 'Accessible description',
                },
            })
        ).toEqual({
            title: { display: true, text: 'Point chart' },
            subtitle: {
                display: true,
                position: 'bottom',
                align: 'start',
                text: 'Source: simulated data',
            },
            legend: { display: false },
            tooltip: {},
        });
    });

    describe('color legend', () => {
        test('shows the legend with the mapping name as its title', () => {
            const plugins = getPlugins({
                ...spec,
                mapping: { ...spec.mapping, color: 'treatment' },
            });

            expect(plugins.legend).toEqual({
                display: true,
                title: {
                    display: true,
                    text: 'treatment',
                },
            });
        });

        test.each([null, ''])('hides the title for explicit %p', (label) => {
            const plugins = getPlugins({
                ...spec,
                mapping: { ...spec.mapping, color: 'treatment' },
                scales: { color: { label } },
            });

            expect(plugins.legend.display).toBe(true);
            expect(plugins.legend.title).toEqual({
                display: false,
                text: '',
            });
        });

        test('uses an explicit legend title', () => {
            const plugins = getPlugins({
                ...spec,
                mapping: { ...spec.mapping, color: 'treatment' },
                scales: { color: { label: 'Treatment arm' } },
            });

            expect(plugins.legend.title).toEqual({
                display: true,
                text: 'Treatment arm',
            });
        });

        test('builds the tooltip plugin from the merged spec', () => {
            const formatter = jest.fn(() => 'Custom');
            const plugins = getPlugins({
                ...spec,
                tooltip: {
                    formatter,
                    format: '{x}',
                    mode: 'nearest',
                    intersect: false,
                },
            });
            const point = {
                x: 1,
                y: 2,
                _key: 0,
                _datum: { xValue: 1, yValue: 2 },
            };
            const context = { raw: point };

            expect(plugins.tooltip.mode).toBe('nearest');
            expect(plugins.tooltip.intersect).toBe(false);
            expect(plugins.tooltip.format).toBeUndefined();
            expect(plugins.tooltip.callbacks.label(context)).toBe('Custom');
            expect(formatter).toHaveBeenCalledWith(
                point,
                context,
                expect.objectContaining({
                    x: 1,
                    y: 2,
                    key: 0,
                    datum: point._datum,
                })
            );
        });

        describe('shape and composite legends', () => {
            test('shows a point-style legend for shape-only charts', () => {
                const plugins = getPlugins({
                    ...spec,
                    mapping: { ...spec.mapping, shape: 'marker' },
                    scales: {
                        ...spec.scales,
                        shape: { label: undefined },
                    },
                });

                expect(plugins.legend.display).toBe(true);
                expect(plugins.legend.title).toEqual({
                    display: true,
                    text: 'marker',
                });
                expect(plugins.legend.labels.usePointStyle).toBe(true);
            });

            test('describes different color and shape mappings together', () => {
                const plugins = getPlugins({
                    ...spec,
                    mapping: {
                        ...spec.mapping,
                        color: 'arm',
                        shape: 'status',
                    },
                    scales: {
                        color: { label: 'Treatment' },
                        shape: { label: 'Visit status' },
                    },
                });

                expect(plugins.legend.title.text).toBe(
                    'Treatment / Visit status'
                );
            });

            test('uses one title when color and shape map the same field', () => {
                const plugins = getPlugins({
                    ...spec,
                    mapping: {
                        ...spec.mapping,
                        color: 'group',
                        shape: 'group',
                    },
                    scales: {
                        color: { label: undefined },
                        shape: { label: undefined },
                    },
                });

                expect(plugins.legend.title.text).toBe('group');
            });

            test('honors an explicit shape title for a shared field', () => {
                const plugins = getPlugins({
                    ...spec,
                    mapping: {
                        ...spec.mapping,
                        color: 'group',
                        shape: 'group',
                    },
                    scales: {
                        color: { label: undefined },
                        shape: { label: 'Status' },
                    },
                });

                expect(plugins.legend.title).toEqual({
                    display: true,
                    text: 'Status',
                });
            });

            test.each([null, ''])(
                'honors an explicit shared color title value of %p',
                (label) => {
                    const plugins = getPlugins({
                        ...spec,
                        mapping: {
                            ...spec.mapping,
                            color: 'group',
                            shape: 'group',
                        },
                        scales: {
                            color: { label },
                            shape: { label: 'Status' },
                        },
                    });

                    expect(plugins.legend.title).toEqual({
                        display: false,
                        text: '',
                    });
                }
            );
        });
    });

    describe('line annotations', () => {
        test('configures reference lines for the annotation plugin', () => {
            const plugins = getPlugins({
                ...spec,
                annotations: {
                    referenceLines: [{ axis: 'y', value: 5 }],
                    lines: [],
                },
            });

            expect(plugins.annotation.annotations).toEqual([
                expect.objectContaining({
                    type: 'line',
                    yMin: 5,
                    yMax: 5,
                }),
            ]);
            expect(plugins.annotation.clip).toBe(false);
        });

        test('shows only opted-in line datasets in the legend', () => {
            const plugins = getPlugins({
                ...spec,
                annotations: {
                    referenceLines: [],
                    lines: [{ showInLegend: false }, { showInLegend: true }],
                },
            });
            const point = { label: '' };
            const hiddenLine = {
                label: 'Hidden',
                _annotation: true,
                _showInLegend: false,
            };
            const visibleLine = {
                label: 'Visible',
                _annotation: true,
                _showInLegend: true,
            };
            const chartData = {
                datasets: [point, hiddenLine, visibleLine],
            };

            expect(plugins.legend.display).toBe(true);
            expect(
                [0, 1, 2].filter((datasetIndex) =>
                    plugins.legend.labels.filter({ datasetIndex }, chartData)
                )
            ).toEqual([2]);
        });

        test('keeps point groups when filtering annotation legends', () => {
            const plugins = getPlugins({
                ...spec,
                mapping: { ...spec.mapping, color: 'group' },
                annotations: {
                    referenceLines: [],
                    lines: [{ showInLegend: false }],
                },
            });
            const chartData = {
                datasets: [
                    { label: 'A' },
                    {
                        label: 'Line',
                        _annotation: true,
                        _showInLegend: false,
                    },
                ],
            };

            expect(
                plugins.legend.labels.filter({ datasetIndex: 0 }, chartData)
            ).toBe(true);
            expect(
                plugins.legend.labels.filter({ datasetIndex: 1 }, chartData)
            ).toBe(false);
        });

        test('excludes annotation datasets before applying a tooltip filter', () => {
            const owner = {};
            const filter = jest.fn(function () {
                return this === owner;
            });
            const plugins = getPlugins({
                ...spec,
                tooltip: { filter },
                annotations: {
                    referenceLines: [],
                    lines: [{}],
                },
            });
            const annotation = { dataset: { _annotation: true } };
            const point = { dataset: {} };

            expect(plugins.tooltip.filter(annotation)).toBe(false);
            expect(filter).not.toHaveBeenCalled();
            expect(plugins.tooltip.filter.call(owner, point)).toBe(true);
            expect(filter).toHaveBeenCalledWith(point);
            expect(plugins.tooltip.mode).toBe('gsmPoints:point');
        });
    });

    describe('point labels', () => {
        test('configures datalabels only when point labels are enabled', () => {
            const enabled = getPlugins({
                ...spec,
                annotations: {
                    labels: {
                        point: { field: 'id' },
                    },
                },
            });
            const disabled = getPlugins({
                ...spec,
                annotations: {
                    labels: { point: null },
                },
            });

            expect(enabled.datalabels).toEqual(
                expect.objectContaining({
                    align: 'top',
                    offset: 4,
                })
            );
            expect(disabled.datalabels).toBeUndefined();
        });
    });
});
