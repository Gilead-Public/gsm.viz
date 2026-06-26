/**
 * @jest-environment jsdom
 */

import bars from '../../src/bars.js';
import {
    selectCategory,
    selectSegment,
    clearSelection,
    getSelection,
} from '../../src/bars/selection.js';

global.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
};

const data = [
    { site: 'A', count: 10, status: 'Complete' },
    { site: 'A', count: 5, status: 'Withdrawn' },
    { site: 'B', count: 20, status: 'Complete' },
    { site: 'B', count: 8, status: 'Withdrawn' },
    { site: 'C', count: 15, status: 'Complete' },
    { site: 'C', count: 3, status: 'Withdrawn' },
];

function makeChart(specOverrides = {}) {
    const container = document.createElement('div');
    return bars(container, data, {
        mapping: { x: 'site', y: 'count', fill: 'status' },
        ...specOverrides,
    });
}

function makeSimpleChart(specOverrides = {}) {
    const container = document.createElement('div');
    return bars(
        container,
        [
            { site: 'A', count: 10 },
            { site: 'B', count: 20 },
            { site: 'C', count: 15 },
        ],
        {
            mapping: { x: 'site', y: 'count' },
            ...specOverrides,
        }
    );
}

describe('bars/selection', () => {
    describe('getSelection', () => {
        test('returns null type when no selection is active', () => {
            const chart = makeChart();
            const sel = getSelection(chart);
            expect(sel).toEqual({ type: null, values: [] });
        });
    });

    describe('selectCategory', () => {
        test('selects a single category by string value', () => {
            const chart = makeChart();
            selectCategory(chart, 'A');
            const sel = getSelection(chart);
            expect(sel).toEqual({ type: 'category', values: ['A'] });
        });

        test('selects multiple categories by array', () => {
            const chart = makeChart();
            selectCategory(chart, ['A', 'B']);
            const sel = getSelection(chart);
            expect(sel).toEqual({ type: 'category', values: ['A', 'B'] });
        });

        test('replaces previous category selection', () => {
            const chart = makeChart();
            selectCategory(chart, 'A');
            selectCategory(chart, 'B');
            const sel = getSelection(chart);
            expect(sel).toEqual({ type: 'category', values: ['B'] });
        });

        test('replaces segment selection with category selection', () => {
            const chart = makeChart();
            selectSegment(chart, { category: 'A', fill: 'Complete' });
            selectCategory(chart, 'B');
            const sel = getSelection(chart);
            expect(sel).toEqual({ type: 'category', values: ['B'] });
        });

        test('dims non-selected bars in multi-series chart', () => {
            const chart = makeChart();
            selectCategory(chart, 'A');

            chart.data.datasets.forEach((ds) => {
                const colors = ds.backgroundColor;
                ds.data.forEach((pt, i) => {
                    const color = Array.isArray(colors) ? colors[i] : colors;
                    if (pt.x === 'A') {
                        // Selected category bars should have full opacity
                        expect(color).not.toMatch(/rgba.*0\.2\)$/);
                    } else {
                        // Non-selected bars should be dimmed
                        expect(color).toMatch(/rgba/);
                    }
                });
            });
        });

        test('dims non-selected bars in single-series chart', () => {
            const chart = makeSimpleChart();
            selectCategory(chart, 'A');

            const colors = chart.data.datasets[0].backgroundColor;
            expect(Array.isArray(colors)).toBe(true);
            // Index 0 = A (selected), should be full opacity
            // Index 1 = B, Index 2 = C (non-selected), should be dimmed
            expect(colors[0]).not.toMatch(/rgba.*0\.2\)$/);
            expect(colors[1]).toMatch(/rgba/);
            expect(colors[2]).toMatch(/rgba/);
        });

        test('works with horizontal orientation', () => {
            const chart = makeChart({ orientation: 'horizontal' });
            selectCategory(chart, 'B');
            const sel = getSelection(chart);
            expect(sel).toEqual({ type: 'category', values: ['B'] });
        });

        test('ignores invalid category values silently', () => {
            const chart = makeChart();
            selectCategory(chart, 'NonExistent');
            const sel = getSelection(chart);
            expect(sel).toEqual({ type: 'category', values: ['NonExistent'] });
        });
    });

    describe('selectSegment', () => {
        test('selects a single segment by category+fill', () => {
            const chart = makeChart();
            selectSegment(chart, { category: 'A', fill: 'Complete' });
            const sel = getSelection(chart);
            expect(sel).toEqual({
                type: 'segment',
                values: [{ category: 'A', fill: 'Complete' }],
            });
        });

        test('selects multiple segments by array', () => {
            const chart = makeChart();
            selectSegment(chart, [
                { category: 'A', fill: 'Complete' },
                { category: 'B', fill: 'Withdrawn' },
            ]);
            const sel = getSelection(chart);
            expect(sel).toEqual({
                type: 'segment',
                values: [
                    { category: 'A', fill: 'Complete' },
                    { category: 'B', fill: 'Withdrawn' },
                ],
            });
        });

        test('dims non-selected segments', () => {
            const chart = makeChart();
            selectSegment(chart, { category: 'A', fill: 'Complete' });

            // The 'Complete' dataset's first point (site A) should be full opacity
            const completeDs = chart.data.datasets.find(
                (ds) => ds.label === 'Complete'
            );
            const withdrawnDs = chart.data.datasets.find(
                (ds) => ds.label === 'Withdrawn'
            );

            const completeBg = completeDs.backgroundColor;
            const withdrawnBg = withdrawnDs.backgroundColor;

            // Complete dataset, site A (index 0) = selected = full opacity
            const completeA = Array.isArray(completeBg)
                ? completeBg[0]
                : completeBg;
            expect(completeA).not.toMatch(/rgba.*0\.2\)$/);

            // Withdrawn dataset, all bars = not selected = dimmed
            if (Array.isArray(withdrawnBg)) {
                withdrawnBg.forEach((c) => expect(c).toMatch(/rgba/));
            }
        });

        test('replaces previous segment selection', () => {
            const chart = makeChart();
            selectSegment(chart, { category: 'A', fill: 'Complete' });
            selectSegment(chart, { category: 'B', fill: 'Withdrawn' });
            const sel = getSelection(chart);
            expect(sel).toEqual({
                type: 'segment',
                values: [{ category: 'B', fill: 'Withdrawn' }],
            });
        });

        test('replaces category selection with segment selection', () => {
            const chart = makeChart();
            selectCategory(chart, 'A');
            selectSegment(chart, { category: 'B', fill: 'Complete' });
            const sel = getSelection(chart);
            expect(sel).toEqual({
                type: 'segment',
                values: [{ category: 'B', fill: 'Complete' }],
            });
        });
    });

    describe('clearSelection', () => {
        test('clears category selection and restores colors', () => {
            const chart = makeChart();

            // Store original colors
            const origColors = chart.data.datasets.map(
                (ds) => ds.backgroundColor
            );

            selectCategory(chart, 'A');
            clearSelection(chart);

            const sel = getSelection(chart);
            expect(sel).toEqual({ type: null, values: [] });

            // Colors should be restored to originals
            chart.data.datasets.forEach((ds, i) => {
                expect(ds.backgroundColor).toEqual(origColors[i]);
            });
        });

        test('clears segment selection and restores colors', () => {
            const chart = makeChart();
            const origColors = chart.data.datasets.map(
                (ds) => ds.backgroundColor
            );

            selectSegment(chart, { category: 'A', fill: 'Complete' });
            clearSelection(chart);

            const sel = getSelection(chart);
            expect(sel).toEqual({ type: null, values: [] });

            chart.data.datasets.forEach((ds, i) => {
                expect(ds.backgroundColor).toEqual(origColors[i]);
            });
        });

        test('is a no-op when no selection is active', () => {
            const chart = makeChart();
            expect(() => clearSelection(chart)).not.toThrow();
            expect(getSelection(chart)).toEqual({ type: null, values: [] });
        });
    });

    describe('configurable opacity', () => {
        test('uses selection.opacity for dimming (default 0.2)', () => {
            const chart = makeChart();
            selectCategory(chart, 'A');

            // Non-selected bars should use default 0.2 opacity
            const ds = chart.data.datasets[0];
            const colors = ds.backgroundColor;
            const nonSelectedColor = Array.isArray(colors)
                ? colors[1]
                : colors;
            expect(nonSelectedColor).toMatch(/0\.2\)/);
        });

        test('respects custom selection.opacity', () => {
            const chart = makeChart({ selection: { opacity: 0.5 } });
            selectCategory(chart, 'A');

            const ds = chart.data.datasets[0];
            const colors = ds.backgroundColor;
            const nonSelectedColor = Array.isArray(colors)
                ? colors[1]
                : colors;
            expect(nonSelectedColor).toMatch(/0\.5\)/);
        });
    });

    describe('callbacks.onSelect', () => {
        test('fires onSelect when selectCategory is called', () => {
            const onSelect = jest.fn();
            const chart = makeChart({ callbacks: { onSelect } });
            selectCategory(chart, 'A');
            expect(onSelect).toHaveBeenCalledWith(
                { type: 'category', values: ['A'] },
                undefined
            );
        });

        test('fires onSelect when selectSegment is called', () => {
            const onSelect = jest.fn();
            const chart = makeChart({ callbacks: { onSelect } });
            selectSegment(chart, { category: 'A', fill: 'Complete' });
            expect(onSelect).toHaveBeenCalledWith(
                {
                    type: 'segment',
                    values: [{ category: 'A', fill: 'Complete' }],
                },
                undefined
            );
        });

        test('fires onSelect when clearSelection is called', () => {
            const onSelect = jest.fn();
            const chart = makeChart({ callbacks: { onSelect } });
            selectCategory(chart, 'A');
            onSelect.mockClear();
            clearSelection(chart);
            expect(onSelect).toHaveBeenCalledWith(
                { type: null, values: [] },
                undefined
            );
        });

        test('does not fire onSelect when clearSelection is called with no active selection', () => {
            const onSelect = jest.fn();
            const chart = makeChart({ callbacks: { onSelect } });
            clearSelection(chart);
            expect(onSelect).not.toHaveBeenCalled();
        });

        test('does not throw when onSelect is not provided', () => {
            const chart = makeChart();
            expect(() => selectCategory(chart, 'A')).not.toThrow();
        });
    });

    describe('click-to-select (selection.enabled)', () => {
        function simulateClick(chart, datasetIndex, index) {
            const event = { type: 'click' };
            const activeElements = [{ datasetIndex, index }];
            chart.options.onClick(event, activeElements, chart);
        }

        function simulateEmptyClick(chart) {
            const event = { type: 'click' };
            chart.options.onClick(event, [], chart);
        }

        test('clicking a bar selects its category when selection.enabled', () => {
            const chart = makeChart({ selection: { enabled: true } });
            simulateClick(chart, 0, 0); // first dataset, first point (site A)
            const sel = getSelection(chart);
            expect(sel.type).toBe('category');
            expect(sel.values).toContain('A');
        });

        test('clicking does NOT auto-select when selection.enabled is false', () => {
            const chart = makeChart({ selection: { enabled: false } });
            simulateClick(chart, 0, 0);
            const sel = getSelection(chart);
            expect(sel.type).toBeNull();
        });

        test('clicking an already-selected category deselects it', () => {
            const chart = makeChart({ selection: { enabled: true } });
            simulateClick(chart, 0, 0); // select A
            simulateClick(chart, 0, 0); // deselect A
            const sel = getSelection(chart);
            expect(sel).toEqual({ type: null, values: [] });
        });

        test('clicking empty space clears selection', () => {
            const chart = makeChart({ selection: { enabled: true } });
            simulateClick(chart, 0, 0); // select A
            simulateEmptyClick(chart);
            const sel = getSelection(chart);
            expect(sel).toEqual({ type: null, values: [] });
        });

        test('multiple:true allows toggling multiple categories', () => {
            const chart = makeChart({
                selection: { enabled: true, multiple: true },
            });
            simulateClick(chart, 0, 0); // select A
            simulateClick(chart, 0, 1); // also select B
            const sel = getSelection(chart);
            expect(sel.type).toBe('category');
            expect(sel.values).toContain('A');
            expect(sel.values).toContain('B');
        });

        test('multiple:false replaces selection on new click', () => {
            const chart = makeChart({
                selection: { enabled: true, multiple: false },
            });
            simulateClick(chart, 0, 0); // select A
            simulateClick(chart, 0, 1); // select B (replaces A)
            const sel = getSelection(chart);
            expect(sel).toEqual({ type: 'category', values: ['B'] });
        });

        test('onClick callback still fires alongside selection', () => {
            const onClick = jest.fn();
            const chart = makeChart({
                selection: { enabled: true },
                callbacks: { onClick },
            });
            simulateClick(chart, 0, 0);
            expect(onClick).toHaveBeenCalled();
        });

        test('onSelect fires on click-to-select', () => {
            const onSelect = jest.fn();
            const chart = makeChart({
                selection: { enabled: true },
                callbacks: { onSelect },
            });
            simulateClick(chart, 0, 0);
            expect(onSelect).toHaveBeenCalledWith(
                expect.objectContaining({ type: 'category' }),
                expect.anything()
            );
        });
    });
});
