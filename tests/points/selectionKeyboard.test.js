/**
 * @jest-environment jsdom
 */

import points from '../../src/points.js';
import { getSelection } from '../../src/points/selection.js';

global.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
};

const data = [
    { x: 3, y: 4, id: 'B', group: 'Later' },
    { x: 1, y: 2, id: 'A', group: 'First' },
    { x: 5, y: 6, id: 'C', group: 'Later' },
];

function press(canvas, key) {
    const event = new KeyboardEvent('keydown', {
        key,
        bubbles: true,
        cancelable: true,
    });
    canvas.dispatchEvent(event);
    return event;
}

function getActivePoint(chart) {
    const [active] = chart.getActiveElements();
    return active
        ? chart.data.datasets[active.datasetIndex].data[active.index]
        : undefined;
}

describe('points keyboard selection', () => {
    let container;
    let chart;

    beforeEach(() => {
        container = document.createElement('div');
        document.body.appendChild(container);
    });

    afterEach(() => {
        chart?.destroy();
        container.remove();
    });

    function render(selection = { enabled: true }) {
        chart = points(container, data, {
            mapping: {
                x: 'x',
                y: 'y',
                key: 'id',
                color: 'group',
            },
            scales: {
                color: { order: ['First', 'Later'] },
            },
            selection,
        });
        return chart;
    }

    test('adds one interactive canvas and an initially quiet live status', () => {
        render();
        const canvas = chart.canvas;
        const status = container.querySelector('.gsm-points-live-status');

        expect(canvas.tabIndex).toBe(0);
        expect(canvas.getAttribute('role')).toBe('application');
        expect(canvas.getAttribute('aria-roledescription')).toBe(
            'interactive point chart'
        );
        expect(canvas.getAttribute('aria-label')).toContain(
            'Use arrow keys to move between points'
        );
        expect(status).not.toBeNull();
        expect(status.getAttribute('aria-live')).toBe('polite');
        expect(status.getAttribute('aria-atomic')).toBe('true');
        expect(status.textContent).toBe('');
        expect(canvas.getAttribute('aria-describedby')).toBeNull();
        expect(
            container.querySelectorAll('.gsm-points-live-status')
        ).toHaveLength(1);
    });

    test('moves through points in source order and wraps', () => {
        render();
        const canvas = chart.canvas;

        expect(press(canvas, 'ArrowRight').defaultPrevented).toBe(true);
        expect(getActivePoint(chart)._key).toBe('B');
        expect(
            container.querySelector('.gsm-points-live-status').textContent
        ).toContain('Active point B');

        press(canvas, 'ArrowRight');
        expect(getActivePoint(chart)._key).toBe('A');

        press(canvas, 'ArrowLeft');
        expect(getActivePoint(chart)._key).toBe('B');
        press(canvas, 'ArrowLeft');
        expect(getActivePoint(chart)._key).toBe('C');
    });

    test('uses down and up arrows as forward and backward navigation', () => {
        render();

        press(chart.canvas, 'ArrowDown');
        expect(getActivePoint(chart)._key).toBe('B');
        press(chart.canvas, 'ArrowUp');
        expect(getActivePoint(chart)._key).toBe('C');
    });

    test('selects the active point with Enter and clears with Escape', () => {
        const onSelect = jest.fn();
        render({ enabled: true });
        chart.data._spec_.callbacks.onSelect = onSelect;

        press(chart.canvas, 'ArrowRight');
        press(chart.canvas, 'Enter');

        expect(getSelection(chart)).toEqual({
            type: 'point',
            values: ['B'],
        });
        expect(onSelect).toHaveBeenCalledWith(
            { type: 'point', values: ['B'] },
            expect.objectContaining({ key: 'Enter' })
        );
        expect(
            container.querySelector('.gsm-points-live-status').textContent
        ).toContain('Selected point B');

        expect(press(chart.canvas, 'Escape').defaultPrevented).toBe(true);
        expect(getSelection(chart)).toEqual({ type: null, values: [] });
        expect(
            container.querySelector('.gsm-points-live-status').textContent
        ).toContain('Selection cleared');
    });

    test('toggles multiple keyboard selections when enabled', () => {
        render({ enabled: true, multiple: true });

        press(chart.canvas, 'ArrowRight');
        press(chart.canvas, 'Enter');
        press(chart.canvas, 'ArrowRight');
        press(chart.canvas, 'Enter');

        expect(getSelection(chart)).toEqual({
            type: 'point',
            values: ['B', 'A'],
        });

        press(chart.canvas, 'ArrowLeft');
        press(chart.canvas, 'Enter');
        expect(getSelection(chart)).toEqual({
            type: 'point',
            values: ['A'],
        });
        expect(getActivePoint(chart)._key).toBe('B');

        press(chart.canvas, 'Enter');
        expect(getSelection(chart)).toEqual({
            type: 'point',
            values: ['A', 'B'],
        });
    });

    test('activates and selects the first point when Enter is pressed first', () => {
        render();

        press(chart.canvas, 'Enter');

        expect(getActivePoint(chart)._key).toBe('B');
        expect(getSelection(chart)).toEqual({
            type: 'point',
            values: ['B'],
        });
    });

    test('ignores unrelated keys', () => {
        render();

        expect(press(chart.canvas, 'Tab').defaultPrevented).toBe(false);
        expect(getActivePoint(chart)).toBeUndefined();
    });

    test('Escape dismisses an active point when selection is empty', () => {
        render();

        press(chart.canvas, 'ArrowRight');
        expect(getActivePoint(chart)._key).toBe('B');
        expect(press(chart.canvas, 'Escape').defaultPrevented).toBe(true);
        expect(getActivePoint(chart)).toBeUndefined();
        expect(
            container.querySelector('.gsm-points-live-status').textContent
        ).toContain('Active point cleared');
    });

    test('does not add keyboard selection UI when selection is disabled', () => {
        render({ enabled: false });

        expect(chart.canvas.tabIndex).toBe(-1);
        expect(container.querySelector('.gsm-points-live-status')).toBeNull();
    });

    test('re-rendering and destruction clean up the live status', () => {
        render();

        chart = points(container, data, {
            mapping: { x: 'x', y: 'y', key: 'id' },
            selection: { enabled: true },
        });
        expect(
            container.querySelectorAll('.gsm-points-live-status')
        ).toHaveLength(1);

        chart.destroy();
        expect(container.querySelector('.gsm-points-live-status')).toBeNull();
        chart = undefined;
    });

    test('destruction restores canvas interaction attributes', () => {
        const canvas = document.createElement('canvas');
        canvas.setAttribute('tabindex', '4');
        canvas.setAttribute('aria-describedby', 'existing-description');
        canvas.setAttribute('aria-keyshortcuts', 'Space');
        canvas.setAttribute('aria-roledescription', 'existing chart');
        container.appendChild(canvas);

        chart = points(canvas, data, {
            mapping: { x: 'x', y: 'y', key: 'id' },
            selection: { enabled: true },
        });
        chart.destroy();

        expect(canvas.getAttribute('role')).toBe('img');
        expect(canvas.getAttribute('tabindex')).toBe('4');
        expect(canvas.getAttribute('aria-describedby')).toBe(
            'existing-description'
        );
        expect(canvas.getAttribute('aria-keyshortcuts')).toBe('Space');
        expect(canvas.getAttribute('aria-roledescription')).toBe(
            'existing chart'
        );
        chart = undefined;
    });
});
