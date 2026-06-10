import buildTooltip from '../../src/bars/getPlugins/buildTooltip.js';

// Minimal Chart.js tooltip context factory.
// Simulates a stacked bar with two fill groups (A=2, B=4) in a single category.
function makeContext({ datasetIndex = 0, datasets, indexAxis = 'x' } = {}) {
    const defaultDatasets = [
        { label: 'A', data: [{ x: 'cat1', y: 2, _fill: 'A', _datum: { x: 'cat1', fill: 'A', y: 2 } }] },
        { label: 'B', data: [{ x: 'cat1', y: 4, _fill: 'B', _datum: { x: 'cat1', fill: 'B', y: 4 } }] },
    ];
    const ds = datasets || defaultDatasets;
    const chart = {
        options: { indexAxis },
        data: { datasets: ds },
        isDatasetVisible: () => true,
    };
    return {
        chart,
        dataset: ds[datasetIndex],
        dataIndex: 0,
        parsed: { x: 'cat1', y: ds[datasetIndex].data[0].y },
    };
}

describe('bars/getPlugins/buildTooltip', () => {
    describe('existing pass-through behavior', () => {
        test('enabled is true by default', () => {
            const result = buildTooltip({}, 'stack');
            expect(result.enabled).toBe(true);
        });

        test('passes through arbitrary Chart.js tooltip options', () => {
            const result = buildTooltip({ mode: 'index', intersect: false }, 'stack');
            expect(result.mode).toBe('index');
            expect(result.intersect).toBe(false);
        });

        test('preserves caller-provided callbacks.label for any position', () => {
            const customLabel = jest.fn(() => 'custom');
            const result = buildTooltip({ callbacks: { label: customLabel } }, 'fill');
            expect(result.callbacks.label).toBe(customLabel);
        });

        test('injects fillLabelCallback for position fill when no label callback is set', () => {
            const result = buildTooltip({}, 'fill');
            expect(typeof result.callbacks?.label).toBe('function');
            // The fill callback returns a percentage string
            const ctx = makeContext();
            const label = result.callbacks.label(ctx);
            expect(label).toMatch(/%/);
        });

        test('no label callback injected for non-fill position without format/formatter', () => {
            const result = buildTooltip({}, 'stack');
            expect(result.callbacks?.label).toBeUndefined();
        });
    });

    describe('tooltip.format', () => {
        test('format: count injects a label callback', () => {
            const result = buildTooltip({ format: 'count' }, 'stack');
            expect(typeof result.callbacks?.label).toBe('function');
        });

        test('format: count returns count with dataset label prefix', () => {
            const result = buildTooltip({ format: 'count' }, 'stack');
            const ctx = makeContext({ datasetIndex: 0 }); // A: 2
            expect(result.callbacks.label(ctx)).toBe('A: 2');
        });

        test('format: count — no prefix when dataset has no label', () => {
            const result = buildTooltip({ format: 'count' }, 'stack');
            const datasets = [{ data: [{ x: 'cat1', y: 5 }] }];
            const ctx = makeContext({ datasetIndex: 0, datasets });
            expect(result.callbacks.label(ctx)).toBe('5');
        });

        test('format: percent returns percentage of category total', () => {
            const result = buildTooltip({ format: 'percent' }, 'stack');
            const ctx = makeContext({ datasetIndex: 0 }); // A=2, total=6 → 33.3%
            const label = result.callbacks.label(ctx);
            expect(label).toBe('A: 33.3%');
        });

        test('format: count+percent returns count and percentage', () => {
            const result = buildTooltip({ format: 'count+percent' }, 'stack');
            const ctx = makeContext({ datasetIndex: 0 }); // A=2, total=6 → 33.3%
            expect(result.callbacks.label(ctx)).toBe('A: 2 (33.3%)');
        });

        test('format: percent+count returns percentage and count', () => {
            const result = buildTooltip({ format: 'percent+count' }, 'stack');
            const ctx = makeContext({ datasetIndex: 0 }); // A=2, total=6 → 33.3%
            expect(result.callbacks.label(ctx)).toBe('A: 33.3% (2)');
        });

        test('format works for second dataset', () => {
            const result = buildTooltip({ format: 'count+percent' }, 'stack');
            const ctx = makeContext({ datasetIndex: 1 }); // B=4, total=6 → 66.7%
            expect(result.callbacks.label(ctx)).toBe('B: 4 (66.7%)');
        });

        test('format works for horizontal bars (indexAxis y)', () => {
            const datasets = [
                { label: 'A', data: [{ y: 'cat1', x: 2, _fill: 'A' }] },
                { label: 'B', data: [{ y: 'cat1', x: 4, _fill: 'B' }] },
            ];
            const ctx = {
                chart: {
                    options: { indexAxis: 'y' },
                    data: { datasets },
                    isDatasetVisible: () => true,
                },
                dataset: datasets[0],
                dataIndex: 0,
                parsed: { y: 'cat1', x: 2 },
            };
            const result = buildTooltip({ format: 'count+percent' }, 'stack');
            expect(result.callbacks.label(ctx)).toBe('A: 2 (33.3%)');
        });

        test('format: count+percent uses _rawY for fill-normalized bars', () => {
            // Simulate a fill-normalized bar: rendered y=33.33, _rawY=2
            const datasets = [
                { label: 'A', data: [{ x: 'cat1', y: 33.33, _rawY: 2, _fill: 'A' }] },
                { label: 'B', data: [{ x: 'cat1', y: 66.67, _rawY: 4, _fill: 'B' }] },
            ];
            const ctx = {
                chart: {
                    options: { indexAxis: 'x' },
                    data: { datasets },
                    isDatasetVisible: () => true,
                },
                dataset: datasets[0],
                dataIndex: 0,
                parsed: { x: 'cat1', y: 33.33 },
            };
            const result = buildTooltip({ format: 'count+percent' }, 'fill');
            // Should use _rawY=2, total=6 → 33.3%
            expect(result.callbacks.label(ctx)).toBe('A: 2 (33.3%)');
        });

        test('format strips format key from forwarded Chart.js options', () => {
            const result = buildTooltip({ format: 'count', mode: 'index' }, 'stack');
            expect(result.format).toBeUndefined();
            expect(result.mode).toBe('index');
        });

        test('callbacks.label takes precedence over format', () => {
            const customLabel = jest.fn(() => 'custom');
            const result = buildTooltip({ format: 'count', callbacks: { label: customLabel } }, 'stack');
            expect(result.callbacks.label).toBe(customLabel);
        });
    });

    describe('tooltip.formatter', () => {
        test('formatter injects a label callback', () => {
            const formatter = jest.fn((count) => `count=${count}`);
            const result = buildTooltip({ formatter }, 'stack');
            expect(typeof result.callbacks?.label).toBe('function');
        });

        test('formatter callback receives count as first argument', () => {
            let capturedCount;
            const formatter = (count) => { capturedCount = count; return ''; };
            const result = buildTooltip({ formatter }, 'stack');
            const ctx = makeContext({ datasetIndex: 0 }); // A=2
            result.callbacks.label(ctx);
            expect(capturedCount).toBe(2);
        });

        test('formatter callback receives context as second argument', () => {
            let capturedCtx;
            const formatter = (_count, ctx) => { capturedCtx = ctx; return ''; };
            const result = buildTooltip({ formatter }, 'stack');
            const ctx = makeContext({ datasetIndex: 0 });
            result.callbacks.label(ctx);
            expect(capturedCtx).toBe(ctx);
        });

        test('formatter callback receives details with percent, total, fill, datum', () => {
            let capturedDetails;
            const formatter = (_count, _ctx, details) => { capturedDetails = details; return ''; };
            const result = buildTooltip({ formatter }, 'stack');
            const ctx = makeContext({ datasetIndex: 0 }); // A=2, total=6
            result.callbacks.label(ctx);
            expect(capturedDetails.percent).toBeCloseTo(33.33, 1);
            expect(capturedDetails.total).toBe(6);
            expect(capturedDetails.fill).toBe('A');
            expect(capturedDetails.datum).toEqual({ x: 'cat1', fill: 'A', y: 2 });
        });

        test('formatter return value is used as the label', () => {
            const formatter = (count, _ctx, { percent }) =>
                `${count} subjects — ${percent.toFixed(0)}% of site`;
            const result = buildTooltip({ formatter }, 'stack');
            const ctx = makeContext({ datasetIndex: 0 }); // A=2, total=6
            expect(result.callbacks.label(ctx)).toBe('2 subjects — 33% of site');
        });

        test('formatter takes precedence over format', () => {
            let formatterCalled = false;
            const formatter = () => { formatterCalled = true; return 'fmt'; };
            const result = buildTooltip({ format: 'count', formatter }, 'stack');
            const ctx = makeContext();
            result.callbacks.label(ctx);
            expect(formatterCalled).toBe(true);
        });

        test('callbacks.label takes precedence over formatter', () => {
            const customLabel = jest.fn(() => 'custom');
            const formatter = jest.fn(() => 'fmt');
            const result = buildTooltip({ formatter, callbacks: { label: customLabel } }, 'stack');
            expect(result.callbacks.label).toBe(customLabel);
        });

        test('formatter strips formatter key from forwarded Chart.js options', () => {
            const formatter = jest.fn();
            const result = buildTooltip({ formatter, mode: 'index' }, 'stack');
            expect(result.formatter).toBeUndefined();
            expect(result.mode).toBe('index');
        });
    });
});
