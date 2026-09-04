/**
 * @jest-environment jsdom
 */

import points from '../../src/points.js';
import gsmViz from '../../src/main.js';

global.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
};

const data = [
    { xValue: 1, yValue: 2, id: 'A' },
    { xValue: 3, yValue: 4, id: 'B' },
];
const spec = {
    mapping: { x: 'xValue', y: 'yValue', key: 'id' },
};

describe('points entry point', () => {
    let container;

    beforeEach(() => {
        container = document.createElement('div');
        document.body.appendChild(container);
    });

    afterEach(() => {
        container.querySelector('canvas')?.chart?.destroy();
        container.remove();
    });

    test('renders a minimal scatter chart and returns its Chart instance', () => {
        const chart = points(container, data, spec);

        expect(chart).not.toBeNull();
        expect(chart.config.type).toBe('scatter');
        expect(chart.data.datasets).toHaveLength(1);
        expect(chart.data.datasets[0].data).toEqual([
            expect.objectContaining({ x: 1, y: 2, _key: 'A' }),
            expect.objectContaining({ x: 3, y: 4, _key: 'B' }),
        ]);
        expect(chart.options.scales.x.type).toBe('linear');
        expect(chart.options.scales.y.type).toBe('linear');
        expect(chart.options.plugins.legend.display).toBe(false);
    });

    test('stores the merged spec and attaches the chart to its canvas', () => {
        const chart = points(container, data, spec);
        const canvas = container.querySelector('canvas');

        expect(chart.data._spec_.mapping).toEqual(spec.mapping);
        expect(chart.data._spec_.theme.animation).toBe(false);
        expect(canvas.chart).toBe(chart);
    });

    test('applies responsive theme and label options', () => {
        const chart = points(container, data, {
            ...spec,
            scales: {
                x: { label: 'Exposure' },
                y: { label: 'Events' },
            },
            labels: {
                title: 'Safety signals',
                caption: 'Source: simulated data',
            },
            theme: {
                maintainAspectRatio: true,
                animation: true,
            },
        });

        expect(chart.options.responsive).toBe(true);
        expect(chart.options.maintainAspectRatio).toBe(true);
        expect(chart.options.animation).toBe(true);
        expect(chart.options.scales.x.title.text).toBe('Exposure');
        expect(chart.options.scales.y.title.text).toBe('Events');
        expect(chart.options.plugins.title.text).toBe('Safety signals');
        expect(chart.options.plugins.subtitle.text).toBe(
            'Source: simulated data'
        );
    });

    test('renders empty data with an accessible no-data alternative', () => {
        const chart = points(container, [], {
            mapping: { x: 'exposure', y: 'events' },
        });
        const canvas = container.querySelector('canvas');

        expect(chart.data.datasets).toEqual([{ data: [] }]);
        expect(canvas.getAttribute('role')).toBe('img');
        expect(canvas.getAttribute('aria-label')).toContain(
            'No data available.'
        );
        expect(canvas.textContent).toContain('No data available.');
    });

    test('builds an accessible label from chart metadata', () => {
        points(container, data, {
            ...spec,
            scales: {
                x: { label: 'Exposure' },
                y: { label: 'Events' },
            },
            labels: {
                title: 'Safety signals',
                description: 'Comparison across monitored sites.',
            },
        });
        const canvas = container.querySelector('canvas');
        const label = canvas.getAttribute('aria-label');

        expect(canvas.getAttribute('role')).toBe('img');
        expect(label).toContain('Safety signals.');
        expect(label).toContain('Comparison across monitored sites.');
        expect(label).toContain('Point chart of Events by Exposure.');
        expect(label).toContain('2 points.');
        expect(canvas.textContent).toBe(label);
    });

    test('uses singular point text for one row', () => {
        points(container, [data[0]], spec);

        expect(
            container.querySelector('canvas').getAttribute('aria-label')
        ).toContain('1 point.');
    });

    test('resolves a CSS selector and reports a missing selector', () => {
        container.id = 'points-test-container';

        expect(points('#points-test-container', data, spec)).not.toBeNull();
        expect(() => points('#missing-points-container', data, spec)).toThrow(
            'points: could not find element matching "#missing-points-container"'
        );
    });

    test('destroys the previous chart when rendering into the same container', () => {
        const first = points(container, data, spec);
        const destroy = jest.spyOn(first, 'destroy');

        const second = points(container, data, spec);

        expect(destroy).toHaveBeenCalledTimes(1);
        expect(second).not.toBe(first);
        expect(container.querySelectorAll('canvas')).toHaveLength(1);
    });

    test('registers the white background plugin', () => {
        const chart = points(container, data, spec);

        expect(
            chart.config.plugins.some(
                (plugin) => plugin.id === 'customCanvasBackgroundColor'
            )
        ).toBe(true);
    });

    test('renders ordered color groups with a toggleable legend', () => {
        const chart = points(
            container,
            [
                { xValue: 1, yValue: 2, group: 'Treatment' },
                { xValue: 3, yValue: 4, group: 'Control' },
            ],
            {
                mapping: {
                    x: 'xValue',
                    y: 'yValue',
                    color: 'group',
                },
                scales: {
                    color: {
                        order: ['Control', 'Treatment'],
                        colors: {
                            Control: '#123456',
                            Treatment: '#abcdef',
                        },
                        label: 'Arm',
                    },
                },
            }
        );

        expect(chart.data.datasets.map((dataset) => dataset.label)).toEqual([
            'Control',
            'Treatment',
        ]);
        expect(chart.options.plugins.legend.display).toBe(true);
        expect(chart.options.plugins.legend.title.text).toBe('Arm');

        const legendItem = chart.legend.legendItems[0];
        chart.options.plugins.legend.onClick({}, legendItem, chart.legend);

        expect(chart.isDatasetVisible(0)).toBe(false);
        expect(chart.isDatasetVisible(1)).toBe(true);
    });

    test('keeps explicit logarithmic ranges fixed as groups are hidden', () => {
        const chart = points(
            container,
            [
                { xValue: 1, yValue: 2, group: 'A' },
                { xValue: 100, yValue: 4, group: 'B' },
            ],
            {
                mapping: {
                    x: 'xValue',
                    y: 'yValue',
                    color: 'group',
                },
                scales: {
                    x: {
                        type: 'log',
                        range: [1, 100],
                        breaks: [1, 10, 100],
                        labels: ['1', '10', '100'],
                    },
                },
            }
        );

        expect(chart.options.scales.x.type).toBe('logarithmic');
        expect(chart.options.scales.x.min).toBe(1);
        expect(chart.options.scales.x.max).toBe(100);

        chart.hide(1);
        chart.update('none');

        expect(chart.options.scales.x.min).toBe(1);
        expect(chart.options.scales.x.max).toBe(100);
    });

    test('rejects non-positive log coordinates before rendering', () => {
        expect(() =>
            points(container, [{ xValue: 0, yValue: 2 }], {
                mapping: { x: 'xValue', y: 'yValue' },
                scales: { x: { type: 'log' } },
            })
        ).toThrow(
            'data[0].xValue mapped by spec.mapping.x must be greater than zero for a log scale'
        );
        expect(container.querySelector('canvas')).toBeNull();
    });

    test('includes encoded color and shape levels in its text alternative', () => {
        points(
            container,
            [
                {
                    xValue: 1,
                    yValue: 2,
                    group: 'A',
                    marker: 'Observed',
                },
                {
                    xValue: 3,
                    yValue: 4,
                    group: 'B',
                    marker: 'Expected',
                },
            ],
            {
                mapping: {
                    x: 'xValue',
                    y: 'yValue',
                    color: 'group',
                    shape: 'marker',
                },
            }
        );

        const label = container
            .querySelector('canvas')
            .getAttribute('aria-label');
        expect(label).toContain(
            'Color group values: "A" (string), "B" (string).'
        );
        expect(label).toContain(
            'Shape marker values: "Observed" (string), "Expected" (string).'
        );
    });

    test('distinguishes typed and missing encoding values in its text alternative', () => {
        points(
            container,
            [
                {
                    xValue: 1,
                    yValue: 2,
                    group: 1,
                    marker: '(Missing)',
                },
                {
                    xValue: 3,
                    yValue: 4,
                    group: '1',
                    marker: null,
                },
            ],
            {
                mapping: {
                    x: 'xValue',
                    y: 'yValue',
                    color: 'group',
                    shape: 'marker',
                },
            }
        );

        const label = container
            .querySelector('canvas')
            .getAttribute('aria-label');
        expect(label).toContain(
            'Color group values: 1 (number), "1" (string).'
        );
        expect(label).toContain(
            'Shape marker values: "(Missing)" (string), (Missing) (missing value).'
        );
    });

    test('renders reference and auxiliary line annotations', () => {
        const chart = points(container, data, {
            ...spec,
            annotations: {
                referenceLines: [
                    {
                        axis: 'y',
                        value: 10,
                        label: 'Target',
                        color: '#aa0000',
                    },
                ],
                lines: [
                    {
                        data: [
                            { exposure: 1, limit: 5 },
                            { exposure: 100, limit: 8 },
                        ],
                        mapping: { x: 'exposure', y: 'limit' },
                        label: 'Expected',
                        showInLegend: true,
                    },
                ],
            },
        });
        const line = chart.data.datasets.at(-1);

        expect(line).toEqual(
            expect.objectContaining({
                type: 'line',
                label: 'Expected',
                _annotation: true,
                _showInLegend: true,
            })
        );
        expect(line.data.map(({ x, y }) => ({ x, y }))).toEqual([
            { x: 1, y: 5 },
            { x: 100, y: 8 },
        ]);
        expect(chart.options.plugins.annotation.annotations[0]).toEqual(
            expect.objectContaining({
                yMin: 10,
                yMax: 10,
                borderColor: '#aa0000',
            })
        );
        expect(chart.options.plugins.legend.display).toBe(true);
        expect(chart.options.interaction.mode).toBe('gsmPoints:point');
        expect(chart.options.hover.mode).toBe('gsmPoints:point');
    });

    test('includes annotation geometry in automatic numeric domains', () => {
        const chart = points(container, data, {
            ...spec,
            annotations: {
                referenceLines: [{ axis: 'y', value: 50 }],
                lines: [
                    {
                        data: [
                            { x: 1, y: 1 },
                            { x: 100, y: 40 },
                        ],
                        mapping: { x: 'x', y: 'y' },
                    },
                ],
            },
        });

        expect(chart.scales.x.max).toBeGreaterThanOrEqual(100);
        expect(chart.scales.y.max).toBeGreaterThanOrEqual(50);
    });

    test('keeps fixed domains while rendering out-of-range annotations', () => {
        const chart = points(container, data, {
            ...spec,
            scales: {
                x: { range: [0, 10] },
                y: { range: [0, 10] },
            },
            annotations: {
                referenceLines: [{ axis: 'y', value: 50 }],
                lines: [
                    {
                        data: [{ x: 100, y: 40 }],
                        mapping: { x: 'x', y: 'y' },
                    },
                ],
            },
        });

        expect(chart.scales.x.min).toBe(0);
        expect(chart.scales.x.max).toBe(10);
        expect(chart.scales.y.min).toBe(0);
        expect(chart.scales.y.max).toBe(10);
    });

    test('does not announce annotation data as point encodings', () => {
        points(container, [{ xValue: 1, yValue: 2, group: 'A' }], {
            mapping: {
                x: 'xValue',
                y: 'yValue',
                color: 'group',
            },
            annotations: {
                lines: [
                    {
                        data: [{ x: 1, y: 1 }],
                        mapping: { x: 'x', y: 'y' },
                    },
                ],
            },
        });

        const label = container
            .querySelector('canvas')
            .getAttribute('aria-label');
        expect(label).toContain('Color group values: "A" (string).');
        expect(label).not.toContain('undefined');
    });

    test('registers selective point labels without labeling line datasets', () => {
        const formatter = jest.fn((point) => `Site ${point._datum.id}`);
        const chart = points(
            container,
            [
                { xValue: 1, yValue: 2, id: 'A', flagged: true },
                { xValue: 3, yValue: 4, id: 'B', flagged: false },
            ],
            {
                mapping: {
                    x: 'xValue',
                    y: 'yValue',
                    key: 'id',
                },
                annotations: {
                    labels: {
                        point: {
                            field: 'id',
                            display: 'flagged',
                            formatter,
                        },
                    },
                    lines: [
                        {
                            data: [{ x: 1, y: 1 }],
                            mapping: { x: 'x', y: 'y' },
                        },
                    ],
                },
            }
        );
        expect(
            chart.config.plugins.some((plugin) => plugin.id === 'datalabels')
        ).toBe(true);
        expect(chart.options.plugins.datalabels).toBeDefined();
        expect(formatter).toHaveBeenCalledWith(
            expect.objectContaining({ _key: 'A' }),
            expect.objectContaining({ dataIndex: 0 })
        );
        expect(formatter).not.toHaveBeenCalledWith(
            expect.objectContaining({ _key: 'B' }),
            expect.anything()
        );
    });

    test('does not register datalabels when point labels are disabled', () => {
        const chart = points(container, data, spec);

        expect(
            chart.config.plugins.some((plugin) => plugin.id === 'datalabels')
        ).toBe(false);
    });

    test('surfaces strict coordinate errors before rendering', () => {
        expect(() =>
            points(container, [{ xValue: '1', yValue: 2 }], {
                mapping: { x: 'xValue', y: 'yValue' },
            })
        ).toThrow(
            'data[0].xValue mapped by spec.mapping.x must be a finite number'
        );
    });

    test('is exported from the gsmViz public module', () => {
        expect(gsmViz.points).toBe(points);
    });
});
