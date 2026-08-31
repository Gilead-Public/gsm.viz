/**
 * @jest-environment jsdom
 */

import points from '../../src/points.js';

global.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
};

describe('points accessibility qualification', () => {
    let chart;
    let container;

    beforeEach(() => {
        container = document.createElement('div');
        document.body.appendChild(container);
    });

    afterEach(() => {
        chart?.destroy();
        container.remove();
    });

    test('combines chart context, redundant encodings, and keyboard status', () => {
        const onSelect = jest.fn();
        chart = points(
            container,
            [
                {
                    id: 'A',
                    exposure: 10,
                    events: 2,
                    cohort: 'Control',
                    status: 'Observed',
                },
                {
                    id: 'B',
                    exposure: 20,
                    events: 5,
                    cohort: 'Treatment',
                    status: 'Expected',
                },
            ],
            {
                mapping: {
                    x: 'exposure',
                    y: 'events',
                    key: 'id',
                    color: 'cohort',
                    shape: 'status',
                },
                scales: {
                    x: { label: 'Participant exposure' },
                    y: { label: 'Reported events' },
                },
                labels: {
                    title: 'Accessible monitoring chart',
                    description: 'Simulated values use both color and shape.',
                },
                selection: { enabled: true },
                callbacks: { onSelect },
            }
        );

        const label = chart.canvas.getAttribute('aria-label');
        expect(label).toContain('Accessible monitoring chart.');
        expect(label).toContain('Simulated values use both color and shape.');
        expect(label).toContain(
            'Point chart of Reported events by Participant exposure.'
        );
        expect(label).toContain(
            'Color cohort values: "Control" (string), "Treatment" (string).'
        );
        expect(label).toContain(
            'Shape status values: "Observed" (string), "Expected" (string).'
        );
        expect(label).toContain('Use arrow keys to move between points');

        chart.canvas.dispatchEvent(
            new KeyboardEvent('keydown', {
                key: 'ArrowRight',
                bubbles: true,
                cancelable: true,
            })
        );
        chart.canvas.dispatchEvent(
            new KeyboardEvent('keydown', {
                key: 'Enter',
                bubbles: true,
                cancelable: true,
            })
        );

        const liveStatus = container.querySelector('.gsm-points-live-status');
        expect(liveStatus.getAttribute('role')).toBe('status');
        expect(liveStatus.textContent).toContain('Selected point A');
        expect(onSelect).toHaveBeenCalledWith(
            { type: 'point', values: ['A'] },
            expect.objectContaining({ key: 'Enter' })
        );
    });
});
