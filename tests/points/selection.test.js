/**
 * @jest-environment jsdom
 */

import points from '../../src/points.js';
import {
    clearSelection,
    getSelection,
    selectGroup,
    selectPoint,
} from '../../src/points/selection.js';

global.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
};

const data = [
    { x: 1, y: 2, id: 'A', group: 'G1' },
    { x: 1, y: 2, id: 'B', group: 'G2' },
    { x: 3, y: 4, id: 'C', group: 'G1' },
];

describe('points selection', () => {
    const rendered = [];

    afterEach(() => {
        rendered.splice(0).forEach(({ chart, container }) => {
            chart.destroy();
            container.remove();
        });
    });

    function render(overrides = {}, rows = data) {
        const container = document.createElement('div');
        document.body.appendChild(container);
        const chart = points(container, rows, {
            mapping: {
                x: 'x',
                y: 'y',
                key: 'id',
                color: 'group',
            },
            scales: {
                color: {
                    colors: {
                        G1: '#112233',
                        G2: '#445566',
                    },
                },
            },
            ...overrides,
        });
        rendered.push({ chart, container });
        return { chart, container };
    }

    function findPoint(chart, key) {
        for (
            let datasetIndex = 0;
            datasetIndex < chart.data.datasets.length;
            datasetIndex += 1
        ) {
            const dataset = chart.data.datasets[datasetIndex];
            const index = dataset.data.findIndex((point) => point._key === key);
            if (index !== -1) return { dataset, datasetIndex, index };
        }
        return undefined;
    }

    test('starts with an empty defensive selection', () => {
        const { chart } = render();

        const selection = getSelection(chart);
        expect(selection).toEqual({ type: null, values: [] });
        selection.values.push('changed');
        expect(getSelection(chart)).toEqual({ type: null, values: [] });
    });

    test('selects one or more point keys programmatically', () => {
        const { chart } = render();

        selectPoint(chart, 'A');
        expect(getSelection(chart)).toEqual({
            type: 'point',
            values: ['A'],
        });

        selectPoint(chart, ['B', 'C']);
        expect(getSelection(chart)).toEqual({
            type: 'point',
            values: ['B', 'C'],
        });
    });

    test('deduplicates values and preserves primitive types', () => {
        const rows = [
            { x: 1, y: 2, id: 1, group: 'G1' },
            { x: 2, y: 3, id: '1', group: 'G2' },
        ];
        const { chart } = render({}, rows);

        selectPoint(chart, [1, 1, '1']);

        expect(getSelection(chart)).toEqual({
            type: 'point',
            values: [1, '1'],
        });
    });

    test('rejects invalid or unknown point keys', () => {
        const { chart } = render();

        expect(() => selectPoint(chart, true)).toThrow(
            'points selectPoint values must be strings or finite numbers'
        );
        expect(() => selectPoint(chart, 'Unknown')).toThrow(
            'points selectPoint could not find key "Unknown"'
        );
    });

    test('selects color groups and replaces point selection', () => {
        const { chart } = render();

        selectPoint(chart, 'A');
        selectGroup(chart, 'G1');

        expect(getSelection(chart)).toEqual({
            type: 'group',
            values: ['G1'],
        });
    });

    test('requires a color mapping and known group values', () => {
        const { chart } = render({
            mapping: { x: 'x', y: 'y', key: 'id' },
        });

        expect(() => selectGroup(chart, 'G1')).toThrow(
            'points selectGroup requires spec.mapping.color'
        );

        const grouped = render().chart;
        expect(() => selectGroup(grouped, 'Unknown')).toThrow(
            'points selectGroup could not find group "Unknown"'
        );
    });

    test('dims only unselected points with configured opacity', () => {
        const { chart } = render({
            selection: { opacity: 0.35 },
        });
        const originalA = findPoint(chart, 'A').dataset.backgroundColor;
        const originalB = findPoint(chart, 'B').dataset.backgroundColor;

        selectPoint(chart, 'A');

        const selected = findPoint(chart, 'A');
        const unselected = findPoint(chart, 'B');
        expect(selected.dataset.backgroundColor[selected.index]).toBe(
            originalA
        );
        expect(unselected.dataset.backgroundColor[unselected.index]).toBe(
            'rgba(68, 85, 102, 0.35)'
        );
        expect(originalB).toBe('#445566');
    });

    test('group selection preserves every point in selected color groups', () => {
        const { chart } = render();

        selectGroup(chart, 'G1');

        ['A', 'C'].forEach((key) => {
            const { dataset, index } = findPoint(chart, key);
            expect(dataset.backgroundColor[index]).toBe('#112233');
        });
        const { dataset, index } = findPoint(chart, 'B');
        expect(dataset.backgroundColor[index]).toContain('0.2');
    });

    test('multiplies encoded alpha so dimming never increases opacity', () => {
        const { chart } = render({
            scales: {
                color: {
                    colors: {
                        G1: 'rgba(17, 34, 51, 0.1)',
                        G2: '#445566',
                    },
                },
            },
        });

        selectPoint(chart, 'B');

        const { dataset, index } = findPoint(chart, 'A');
        expect(dataset.backgroundColor[index]).toBe('rgba(17, 34, 51, 0.02)');
    });

    test('distinguishes missing and literal missing-label color groups', () => {
        const rows = [
            { x: 1, y: 2, id: 'literal', group: '(Missing)' },
            { x: 2, y: 3, id: 'missing', group: null },
        ];
        const { chart } = render({}, rows);

        selectGroup(chart, null);
        expect(
            findPoint(chart, 'missing').dataset.backgroundColor[0]
        ).not.toContain('0.2');
        expect(
            findPoint(chart, 'literal').dataset.backgroundColor[0]
        ).toContain('0.2');

        selectGroup(chart, '(Missing)');
        expect(
            findPoint(chart, 'literal').dataset.backgroundColor[0]
        ).not.toContain('0.2');
        expect(
            findPoint(chart, 'missing').dataset.backgroundColor[0]
        ).toContain('0.2');
    });

    test('accepts an empty ordered color group as a selection value', () => {
        const { chart } = render(
            {
                scales: {
                    color: {
                        order: ['G1', 'Absent'],
                    },
                },
            },
            [{ x: 1, y: 2, id: 'A', group: 'G1' }]
        );

        expect(() => selectGroup(chart, 'Absent')).not.toThrow();
        expect(getSelection(chart)).toEqual({
            type: 'group',
            values: ['Absent'],
        });
    });

    test('does not alter auxiliary line styles', () => {
        const { chart } = render({
            annotations: {
                lines: [
                    {
                        data: [
                            { x: 1, y: 1 },
                            { x: 3, y: 3 },
                        ],
                        mapping: { x: 'x', y: 'y' },
                        color: '#abcdef',
                    },
                ],
            },
        });
        const line = chart.data.datasets.at(-1);

        selectPoint(chart, 'A');

        expect(line.backgroundColor).toBe('#abcdef');
        expect(line.borderColor).toBe('#abcdef');
    });

    test('restores exact dataset styles when selection clears', () => {
        const { chart } = render();
        const originals = chart.data.datasets.map((dataset) => ({
            backgroundColor: dataset.backgroundColor,
            borderColor: dataset.borderColor,
        }));

        selectPoint(chart, 'A');
        clearSelection(chart);

        expect(getSelection(chart)).toEqual({ type: null, values: [] });
        chart.data.datasets.forEach((dataset, index) => {
            expect(dataset.backgroundColor).toBe(
                originals[index].backgroundColor
            );
            expect(dataset.borderColor).toBe(originals[index].borderColor);
        });
    });

    test('reuses initially resolved colors when ungrouped selection changes', () => {
        const { chart } = render({
            mapping: { x: 'x', y: 'y', key: 'id' },
            selection: { opacity: 0.37 },
        });
        expect(chart.data.datasets[0].backgroundColor).toBeUndefined();

        selectPoint(chart, 'A');
        selectPoint(chart, 'B');

        const selected = findPoint(chart, 'B');
        const unselected = findPoint(chart, 'A');
        expect(selected.dataset.backgroundColor[selected.index]).not.toContain(
            '0.37'
        );
        expect(unselected.dataset.backgroundColor[unselected.index]).toContain(
            '0.037'
        );
    });

    test('keeps legend swatches at their original colors', () => {
        const { chart } = render();
        const before = chart.legend.legendItems.map(
            ({ fillStyle }) => fillStyle
        );

        selectPoint(chart, 'A');

        expect(
            chart.legend.legendItems.map(({ fillStyle }) => fillStyle)
        ).toEqual(before);
    });

    test('fires onSelect with the event unless the operation is silent', () => {
        const onSelect = jest.fn();
        const event = { type: 'programmatic' };
        const { chart } = render({ callbacks: { onSelect } });

        selectPoint(chart, 'A', event);
        expect(onSelect).toHaveBeenCalledWith(
            { type: 'point', values: ['A'] },
            event
        );

        onSelect.mockClear();
        selectGroup(chart, 'G1', undefined, { _silent: true });
        clearSelection(chart, undefined, { _silent: true });
        expect(onSelect).not.toHaveBeenCalled();
    });

    test('an empty value array clears an existing selection', () => {
        const { chart } = render();

        selectPoint(chart, 'A');
        selectPoint(chart, []);

        expect(getSelection(chart)).toEqual({ type: null, values: [] });
    });

    test('retains a tooltip for exactly one selected duplicate-coordinate point', () => {
        const { chart } = render();
        const selected = findPoint(chart, 'A');
        const peer = findPoint(chart, 'B');
        const setActiveElements = jest.spyOn(
            chart.tooltip,
            'setActiveElements'
        );
        setActiveElements.mockClear();

        selectPoint(chart, 'A');

        const activeCall = setActiveElements.mock.calls.find(
            ([elements]) => elements.length > 0
        );
        expect(activeCall[0]).toEqual([
            {
                datasetIndex: selected.datasetIndex,
                index: selected.index,
            },
        ]);
        expect(activeCall[0]).not.toContainEqual({
            datasetIndex: peer.datasetIndex,
            index: peer.index,
        });
    });

    test('reasserts one selected duplicate after the Chart.js click lifecycle', () => {
        const { chart } = render({ selection: { enabled: true } });
        const selected = findPoint(chart, 'A');
        const element = chart.getDatasetMeta(selected.datasetIndex).data[
            selected.index
        ];

        chart._eventHandler({
            type: 'click',
            native: { type: 'click' },
            x: element.x,
            y: element.y,
        });

        expect(getSelection(chart)).toEqual({
            type: 'point',
            values: ['A'],
        });
        expect(chart.tooltip.getActiveElements()).toEqual([
            expect.objectContaining({
                datasetIndex: selected.datasetIndex,
                index: selected.index,
            }),
        ]);
    });

    test('supports selection before a detached chart has rendered elements', () => {
        const container = document.createElement('div');
        const chart = points(container, data, {
            mapping: {
                x: 'x',
                y: 'y',
                key: 'id',
                color: 'group',
            },
            scales: {
                color: {
                    colors: {
                        G1: '#112233',
                        G2: '#445566',
                    },
                },
            },
        });
        rendered.push({ chart, container });

        expect(() => selectPoint(chart, 'A')).not.toThrow();
        document.body.appendChild(container);
        chart.resize(600, 400);
        chart.update('none');

        expect(getSelection(chart)).toEqual({
            type: 'point',
            values: ['A'],
        });
        expect(
            chart.legend.legendItems.map(({ fillStyle }) => fillStyle)
        ).toEqual(['#112233', '#445566']);
    });

    test('clears activity when the selected point is hidden after selection', () => {
        const { chart } = render();
        const selected = findPoint(chart, 'A');
        selectPoint(chart, 'A');

        chart.hide(selected.datasetIndex);

        expect(getSelection(chart)).toEqual({
            type: 'point',
            values: ['A'],
        });
        expect(chart.getActiveElements()).toEqual([]);
        expect(chart.tooltip.getActiveElements()).toEqual([]);
    });

    test('repositions a selected point tooltip after chart resize', () => {
        const { chart } = render();
        chart.resize(600, 400);
        selectPoint(chart, 'A');
        const before = { ...chart.tooltip._eventPosition };

        chart.resize(300, 200);

        const selected = findPoint(chart, 'A');
        const center = chart
            .getDatasetMeta(selected.datasetIndex)
            .data[selected.index].getCenterPoint();
        expect(chart.tooltip._eventPosition).toEqual(center);
        expect(chart.tooltip._eventPosition).not.toEqual(before);
    });

    test('does not retain activity for a selected point in a hidden group', () => {
        const { chart } = render();
        selectPoint(chart, 'A');
        const hidden = findPoint(chart, 'B');
        chart.hide(hidden.datasetIndex);

        selectPoint(chart, 'B');

        expect(getSelection(chart)).toEqual({
            type: 'point',
            values: ['B'],
        });
        expect(chart.getActiveElements()).toEqual([]);
        expect(chart.tooltip.getActiveElements()).toEqual([]);
    });

    test('attaches all public selection helpers', () => {
        const { chart } = render();

        expect(chart.helpers).toEqual(
            expect.objectContaining({
                selectPoint,
                selectGroup,
                clearSelection,
                getSelection,
            })
        );
    });

    describe('click selection', () => {
        function click(chart, key, event = { type: 'click' }) {
            const point = findPoint(chart, key);
            chart.options.onClick(
                event,
                [
                    {
                        datasetIndex: point.datasetIndex,
                        index: point.index,
                    },
                ],
                chart
            );
            return event;
        }

        test('toggles point selection and preserves onClick callbacks', () => {
            const onClick = jest.fn();
            const onSelect = jest.fn();
            const { chart } = render({
                selection: { enabled: true },
                callbacks: { onClick, onSelect },
            });
            const event = click(chart, 'A');

            expect(getSelection(chart)).toEqual({
                type: 'point',
                values: ['A'],
            });
            expect(onClick).toHaveBeenCalledWith(
                expect.objectContaining({ _key: 'A' }),
                event
            );
            expect(onSelect).toHaveBeenCalledWith(
                { type: 'point', values: ['A'] },
                event
            );

            click(chart, 'A');
            expect(getSelection(chart)).toEqual({
                type: null,
                values: [],
            });
        });

        test('does not select automatically when disabled', () => {
            const { chart } = render({
                selection: { enabled: false },
            });

            click(chart, 'A');

            expect(getSelection(chart).type).toBeNull();
        });

        test('supports additive multiple point selection', () => {
            const { chart } = render({
                selection: { enabled: true, multiple: true },
            });

            click(chart, 'A');
            click(chart, 'B');
            expect(getSelection(chart)).toEqual({
                type: 'point',
                values: ['A', 'B'],
            });

            click(chart, 'A');
            expect(getSelection(chart)).toEqual({
                type: 'point',
                values: ['B'],
            });
        });

        test('replaces selection when multiple mode is disabled', () => {
            const { chart } = render({
                selection: { enabled: true, multiple: false },
            });

            click(chart, 'A');
            click(chart, 'B');

            expect(getSelection(chart)).toEqual({
                type: 'point',
                values: ['B'],
            });
        });

        test('clears selection when empty space is clicked', () => {
            const { chart } = render({
                selection: { enabled: true },
            });
            click(chart, 'A');

            chart.options.onClick({ type: 'click' }, [], chart);

            expect(getSelection(chart)).toEqual({
                type: null,
                values: [],
            });
        });
    });
});
