/**
 * @jest-environment jsdom
 */

import points from '../../src/points.js';
import updateData from '../../src/points/updateData.js';
import updateSpec from '../../src/points/updateSpec.js';
import { getSelection, selectPoint } from '../../src/points/selection.js';

global.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
};

const data = [
    { x: 1, y: 2, id: 'A', group: 'G1', shape: 'S1' },
    { x: 3, y: 4, id: 'B', group: 'G2', shape: 'S2' },
];

const spec = {
    mapping: {
        x: 'x',
        y: 'y',
        key: 'id',
        color: 'group',
        shape: 'shape',
    },
    scales: {
        x: { range: [0, 10], label: 'Original x' },
        color: { order: ['G1', 'G2'] },
        shape: { order: ['S1', 'S2'] },
    },
    labels: { title: 'Original title' },
};

describe('points reactive updates', () => {
    let container;
    let chart;

    beforeEach(() => {
        container = document.createElement('div');
        document.body.appendChild(container);
        chart = points(container, data, spec);
    });

    afterEach(() => {
        chart?.destroy();
        container.remove();
    });

    test('attaches updateData and updateSpec helpers', () => {
        expect(chart.helpers).toEqual(
            expect.objectContaining({ updateData, updateSpec })
        );
    });

    test('updateData rebuilds points, lines, scales, and plugins', () => {
        const nextData = [
            { a: 2, b: 5, id: 'C', arm: 'Treatment' },
            { a: 8, b: 9, id: 'D', arm: 'Control' },
        ];
        const lineData = [
            { a: 1, b: 3 },
            { a: 9, b: 10 },
        ];
        const nextSpec = {
            mapping: { x: 'a', y: 'b', key: 'id', color: 'arm' },
            scales: {
                x: { type: 'log', range: [1, 10], label: 'Exposure' },
                y: { range: [0, 12], label: 'Events' },
                color: { order: ['Control', 'Treatment'] },
            },
            labels: { title: 'Updated title' },
            annotations: {
                lines: [
                    {
                        data: lineData,
                        mapping: { x: 'a', y: 'b' },
                    },
                ],
            },
        };

        expect(updateData(chart, nextData, nextSpec)).toBe(chart);

        expect(chart.data._spec_.data).toBe(nextData);
        expect(
            chart.data.datasets.slice(0, 2).map(({ label }) => label)
        ).toEqual(['Control', 'Treatment']);
        expect(chart.data.datasets.at(-1)._annotation).toBe(true);
        expect(chart.options.scales.x.type).toBe('logarithmic');
        expect(chart.options.scales.x.min).toBe(1);
        expect(chart.options.scales.x.max).toBe(10);
        expect(chart.options.scales.y.max).toBe(12);
        expect(chart.options.plugins.title.text).toBe('Updated title');
        expect(chart.options.interaction.mode).not.toBe('point');
    });

    test('updateData retains the current spec when the spec is omitted', () => {
        const nextData = [{ x: 6, y: 7, id: 'C', group: 'G1', shape: 'S1' }];

        updateData(chart, nextData);

        expect(chart.data._spec_.mapping).toEqual(spec.mapping);
        expect(chart.data._spec_.scales.x.range).toEqual([0, 10]);
        expect(chart.data.datasets[0].data[0]).toEqual(
            expect.objectContaining({ x: 6, y: 7, _key: 'C' })
        );
    });

    test('validates a full data update before mutating the chart', () => {
        const originalDatasets = chart.data.datasets;
        const originalSpec = chart.data._spec_;

        expect(() =>
            updateData(chart, [{ x: 'bad', y: 2 }], {
                mapping: { x: 'x', y: 'y' },
            })
        ).toThrow('must be a finite number');

        expect(chart.data.datasets).toBe(originalDatasets);
        expect(chart.data._spec_).toBe(originalSpec);
    });

    test('does not treat an explicit null update spec as omitted', () => {
        expect(() => updateData(chart, data, null)).toThrow('spec is required');
    });

    test('updateSpec deeply merges partial namespaces', () => {
        const onClick = jest.fn();
        const configured = points(container, data, {
            ...spec,
            callbacks: { onClick },
            tooltip: { format: '{id}: {x}', intersect: false },
            selection: { enabled: true, multiple: true, opacity: 0.4 },
        });
        chart = configured;

        expect(
            updateSpec(chart, {
                scales: { x: { label: 'Changed x' } },
                tooltip: { intersect: true },
                selection: { opacity: 0.3 },
            })
        ).toBe(chart);

        expect(chart.data._spec_.scales.x).toEqual(
            expect.objectContaining({
                range: [0, 10],
                label: 'Changed x',
                type: 'linear',
            })
        );
        expect(chart.data._spec_.tooltip.format).toBe('{id}: {x}');
        expect(chart.data._spec_.tooltip.intersect).toBe(true);
        expect(chart.data._spec_.callbacks.onClick).toBe(onClick);
        expect(chart.data._spec_.selection).toEqual({
            enabled: true,
            multiple: true,
            opacity: 0.3,
        });
    });

    test('validates a combined partial spec before mutation', () => {
        const originalSpec = chart.data._spec_;
        const originalDatasets = chart.data.datasets;

        expect(() =>
            updateSpec(chart, { scales: { x: { unsupported: true } } })
        ).toThrow('spec.scales.x.unsupported is not supported');

        expect(chart.data._spec_).toBe(originalSpec);
        expect(chart.data.datasets).toBe(originalDatasets);
    });

    test.each([
        ['labels', { labels: [] }],
        ['axis', { scales: { x: [] } }],
        ['tooltip callbacks', { tooltip: { callbacks: [] } }],
    ])(
        'rejects invalid nested %s partials before clearing state',
        (_name, partial) => {
            const originalDatasets = chart.data.datasets;
            selectPoint(chart, 'A');

            expect(() => updateSpec(chart, partial)).toThrow(
                'must be a plain object'
            );
            expect(chart.data.datasets).toBe(originalDatasets);
            expect(getSelection(chart)).toEqual({
                type: 'point',
                values: ['A'],
            });
        }
    );

    test.each([null, [], new Date(), 'invalid'])(
        'requires a plain-object partial spec: %p',
        (partial) => {
            expect(() => updateSpec(chart, partial)).toThrow(
                'points updateSpec spec must be a plain object'
            );
        }
    );

    test('enables and disables selective point labels dynamically', () => {
        expect(chart.config.plugins.some(({ id }) => id === 'datalabels')).toBe(
            false
        );

        updateSpec(chart, {
            annotations: {
                labels: {
                    point: {
                        field: 'id',
                        display: true,
                    },
                },
            },
        });
        expect(chart.config.plugins.some(({ id }) => id === 'datalabels')).toBe(
            true
        );
        expect(chart.options.plugins.datalabels).toBeDefined();

        updateSpec(chart, {
            annotations: { labels: { point: null } },
        });
        expect(chart.config.plugins.some(({ id }) => id === 'datalabels')).toBe(
            false
        );
        expect(chart.options.plugins.datalabels).toBeUndefined();
    });

    test('deeply merges point-label configuration', () => {
        chart = points(container, data, {
            ...spec,
            annotations: {
                labels: {
                    point: {
                        field: 'id',
                        display: true,
                        color: '#111111',
                        font: { family: 'Arial', size: 10 },
                    },
                },
            },
        });

        updateSpec(chart, {
            annotations: {
                labels: {
                    point: {
                        color: '#222222',
                        font: { size: 14 },
                    },
                },
            },
        });

        expect(chart.data._spec_.annotations.labels.point).toEqual(
            expect.objectContaining({
                field: 'id',
                display: true,
                color: '#222222',
                font: { family: 'Arial', size: 14 },
            })
        );
    });

    test('adds and removes annotation-safe interaction configuration', () => {
        updateSpec(chart, {
            annotations: {
                lines: [
                    {
                        data: [{ x: 1, y: 1 }],
                        mapping: { x: 'x', y: 'y' },
                    },
                ],
            },
        });
        expect(chart.options.interaction.mode).not.toBe('point');

        updateSpec(chart, { annotations: { lines: [] } });
        expect(chart.options.interaction.mode).toBe('point');
    });

    test('restores hidden groups by typed aesthetic identity after reorder', () => {
        const hiddenIndex = chart.data.datasets.findIndex(
            (dataset) => dataset._color === 'G2'
        );
        chart.setDatasetVisibility(hiddenIndex, false);
        chart.update('none');

        updateSpec(chart, {
            scales: {
                color: { order: ['G2', 'G1'] },
                shape: { order: ['S2', 'S1'] },
            },
        });

        const movedIndex = chart.data.datasets.findIndex(
            (dataset) => dataset._color === 'G2' && dataset._shape === 'S2'
        );
        expect(chart.isDatasetVisible(movedIndex)).toBe(false);
        expect(
            chart.isDatasetVisible(
                chart.data.datasets.findIndex(
                    (dataset) => dataset._color === 'G1'
                )
            )
        ).toBe(true);
    });

    test('preserves hidden groups across data updates when still present', () => {
        const hiddenIndex = chart.data.datasets.findIndex(
            (dataset) => dataset._color === 'G2'
        );
        chart.setDatasetVisibility(hiddenIndex, false);
        chart.update('none');
        const nextData = [
            { x: 5, y: 6, id: 'C', group: 'G2', shape: 'S2' },
            { x: 7, y: 8, id: 'D', group: 'G1', shape: 'S1' },
        ];

        updateData(chart, nextData, spec);

        const nextHidden = chart.data.datasets.findIndex(
            (dataset) => dataset._color === 'G2'
        );
        expect(chart.isDatasetVisible(nextHidden)).toBe(false);
    });

    test('keeps numeric and string hidden-group identities distinct', () => {
        const typedData = [
            { x: 1, y: 2, id: 'A', group: 1 },
            { x: 3, y: 4, id: 'B', group: '1' },
        ];
        chart = points(container, typedData, {
            mapping: { x: 'x', y: 'y', key: 'id', color: 'group' },
        });
        const numberIndex = chart.data.datasets.findIndex(
            (dataset) => dataset._color === 1
        );
        chart.setDatasetVisibility(numberIndex, false);
        chart.update('none');

        updateData(chart, [...typedData].reverse());

        const nextNumber = chart.data.datasets.findIndex(
            (dataset) => dataset._color === 1
        );
        const nextString = chart.data.datasets.findIndex(
            (dataset) => dataset._color === '1'
        );
        expect(chart.isDatasetVisible(nextNumber)).toBe(false);
        expect(chart.isDatasetVisible(nextString)).toBe(true);
    });

    test('does not transfer hidden state when aesthetic mappings change', () => {
        chart.setDatasetVisibility(0, false);
        chart.update('none');

        updateSpec(chart, {
            mapping: { color: 'shape', shape: 'group' },
        });

        chart.data.datasets.forEach((_dataset, index) => {
            expect(chart.isDatasetVisible(index)).toBe(true);
        });
    });

    test('resets stale hidden indexes when a group disappears', () => {
        chart.setDatasetVisibility(1, false);
        chart.update('none');

        updateData(
            chart,
            [{ x: 2, y: 3, id: 'C', group: 'New', shape: 'Only' }],
            {
                mapping: {
                    x: 'x',
                    y: 'y',
                    key: 'id',
                    color: 'group',
                    shape: 'shape',
                },
            }
        );

        expect(chart.isDatasetVisible(0)).toBe(true);
    });

    test.each([
        ['data', (target) => updateData(target, data, spec)],
        ['spec', (target) => updateSpec(target, { labels: { title: 'New' } })],
    ])(
        '%s updates clear selection and active tooltip state',
        (_name, update) => {
            selectPoint(chart, 'A');
            expect(getSelection(chart).type).toBe('point');
            expect(chart.tooltip.getActiveElements()).toHaveLength(1);

            update(chart);

            expect(getSelection(chart)).toEqual({ type: null, values: [] });
            expect(chart.getActiveElements()).toEqual([]);
            expect(chart.tooltip.getActiveElements()).toEqual([]);
        }
    );

    test('fixed ranges and callback source rows survive updates', () => {
        const onClick = jest.fn();
        chart = points(container, data, {
            ...spec,
            callbacks: { onClick },
        });
        const nextData = [{ x: 9, y: 12, id: 'C', group: 'G1', shape: 'S1' }];

        updateData(chart, nextData);
        chart.options.onClick(
            { type: 'click' },
            [{ datasetIndex: 0, index: 0 }],
            chart
        );

        expect(chart.options.scales.x.min).toBe(0);
        expect(chart.options.scales.x.max).toBe(10);
        expect(onClick).toHaveBeenCalledWith(
            expect.objectContaining({ _datum: nextData[0] }),
            expect.anything()
        );
    });

    test('updates the accessible summary and keyboard-selection UI', () => {
        updateSpec(chart, {
            labels: { title: 'Accessible update' },
            selection: { enabled: true },
        });

        expect(chart.canvas.getAttribute('role')).toBe('application');
        expect(chart.canvas.getAttribute('aria-label')).toContain(
            'Accessible update.'
        );
        expect(
            container.querySelectorAll('.gsm-points-live-status')
        ).toHaveLength(1);

        updateData(chart, [data[0]]);
        expect(chart.canvas.getAttribute('aria-label')).toContain('1 point.');
        expect(
            container.querySelectorAll('.gsm-points-live-status')
        ).toHaveLength(1);

        updateSpec(chart, { selection: { enabled: false } });
        expect(chart.canvas.getAttribute('role')).toBe('img');
        expect(container.querySelector('.gsm-points-live-status')).toBeNull();
    });

    test('announces cleared keyboard activity accurately during updates', () => {
        updateSpec(chart, { selection: { enabled: true } });
        chart.canvas.dispatchEvent(
            new KeyboardEvent('keydown', {
                key: 'ArrowRight',
                bubbles: true,
                cancelable: true,
            })
        );
        expect(getSelection(chart)).toEqual({ type: null, values: [] });

        updateData(chart, data);

        expect(
            container.querySelector('.gsm-points-live-status').textContent
        ).toContain('Active point cleared');
    });

    test('repeated updates retain one chart, canvas, and keyboard listener', () => {
        const canvas = chart.canvas;
        const addEventListener = jest.spyOn(canvas, 'addEventListener');

        updateSpec(chart, { selection: { enabled: true } });
        updateSpec(chart, { labels: { title: 'Second' } });
        updateData(chart, data);

        expect(chart.canvas).toBe(canvas);
        expect(container.querySelectorAll('canvas')).toHaveLength(1);
        expect(
            container.querySelectorAll('.gsm-points-live-status')
        ).toHaveLength(1);
        expect(
            addEventListener.mock.calls.filter(([event]) => event === 'keydown')
        ).toHaveLength(1);
    });

    test('updates a detached canvas without removing its live status', () => {
        chart.destroy();
        const canvas = document.createElement('canvas');
        chart = points(canvas, data, {
            ...spec,
            selection: { enabled: true },
        });
        const status = chart.data._selectionState_.liveRegion;
        expect(canvas.contains(status)).toBe(true);

        updateSpec(chart, { labels: { title: 'Detached update' } });

        expect(canvas.contains(status)).toBe(true);
        expect(chart.data._selectionState_.liveRegion).toBe(status);
        expect(canvas.textContent).toContain('Detached update.');
    });

    test('does not mutate partial specs or updated source rows', () => {
        const partial = Object.freeze({
            scales: Object.freeze({
                x: Object.freeze({ label: 'Immutable' }),
            }),
        });
        const nextRow = Object.freeze({
            x: 2,
            y: 3,
            id: 'C',
            group: 'G1',
            shape: 'S1',
        });
        const nextData = Object.freeze([nextRow]);

        expect(() => updateSpec(chart, partial)).not.toThrow();
        expect(() => updateData(chart, nextData)).not.toThrow();
        expect(partial.scales.x).toEqual({ label: 'Immutable' });
        expect(nextRow).toEqual({
            x: 2,
            y: 3,
            id: 'C',
            group: 'G1',
            shape: 'S1',
        });
    });
});
