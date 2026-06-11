/**
 * @jest-environment jsdom
 */

import bars from '../../src/bars.js';

global.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
};

const data = [
    { category: 'A', value: 10 },
    { category: 'B', value: 20 },
    { category: 'C', value: 30 },
];
const spec = { mapping: { x: 'category', y: 'value' } };

function makeChart(specOverrides = {}) {
    const container = document.createElement('div');
    return bars(container, data, { ...spec, ...specOverrides });
}

function simulateClick(chart, datasetIndex, index) {
    const activeElements = [{ datasetIndex, index }];
    chart.options.onClick({}, activeElements, chart);
}

function simulateHover(chart, datasetIndex, index) {
    const target = { style: { cursor: '' } };
    const event = { native: { target } };
    const activeElements = index !== undefined ? [{ datasetIndex, index }] : [];
    chart.options.onHover(event, activeElements, chart);
    return target;
}

describe('bars callbacks', () => {
    describe('onClick', () => {
        test('calls spec.callbacks.onClick with the clicked point', () => {
            const onClick = jest.fn();
            const chart = makeChart({ callbacks: { onClick } });
            simulateClick(chart, 0, 1);
            expect(onClick).toHaveBeenCalledTimes(1);
            const [point] = onClick.mock.calls[0];
            expect(point.x).toBe('B');
            expect(point.y).toBe(20);
        });

        test('passes the event as the second argument', () => {
            const onClick = jest.fn();
            const chart = makeChart({ callbacks: { onClick } });
            const event = { type: 'click' };
            chart.options.onClick(event, [{ datasetIndex: 0, index: 0 }], chart);
            const [, receivedEvent] = onClick.mock.calls[0];
            expect(receivedEvent).toBe(event);
        });

        test('point includes _datum referencing the original data row', () => {
            const onClick = jest.fn();
            const chart = makeChart({ callbacks: { onClick } });
            simulateClick(chart, 0, 0);
            const [point] = onClick.mock.calls[0];
            expect(point._datum).toEqual({ category: 'A', value: 10 });
        });

        test('does not call onClick when clicking empty space (no activeElements)', () => {
            const onClick = jest.fn();
            const chart = makeChart({ callbacks: { onClick } });
            chart.options.onClick({}, [], chart);
            expect(onClick).not.toHaveBeenCalled();
        });

        test('does not throw when no callbacks are provided', () => {
            const chart = makeChart();
            expect(() => chart.options.onClick({}, [], chart)).not.toThrow();
            expect(() =>
                chart.options.onClick({}, [{ datasetIndex: 0, index: 0 }], chart)
            ).not.toThrow();
        });
    });

    describe('onHover', () => {
        test('calls spec.callbacks.onHover with the hovered point', () => {
            const onHover = jest.fn();
            const chart = makeChart({ callbacks: { onHover } });
            simulateHover(chart, 0, 2);
            expect(onHover).toHaveBeenCalledTimes(1);
            const [point] = onHover.mock.calls[0];
            expect(point.x).toBe('C');
            expect(point.y).toBe(30);
        });

        test('passes the event as the second argument to onHover', () => {
            const onHover = jest.fn();
            const chart = makeChart({ callbacks: { onHover } });
            const target = { style: { cursor: '' } };
            const event = { native: { target } };
            chart.options.onHover(event, [{ datasetIndex: 0, index: 0 }], chart);
            const [, receivedEvent] = onHover.mock.calls[0];
            expect(receivedEvent).toBe(event);
        });

        test('sets cursor to pointer when hovering a bar with onHover callback', () => {
            const chart = makeChart({ callbacks: { onHover: jest.fn() } });
            const target = simulateHover(chart, 0, 0);
            expect(target.style.cursor).toBe('pointer');
        });

        test('sets cursor to pointer when hovering a bar with onClick callback (no onHover)', () => {
            const chart = makeChart({ callbacks: { onClick: jest.fn() } });
            const target = simulateHover(chart, 0, 0);
            expect(target.style.cursor).toBe('pointer');
        });

        test('resets cursor to default when not hovering a bar', () => {
            const chart = makeChart({ callbacks: { onHover: jest.fn() } });
            const target = simulateHover(chart, undefined, undefined);
            expect(target.style.cursor).toBe('default');
        });

        test('does not call onHover when not hovering a bar', () => {
            const onHover = jest.fn();
            const chart = makeChart({ callbacks: { onHover } });
            simulateHover(chart, undefined, undefined);
            expect(onHover).not.toHaveBeenCalled();
        });

        test('does not throw when no callbacks are provided', () => {
            const chart = makeChart();
            const target = { style: { cursor: '' } };
            const event = { native: { target } };
            expect(() =>
                chart.options.onHover(event, [{ datasetIndex: 0, index: 0 }], chart)
            ).not.toThrow();
            expect(() =>
                chart.options.onHover(event, [], chart)
            ).not.toThrow();
        });

        test('does not set cursor when no callbacks are provided', () => {
            const chart = makeChart();
            const target = { style: { cursor: '' } };
            const event = { native: { target } };
            chart.options.onHover(event, [{ datasetIndex: 0, index: 0 }], chart);
            expect(target.style.cursor).toBe('');
        });

        test('does not throw when event.native is null', () => {
            const chart = makeChart({ callbacks: { onClick: jest.fn() } });
            const event = { native: null };
            expect(() =>
                chart.options.onHover(event, [{ datasetIndex: 0, index: 0 }], chart)
            ).not.toThrow();
        });

        test('does not throw when event.native is undefined', () => {
            const chart = makeChart({ callbacks: { onHover: jest.fn() } });
            const event = {};
            expect(() =>
                chart.options.onHover(event, [{ datasetIndex: 0, index: 0 }], chart)
            ).not.toThrow();
        });
    });

    describe('multi-series', () => {
        const multiData = [
            { category: 'A', value: 10, group: 'X' },
            { category: 'A', value: 5, group: 'Y' },
            { category: 'B', value: 20, group: 'X' },
        ];

        test('onClick receives point with _fill from the correct dataset', () => {
            const onClick = jest.fn();
            const container = document.createElement('div');
            const chart = bars(container, multiData, {
                mapping: { x: 'category', y: 'value', fill: 'group' },
                callbacks: { onClick },
            });
            // Dataset 0 = 'X' group
            chart.options.onClick({}, [{ datasetIndex: 0, index: 0 }], chart);
            const [point] = onClick.mock.calls[0];
            expect(point._fill).toBe('X');
        });
    });
});
