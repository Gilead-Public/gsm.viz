/**
 * @jest-environment jsdom
 */

import bars from '../../src/bars.js';

// Mock ResizeObserver for tests that attach elements to document.body.
global.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
};

const singleSeriesData = [
    { category: 'A', value: 10 },
    { category: 'B', value: 20 },
    { category: 'C', value: 30 },
];
const singleSeriesSpec = { mapping: { x: 'category', y: 'value' } };

const multiSeriesData = [
    { category: 'A', value: 10, group: 'X' },
    { category: 'A', value: 5, group: 'Y' },
    { category: 'B', value: 20, group: 'X' },
    { category: 'B', value: 15, group: 'Y' },
];
const multiSeriesSpec = {
    mapping: { x: 'category', y: 'value', fill: 'group' },
};

describe('bars entry point', () => {
    const container = document.createElement('div');

    test('renders with minimal spec', () => {
        const instance = bars(container, singleSeriesData, singleSeriesSpec);
        expect(instance).not.toBeNull();
        expect(instance.data.datasets).toHaveLength(1);
    });

    test('renders with multi-series spec', () => {
        const instance = bars(container, multiSeriesData, multiSeriesSpec);
        expect(instance).not.toBeNull();
        expect(instance.data.datasets).toHaveLength(2);
    });

    test('renders with empty data', () => {
        const instance = bars(container, [], { mapping: { x: 'a', y: 'b' } });
        expect(instance).not.toBeNull();
    });

    test('renders horizontal bars', () => {
        const instance = bars(container, singleSeriesData, {
            ...singleSeriesSpec,
            orientation: 'horizontal',
        });
        expect(instance.options.indexAxis).toBe('y');
    });

    test('renders vertical bars by default', () => {
        const instance = bars(container, singleSeriesData, singleSeriesSpec);
        expect(instance.options.indexAxis).toBe('x');
    });

    test('applies labels.title as chart title', () => {
        const instance = bars(container, singleSeriesData, {
            ...singleSeriesSpec,
            labels: { title: 'Test Title' },
        });
        expect(instance.options.plugins.title.text).toBe('Test Title');
        expect(instance.options.plugins.title.display).toBe(true);
    });

    test('renders with datalabel annotations enabled', () => {
        const instance = bars(container, singleSeriesData, {
            ...singleSeriesSpec,
            annotations: {
                labels: {
                    segment: { display: true },
                    outside: { display: true },
                },
            },
        });

        expect(
            instance.options.plugins.datalabels.labels.segment
        ).toBeDefined();
        expect(
            instance.options.plugins.datalabels.labels.outside
        ).toBeDefined();
    });

    test('registers the ChartDataLabels plugin for bars charts', () => {
        const instance = bars(container, singleSeriesData, {
            ...singleSeriesSpec,
            annotations: {
                labels: {
                    segment: { display: true },
                },
            },
        });

        expect(
            instance.config.plugins.some((plugin) => plugin.id === 'datalabels')
        ).toBe(true);
    });

    test('attaches helpers to chart instance', () => {
        const instance = bars(container, singleSeriesData, singleSeriesSpec);
        expect(instance.helpers).toBeDefined();
        expect(typeof instance.helpers.updateData).toBe('function');
        expect(typeof instance.helpers.updateSpec).toBe('function');
    });

    test('stores the merged spec on chart.data._spec_', () => {
        const instance = bars(container, singleSeriesData, singleSeriesSpec);
        expect(instance.data._spec_).toBeDefined();
        expect(instance.data._spec_.orientation).toBe('vertical');
    });

    test('respects explicit category order', () => {
        const instance = bars(container, singleSeriesData, {
            ...singleSeriesSpec,
            scales: { x: { order: ['C', 'B', 'A'] } },
        });
        expect(instance.data.labels).toEqual(['C', 'B', 'A']);
    });

    test('stores all labels as a stable snapshot', () => {
        const instance = bars(container, singleSeriesData, singleSeriesSpec);
        const labels = instance.data.labels;

        expect(instance.data._allLabels_).toEqual(labels);
        expect(instance.data._allLabels_).not.toBe(labels);

        labels.pop();
        expect(instance.data._allLabels_).toEqual(['A', 'B', 'C']);
    });

    test('renders count mode when mapping.y is omitted', () => {
        const instance = bars(
            container,
            [{ cat: 'A' }, { cat: 'A' }, { cat: 'B' }],
            { mapping: { x: 'cat' } }
        );
        expect(instance.data.datasets).toHaveLength(1);
        const data = instance.data.datasets[0].data;
        expect(data.find((d) => d.x === 'A').y).toBe(2);
        expect(data.find((d) => d.x === 'B').y).toBe(1);
    });

    test('renders stacked bars with position stack', () => {
        const instance = bars(container, multiSeriesData, {
            ...multiSeriesSpec,
            position: 'stack',
        });
        expect(instance.options.scales.x.stacked).toBe(true);
        expect(instance.options.scales.y.stacked).toBe(true);
    });

    test('renders grouped bars with position dodge', () => {
        const instance = bars(container, multiSeriesData, {
            ...multiSeriesSpec,
            position: 'dodge',
        });
        expect(instance.options.scales.x.stacked).toBeUndefined();
        expect(instance.options.scales.y.stacked).toBeUndefined();
    });

    test('defaults to stacked position', () => {
        const instance = bars(container, multiSeriesData, multiSeriesSpec);
        expect(instance.options.scales.x.stacked).toBe(true);
        expect(instance.options.scales.y.stacked).toBe(true);
    });

    test('applies fill palette colors to datasets', () => {
        const instance = bars(container, multiSeriesData, {
            ...multiSeriesSpec,
            scales: { fill: { palette: ['#ff0000', '#00ff00'] } },
        });
        expect(instance.data.datasets[0].backgroundColor).toBe('#ff0000');
        expect(instance.data.datasets[1].backgroundColor).toBe('#00ff00');
    });

    test('resolves a CSS selector string to a DOM element', () => {
        const div = document.createElement('div');
        div.id = 'bars-test-selector';
        document.body.appendChild(div);
        const instance = bars(
            '#bars-test-selector',
            singleSeriesData,
            singleSeriesSpec
        );
        expect(instance).not.toBeNull();
        expect(instance.data.datasets).toHaveLength(1);
        document.body.removeChild(div);
    });

    test('throws when a CSS selector matches nothing', () => {
        expect(() =>
            bars('#nonexistent', singleSeriesData, singleSeriesSpec)
        ).toThrow('could not find element');
    });

    test('horizontal orientation produces correct data point shape', () => {
        const instance = bars(container, singleSeriesData, {
            ...singleSeriesSpec,
            orientation: 'horizontal',
        });
        const point = instance.data.datasets[0].data[0];
        expect(typeof point.x).toBe('number');
        expect(typeof point.y).toBe('string');
    });

    test('defaults x-axis label to mapping.x variable name', () => {
        const instance = bars(container, singleSeriesData, singleSeriesSpec);
        expect(instance.options.scales.x.title.text).toBe('category');
        expect(instance.options.scales.x.title.display).toBe(true);
    });

    test('defaults y-axis label to mapping.y variable name', () => {
        const instance = bars(container, singleSeriesData, singleSeriesSpec);
        expect(instance.options.scales.y.title.text).toBe('value');
        expect(instance.options.scales.y.title.display).toBe(true);
    });

    test('disables x-axis label when scales.x.label is null', () => {
        const instance = bars(container, singleSeriesData, {
            ...singleSeriesSpec,
            scales: { x: { label: null } },
        });
        expect(instance.options.scales.x.title.display).toBe(false);
    });

    test('uses explicit x-axis label when provided', () => {
        const instance = bars(container, singleSeriesData, {
            ...singleSeriesSpec,
            scales: { x: { label: 'Site' } },
        });
        expect(instance.options.scales.x.title.text).toBe('Site');
    });

    test('defaults legend title to mapping.fill variable name', () => {
        const instance = bars(container, multiSeriesData, multiSeriesSpec);
        expect(instance.options.plugins.legend.title.display).toBe(true);
        expect(instance.options.plugins.legend.title.text).toBe('group');
    });

    test('disables legend title when scales.fill.label is null', () => {
        const instance = bars(container, multiSeriesData, {
            ...multiSeriesSpec,
            scales: { fill: { label: null } },
        });
        expect(instance.options.plugins.legend.title.display).toBe(false);
    });

    test('uses explicit fill label when scales.fill.label is set', () => {
        const instance = bars(container, multiSeriesData, {
            ...multiSeriesSpec,
            scales: { fill: { label: 'Treatment Arm' } },
        });
        expect(instance.options.plugins.legend.title.text).toBe(
            'Treatment Arm'
        );
    });

    describe('dynamicSizing', () => {
        test('sets container height for horizontal bars when dynamicSizing is true', () => {
            const c = document.createElement('div');
            bars(c, singleSeriesData, {
                ...singleSeriesSpec,
                orientation: 'horizontal',
                theme: { dynamicSizing: true },
            });
            // 3 categories × 30px — container drives Chart.js sizing
            expect(c.style.height).toBe('90px');
        });

        test('sets container width for vertical bars when dynamicSizing is true', () => {
            const c = document.createElement('div');
            bars(c, singleSeriesData, {
                ...singleSeriesSpec,
                orientation: 'vertical',
                theme: { dynamicSizing: true },
            });
            // 3 categories × 30px
            expect(c.style.width).toBe('90px');
        });

        test('clears container height when dynamicSizing is false', () => {
            const c = document.createElement('div');
            bars(c, singleSeriesData, {
                ...singleSeriesSpec,
                orientation: 'horizontal',
            });
            expect(c.style.height).toBe('');
        });

        test('clears container width when dynamicSizing is false', () => {
            const c = document.createElement('div');
            bars(c, singleSeriesData, singleSeriesSpec);
            expect(c.style.width).toBe('');
        });

        test('clears height when switching from horizontal to vertical', () => {
            const c = document.createElement('div');
            // First render: horizontal + dynamicSizing
            bars(c, singleSeriesData, {
                ...singleSeriesSpec,
                orientation: 'horizontal',
                theme: { dynamicSizing: true },
            });
            expect(c.style.height).toBe('90px');
            // Second render: vertical + dynamicSizing — height should be cleared
            bars(c, singleSeriesData, {
                ...singleSeriesSpec,
                orientation: 'vertical',
                theme: { dynamicSizing: true },
            });
            expect(c.style.height).toBe('');
            expect(c.style.width).toBe('90px');
        });

        test('clears dynamic dimension when dynamicSizing is disabled', () => {
            const c = document.createElement('div');
            // First render: horizontal + dynamicSizing
            bars(c, singleSeriesData, {
                ...singleSeriesSpec,
                orientation: 'horizontal',
                theme: { dynamicSizing: true },
            });
            expect(c.style.height).toBe('90px');
            // Second render: dynamicSizing disabled — height should be cleared
            bars(c, singleSeriesData, {
                ...singleSeriesSpec,
                orientation: 'horizontal',
            });
            expect(c.style.height).toBe('');
        });
    });
});
