/**
 * @jest-environment jsdom
 */

import points from '../../src/points.js';
import syncSelection from '../../src/facetPoints/syncSelection.js';

global.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
};

function render(data, overrides = {}) {
    const { mapping, ...rest } = overrides;
    const container = document.createElement('div');
    document.body.appendChild(container);
    const chart = points(container, data, {
        ...rest,
        mapping: { x: 'x', y: 'y', key: 'id', ...(mapping || {}) },
        selection: { enabled: true },
    });
    return { chart, container };
}

describe('facetPoints/syncSelection', () => {
    const rendered = [];

    afterEach(() => {
        rendered.forEach(({ chart, container }) => {
            chart.destroy();
            container.remove();
        });
        rendered.length = 0;
    });

    function add(data, overrides) {
        const result = render(data, overrides);
        rendered.push(result);
        return result.chart;
    }

    test('synchronizes exact mapped point keys and fires only the origin callback', () => {
        const originSelect = jest.fn();
        const siblingSelect = jest.fn();
        const origin = add(
            [
                { x: 1, y: 2, id: 1 },
                { x: 3, y: 4, id: '1' },
            ],
            { callbacks: { onSelect: originSelect } }
        );
        const sibling = add(
            [
                { x: 5, y: 6, id: '1' },
                { x: 7, y: 8, id: 1 },
            ],
            { callbacks: { onSelect: siblingSelect } }
        );

        syncSelection([origin, sibling]);
        origin.helpers.selectPoint(origin, 1);

        expect(origin.helpers.getSelection(origin)).toEqual({
            type: 'point',
            values: [1],
        });
        expect(sibling.helpers.getSelection(sibling)).toEqual({
            type: 'point',
            values: [1],
        });
        expect(originSelect).toHaveBeenCalledTimes(1);
        expect(siblingSelect).not.toHaveBeenCalled();
    });

    test('selects only keys present in each sibling and clears absent matches', () => {
        const origin = add([
            { x: 1, y: 2, id: 'shared' },
            { x: 3, y: 4, id: 'local' },
        ]);
        const sibling = add([{ x: 5, y: 6, id: 'shared' }]);

        syncSelection([origin, sibling]);
        origin.helpers.selectPoint(origin, ['shared', 'local']);
        expect(sibling.helpers.getSelection(sibling)).toEqual({
            type: 'point',
            values: ['shared'],
        });

        origin.helpers.selectPoint(origin, 'local');
        expect(sibling.helpers.getSelection(sibling)).toEqual({
            type: null,
            values: [],
        });
    });

    test('does not synchronize fallback row indexes without mapping.key', () => {
        const origin = add([{ x: 1, y: 2 }], {
            mapping: { key: undefined },
        });
        const sibling = add([{ x: 3, y: 4 }], {
            mapping: { key: undefined },
        });

        syncSelection([origin, sibling]);
        origin.helpers.selectPoint(origin, 0);

        expect(origin.helpers.getSelection(origin).type).toBe('point');
        expect(sibling.helpers.getSelection(sibling).type).toBeNull();
    });

    test('synchronizes color-group selection and clearing', () => {
        const settings = {
            mapping: { color: 'group' },
            scales: { color: { order: ['A', 'B'] } },
        };
        const origin = add([{ x: 1, y: 2, id: 'one', group: 'A' }], settings);
        const sibling = add([{ x: 3, y: 4, id: 'two', group: 'B' }], settings);

        syncSelection([origin, sibling]);
        origin.helpers.selectGroup(origin, 'A');
        expect(sibling.helpers.getSelection(sibling)).toEqual({
            type: 'group',
            values: ['A'],
        });

        origin.helpers.clearSelection(origin);
        expect(sibling.helpers.getSelection(sibling).type).toBeNull();
    });

    test('synchronizes keyboard selection through the callback lifecycle', () => {
        const origin = add([{ x: 1, y: 2, id: 'shared' }]);
        const sibling = add([{ x: 3, y: 4, id: 'shared' }]);
        syncSelection([origin, sibling]);

        origin.canvas.dispatchEvent(
            new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true })
        );
        origin.canvas.dispatchEvent(
            new KeyboardEvent('keydown', { key: 'Enter', bubbles: true })
        );

        expect(sibling.helpers.getSelection(sibling)).toEqual({
            type: 'point',
            values: ['shared'],
        });
    });

    test('can be re-applied without nesting synchronization wrappers', () => {
        const onSelect = jest.fn();
        const origin = add([{ x: 1, y: 2, id: 'shared' }], {
            callbacks: { onSelect },
        });
        const sibling = add([{ x: 3, y: 4, id: 'shared' }]);
        const update = jest.spyOn(sibling, 'update');
        update.mockClear();

        syncSelection([origin, sibling]);
        syncSelection([origin, sibling]);
        origin.helpers.selectPoint(origin, 'shared');

        expect(onSelect).toHaveBeenCalledTimes(1);
        expect(update).toHaveBeenCalledTimes(1);
    });
});
