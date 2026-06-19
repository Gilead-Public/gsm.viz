import computeGlobalScales from '../../src/facetBars/computeGlobalScales.js';

const makeSpec = (overrides = {}) => ({
    mapping: { x: 'site', y: 'value' },
    orientation: 'vertical',
    position: 'stack',
    scales: {
        x: { type: 'category' },
        y: { type: 'linear' },
        fill: { palette: [] },
    },
    nCategories: undefined,
    facet: { scales: { x: { free: false }, y: { free: false } } },
    ...overrides,
});

const makeData = () =>
    new Map([
        [
            'US',
            [
                { site: 'A', value: 10, group: 'X' },
                { site: 'A', value: 5, group: 'Y' },
                { site: 'B', value: 20, group: 'X' },
            ],
        ],
        [
            'EU',
            [
                { site: 'A', value: 8, group: 'X' },
                { site: 'C', value: 15, group: 'X' },
                { site: 'C', value: 3, group: 'Y' },
            ],
        ],
    ]);

describe('facetBars/computeGlobalScales', () => {
    describe('stacked position (default)', () => {
        test('returns yMin of 0 when all values are non-negative', () => {
            const spec = makeSpec({ mapping: { x: 'site', y: 'value' } });
            const result = computeGlobalScales(makeData(), spec);
            expect(result.yMin).toBe(0);
        });

        test('returns yMax as the max per-category positive sum across all facets', () => {
            // US site A: 10+5=15, site B: 20. EU site A: 8, site C: 15+3=18
            // Global max = 20
            const spec = makeSpec({ mapping: { x: 'site', y: 'value' } });
            const result = computeGlobalScales(makeData(), spec);
            expect(result.yMax).toBe(20);
        });
    });

    describe('negative values (stacked)', () => {
        test('returns yMin as the most negative per-category sum', () => {
            const negData = new Map([
                [
                    'US',
                    [
                        { site: 'A', value: -5 },
                        { site: 'A', value: -3 },
                        { site: 'B', value: 10 },
                    ],
                ],
            ]);
            const spec = makeSpec({ mapping: { x: 'site', y: 'value' } });
            const result = computeGlobalScales(negData, spec);
            // site A: negative sum = -8; site B: positive sum = 10
            expect(result.yMin).toBe(-8);
            expect(result.yMax).toBe(10);
        });

        test('returns yMin as the most negative individual value for dodge', () => {
            const negData = new Map([
                [
                    'US',
                    [
                        { site: 'A', value: -5 },
                        { site: 'B', value: 10 },
                    ],
                ],
            ]);
            const spec = makeSpec({
                mapping: { x: 'site', y: 'value' },
                position: 'dodge',
            });
            const result = computeGlobalScales(negData, spec);
            expect(result.yMin).toBe(-5);
            expect(result.yMax).toBe(10);
        });
    });

    describe('dodge position', () => {
        test('returns yMax as the max individual value across all facets', () => {
            const spec = makeSpec({
                mapping: { x: 'site', y: 'value' },
                position: 'dodge',
            });
            const result = computeGlobalScales(makeData(), spec);
            // max individual = 20
            expect(result.yMax).toBe(20);
        });
    });

    describe('fill position (100% stacked)', () => {
        test('returns fixed yMin=0 and yMax=100', () => {
            const spec = makeSpec({ position: 'fill' });
            const result = computeGlobalScales(makeData(), spec);
            expect(result.yMin).toBe(0);
            expect(result.yMax).toBe(100);
        });
    });

    describe('free axes', () => {
        test('returns empty object when y axis is free', () => {
            const spec = makeSpec({
                facet: { scales: { x: { free: false }, y: { free: true } } },
            });
            const result = computeGlobalScales(makeData(), spec);
            expect(result).toEqual({});
        });
    });

    describe('count mode (no y mapping)', () => {
        test('computes global max from row counts', () => {
            const spec = makeSpec({ mapping: { x: 'site' } });
            // US: A=2, B=1. EU: A=1, C=2. Global max count = 2
            const result = computeGlobalScales(makeData(), spec);
            expect(result.yMax).toBe(2);
        });
    });

    describe('horizontal orientation', () => {
        test('returns yMin/yMax (spec.scales.y still represents value axis)', () => {
            const spec = makeSpec({ orientation: 'horizontal' });
            const result = computeGlobalScales(makeData(), spec);
            expect(result).toHaveProperty('yMin');
            expect(result).toHaveProperty('yMax');
            expect(result.yMax).toBe(20);
        });
    });

    describe('empty facet data', () => {
        test('handles a facet with no rows', () => {
            const emptyMap = new Map([
                ['US', []],
                ['EU', []],
            ]);
            const spec = makeSpec();
            const result = computeGlobalScales(emptyMap, spec);
            expect(result.yMax).toBe(0);
        });
    });

    describe('function scales.x.order', () => {
        test('does not throw when scales.x.order is a function', () => {
            const spec = makeSpec({
                scales: {
                    x: { type: 'category', order: () => ['A', 'B'] },
                    y: { type: 'linear' },
                    fill: { palette: [] },
                },
            });
            expect(() => computeGlobalScales(makeData(), spec)).not.toThrow();
        });

        test('calls order function with (facetValue, facetData) for each facet', () => {
            const orderFn = jest.fn().mockReturnValue([]);
            const spec = makeSpec({
                scales: {
                    x: { type: 'category', order: orderFn },
                    y: { type: 'linear' },
                    fill: { palette: [] },
                },
            });
            const data = makeData();
            computeGlobalScales(data, spec);
            expect(orderFn).toHaveBeenCalledWith('US', data.get('US'));
            expect(orderFn).toHaveBeenCalledWith('EU', data.get('EU'));
        });

        test('still computes correct global yMax when order is a function', () => {
            const spec = makeSpec({
                mapping: { x: 'site', y: 'value' },
                scales: {
                    x: {
                        type: 'category',
                        order: (fv, fd) => fd.map((d) => d.site),
                    },
                    y: { type: 'linear' },
                    fill: { palette: [] },
                },
            });
            const result = computeGlobalScales(makeData(), spec);
            expect(result.yMax).toBe(20);
        });
    });

    describe('String coercion for category keys', () => {
        test('correctly sums stacked values when category keys are numeric strings', () => {
            // Labels like '1', '2' — String(cat) must match String(l) map key
            const numericData = new Map([
                [
                    'F1',
                    [
                        { site: '1', value: 10 },
                        { site: '2', value: 5 },
                    ],
                ],
            ]);
            const spec = makeSpec({ mapping: { x: 'site', y: 'value' } });
            const result = computeGlobalScales(numericData, spec);
            expect(result.yMax).toBe(10);
        });
    });

    describe('nCategories passthrough', () => {
        test('respects nCategories to limit axis bounds to top-N categories', () => {
            // With nCategories=1, only the top category (B=20) is included;
            // yMax should be 20 not the broader aggregate
            const spec = makeSpec({
                mapping: { x: 'site', y: 'value' },
                nCategories: 1,
            });
            const data = new Map([
                [
                    'US',
                    [
                        { site: 'A', value: 5 },
                        { site: 'B', value: 20 },
                    ],
                ],
            ]);
            const result = computeGlobalScales(data, spec);
            expect(result.yMax).toBe(20);
            expect(result.yMin).toBe(0);
        });
    });
});
