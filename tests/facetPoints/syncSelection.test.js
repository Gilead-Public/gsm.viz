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
            if (chart.canvas) chart.destroy();
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

    test('does not synchronize a selection to a destroyed sibling', () => {
        const onSelect = jest.fn();
        const origin = add([{ x: 1, y: 2, id: 'shared' }], {
            callbacks: { onSelect },
        });
        const destroyed = add([{ x: 3, y: 4, id: 'shared' }]);

        syncSelection([origin, destroyed]);
        destroyed.destroy();

        expect(() =>
            origin.helpers.selectPoint(origin, 'shared')
        ).not.toThrow();
        expect(origin.helpers.getSelection(origin)).toEqual({
            type: 'point',
            values: ['shared'],
        });
        expect(onSelect).toHaveBeenCalledTimes(1);
    });

    test('does not open sibling tooltips for a single-key selection', () => {
        const origin = add([{ x: 1, y: 2, id: 'shared' }]);
        const sibling = add([{ x: 5, y: 6, id: 'shared' }]);

        syncSelection([origin, sibling]);
        origin.helpers.selectPoint(origin, 'shared');

        expect(origin.tooltip.getActiveElements()).toHaveLength(1);
        expect(sibling.helpers.getSelection(sibling).values).toEqual([
            'shared',
        ]);
        expect(sibling.tooltip.getActiveElements()).toHaveLength(0);
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

    test('keeps unkeyed point selections local without clearing siblings', () => {
        const origin = add(
            [
                { x: 1, y: 2 },
                { x: 3, y: 4 },
            ],
            { mapping: { key: undefined } }
        );
        const sibling = add(
            [
                { x: 5, y: 6 },
                { x: 7, y: 8 },
            ],
            { mapping: { key: undefined } }
        );
        sibling.helpers.selectPoint(sibling, 1);

        syncSelection([origin, sibling]);
        origin.helpers.selectPoint(origin, 0);

        expect(sibling.helpers.getSelection(sibling)).toEqual({
            type: 'point',
            values: [1],
        });
    });

    test('keeps sibling selections when an unkeyed point selection is cleared', () => {
        const origin = add([{ x: 1, y: 2 }], {
            mapping: { key: undefined },
        });
        const sibling = add(
            [
                { x: 3, y: 4 },
                { x: 5, y: 6 },
            ],
            { mapping: { key: undefined } }
        );
        origin.helpers.selectPoint(origin, 0);
        sibling.helpers.selectPoint(sibling, 1);

        syncSelection([origin, sibling]);
        origin.helpers.clearSelection(origin);

        expect(sibling.helpers.getSelection(sibling)).toEqual({
            type: 'point',
            values: [1],
        });
    });

    test('clears a mirrored group after an unkeyed local point selection', () => {
        const settings = { mapping: { key: undefined, color: 'group' } };
        const first = add(
            [
                { x: 1, y: 2, group: 'G' },
                { x: 3, y: 4, group: 'H' },
            ],
            settings
        );
        const second = add([{ x: 5, y: 6, group: 'G' }], settings);

        syncSelection([first, second]);
        first.helpers.selectPoint(first, 0);
        second.helpers.selectGroup(second, 'G');
        expect(first.helpers.getSelection(first)).toEqual({
            type: 'group',
            values: ['G'],
        });

        first.helpers.clearSelection(first);

        expect(second.helpers.getSelection(second).type).toBeNull();
    });

    test('keyed point selection and clearing preserve unkeyed local selections', () => {
        const origin = add([
            { x: 1, y: 2, id: 'shared' },
            { x: 3, y: 4, id: 'other' },
        ]);
        const keyed = add([{ x: 5, y: 6, id: 'shared' }]);
        const unkeyed = add(
            [
                { x: 7, y: 8, id: 'shared' },
                { x: 9, y: 10, id: 'other' },
            ],
            { mapping: { key: undefined } }
        );

        syncSelection([origin, keyed, unkeyed]);
        unkeyed.helpers.selectPoint(unkeyed, 1);
        origin.helpers.selectPoint(origin, 'shared');

        expect(keyed.helpers.getSelection(keyed)).toEqual({
            type: 'point',
            values: ['shared'],
        });
        expect(unkeyed.helpers.getSelection(unkeyed)).toEqual({
            type: 'point',
            values: [1],
        });

        origin.helpers.clearSelection(origin);

        expect(keyed.helpers.getSelection(keyed).type).toBeNull();
        expect(unkeyed.helpers.getSelection(unkeyed)).toEqual({
            type: 'point',
            values: [1],
        });
    });

    test('keyed point selection replaces a mirrored group in unkeyed siblings', () => {
        const origin = add([{ x: 1, y: 2, id: 'one', group: 'G' }], {
            mapping: { color: 'group' },
        });
        const unkeyed = add([{ x: 3, y: 4, group: 'G' }], {
            mapping: { key: undefined, color: 'group' },
        });

        syncSelection([origin, unkeyed]);
        origin.helpers.selectGroup(origin, 'G');
        expect(unkeyed.helpers.getSelection(unkeyed)).toEqual({
            type: 'group',
            values: ['G'],
        });

        origin.helpers.selectPoint(origin, 'one');

        expect(unkeyed.helpers.getSelection(unkeyed).type).toBeNull();
    });

    test('does not announce mirrored point selection or clearing', () => {
        const origin = add([
            { x: 1, y: 2, id: 'shared' },
            { x: 3, y: 4, id: 'local' },
        ]);
        const sibling = add([{ x: 5, y: 6, id: 'shared' }]);
        const originStatus = origin.data._selectionState_.liveRegion;
        const siblingStatus = sibling.data._selectionState_.liveRegion;

        syncSelection([origin, sibling]);
        origin.helpers.selectPoint(origin, 'shared');

        expect(originStatus.textContent).toContain('Selected point shared');
        expect(siblingStatus.textContent).toBe('');

        origin.helpers.selectPoint(origin, 'local');

        expect(originStatus.textContent).toContain('Selected point local');
        expect(siblingStatus.textContent).toBe('');
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

    test('selects declared color levels that a sibling has not observed', () => {
        const origin = add([{ x: 1, y: 2, id: 'one', group: 'A', kind: 'k' }], {
            mapping: { color: 'group', shape: 'kind' },
        });
        const sibling = add(
            [{ x: 3, y: 4, id: 'two', group: 'A', kind: 'k' }],
            {
                mapping: { color: 'group', shape: 'kind' },
                scales: { color: { order: ['Expected'] } },
            }
        );
        const declared = add(
            [{ x: 5, y: 6, id: 'three', group: 'Expected', kind: 'k' }],
            {
                mapping: { color: 'group', shape: 'kind' },
                scales: { color: { order: ['Expected'] } },
            }
        );

        syncSelection([declared, sibling, origin]);
        declared.helpers.selectGroup(declared, 'Expected');

        expect(sibling.helpers.getSelection(sibling)).toEqual({
            type: 'group',
            values: ['Expected'],
        });
        expect(origin.helpers.getSelection(origin).type).toBeNull();
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
