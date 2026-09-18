/**
 * @jest-environment jsdom
 */

import points from '../../src/points.js';

global.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
};

const data = [
    { x: 1, y: 2, id: 'A', group: 'Control' },
    { x: 3, y: 4, id: 'B', group: 'Treatment' },
];

function makeChart(callbacks = {}) {
    const container = document.createElement('div');
    document.body.appendChild(container);
    const chart = points(container, data, {
        mapping: {
            x: 'x',
            y: 'y',
            key: 'id',
            color: 'group',
        },
        callbacks,
    });

    return { chart, container };
}

describe('points pointer callbacks', () => {
    const rendered = [];

    afterEach(() => {
        rendered.splice(0).forEach(({ chart, container }) => {
            chart.destroy();
            container.remove();
        });
    });

    function render(callbacks) {
        const result = makeChart(callbacks);
        rendered.push(result);
        return result.chart;
    }

    test('calls onClick only for a hit point with its original row', () => {
        const onClick = jest.fn();
        const chart = render({ onClick });
        const event = { type: 'click' };

        chart.options.onClick(event, [{ datasetIndex: 1, index: 0 }], chart);

        expect(onClick).toHaveBeenCalledTimes(1);
        expect(onClick).toHaveBeenCalledWith(
            expect.objectContaining({
                x: 3,
                y: 4,
                _key: 'B',
                _color: 'Treatment',
                _datum: data[1],
            }),
            event
        );

        chart.options.onClick(event, [], chart);
        expect(onClick).toHaveBeenCalledTimes(1);
    });

    test('calls onHover only for a hit point and manages the cursor', () => {
        const onHover = jest.fn();
        const chart = render({ onHover });
        const target = { style: { cursor: '' } };
        const event = { native: { target } };

        chart.options.onHover(event, [{ datasetIndex: 0, index: 0 }], chart);

        expect(onHover).toHaveBeenCalledWith(
            expect.objectContaining({
                _key: 'A',
                _datum: data[0],
            }),
            event
        );
        expect(target.style.cursor).toBe('pointer');

        chart.options.onHover(event, [], chart);
        expect(onHover).toHaveBeenCalledTimes(1);
        expect(target.style.cursor).toBe('default');
    });

    test('uses a pointer for clickable points without an onHover callback', () => {
        const chart = render({ onClick: jest.fn() });
        const target = { style: { cursor: '' } };

        chart.options.onHover(
            { native: { target } },
            [{ datasetIndex: 0, index: 0 }],
            chart
        );

        expect(target.style.cursor).toBe('pointer');
    });

    test('clears a stale pointer after callbacks are removed', () => {
        const chart = render();
        const target = { style: { cursor: 'pointer' } };

        chart.options.onHover(
            { native: { target } },
            [{ datasetIndex: 0, index: 0 }],
            chart
        );

        expect(target.style.cursor).toBe('default');
    });

    test('tolerates events without a native target', () => {
        const chart = render({ onHover: jest.fn() });

        expect(() =>
            chart.options.onHover({}, [{ datasetIndex: 0, index: 0 }], chart)
        ).not.toThrow();
    });
});
