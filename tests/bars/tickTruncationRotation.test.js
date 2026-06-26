/**
 * @jest-environment jsdom
 */

import bars from '../../src/bars.js';

global.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
};

describe('bars tick truncation and rotation integration', () => {
    const container = document.createElement('div');
    const data = [
        { site: 'Site Alpha Center', value: 10 },
        { site: 'Site Beta Hospital', value: 20 },
        { site: 'Short', value: 30 },
    ];

    describe('truncation', () => {
        test('chart has a ticks.callback on category axis when maxLength is set', () => {
            const chart = bars(container, data, {
                mapping: { x: 'site', y: 'value' },
                scales: { x: { ticks: { maxLength: 8 } } },
            });
            const callback = chart.options.scales.x.ticks?.callback;
            expect(typeof callback).toBe('function');
        });

        test('ticks.callback truncates long labels and leaves short ones intact', () => {
            const chart = bars(container, data, {
                mapping: { x: 'site', y: 'value' },
                scales: { x: { ticks: { maxLength: 8 } } },
            });
            const callback = chart.options.scales.x.ticks.callback;
            // Find the index of a long label and a short label
            const longIdx = chart.data.labels.indexOf('Site Alpha Center');
            const shortIdx = chart.data.labels.indexOf('Short');
            const ctx = {
                getLabelForValue: (i) => chart.data.labels[i],
            };
            // 'Site Alpha Center' (17 chars) → truncated to 7 + ellipsis = 8
            expect(callback.call(ctx, longIdx)).toBe('Site Al\u2026');
            // 'Short' (5 chars) → unchanged
            expect(callback.call(ctx, shortIdx)).toBe('Short');
        });

        test('tooltip title callback is injected and returns full label', () => {
            const chart = bars(container, data, {
                mapping: { x: 'site', y: 'value' },
                scales: { x: { ticks: { maxLength: 8 } } },
            });
            const titleFn = chart.options.plugins.tooltip.callbacks?.title;
            expect(typeof titleFn).toBe('function');
            expect(titleFn([{ label: 'Site Alpha Center' }])).toBe(
                'Site Alpha Center'
            );
        });

        test('tooltip title is NOT injected by getPlugins when maxLength is absent', () => {
            const chart = bars(container, data, {
                mapping: { x: 'site', y: 'value' },
            });
            // Our plugin config is stored before Chart.js merges defaults
            const pluginConfig = chart.config.options.plugins;
            expect(pluginConfig.tooltip.callbacks?.title).toBeUndefined();
        });
    });

    describe('rotation', () => {
        test('sets fixed rotation on category axis ticks', () => {
            const chart = bars(container, data, {
                mapping: { x: 'site', y: 'value' },
                scales: { x: { ticks: { rotation: 45 } } },
            });
            expect(chart.options.scales.x.ticks.maxRotation).toBe(45);
            expect(chart.options.scales.x.ticks.minRotation).toBe(45);
        });

        test('rotation applies to y axis in horizontal orientation', () => {
            const chart = bars(container, data, {
                mapping: { x: 'site', y: 'value' },
                orientation: 'horizontal',
                scales: { x: { ticks: { rotation: 30 } } },
            });
            expect(chart.options.scales.y.ticks.maxRotation).toBe(30);
            expect(chart.options.scales.y.ticks.minRotation).toBe(30);
        });
    });

    describe('combined truncation + rotation', () => {
        test('both options work together', () => {
            const chart = bars(container, data, {
                mapping: { x: 'site', y: 'value' },
                scales: { x: { ticks: { maxLength: 6, rotation: 60 } } },
            });
            const ticks = chart.options.scales.x.ticks;
            expect(typeof ticks.callback).toBe('function');
            expect(ticks.maxRotation).toBe(60);
            expect(ticks.minRotation).toBe(60);
        });
    });
});
