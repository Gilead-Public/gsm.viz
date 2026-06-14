import computeGlobalScales from '../../src/facetBars/computeGlobalScales.js';

const makeSpec = (overrides = {}) => ({
    mapping: { x: 'site', y: 'value' },
    orientation: 'vertical',
    position: 'stack',
    scales: { x: { type: 'category' }, y: { type: 'linear' }, fill: { palette: [] } },
    nCategories: undefined,
    facet: { scales: { x: { free: false }, y: { free: false } } },
    ...overrides,
});

const makeData = () => new Map([
    ['US', [
        { site: 'A', value: 10, group: 'X' },
        { site: 'A', value: 5, group: 'Y' },
        { site: 'B', value: 20, group: 'X' },
    ]],
    ['EU', [
        { site: 'A', value: 8, group: 'X' },
        { site: 'C', value: 15, group: 'X' },
        { site: 'C', value: 3, group: 'Y' },
    ]],
]);

describe('facetBars/computeGlobalScales', () => {
    describe('stacked position (default)', () => {
        test('returns yMin of 0', () => {
            const spec = makeSpec({ mapping: { x: 'site', y: 'value' } });
            const result = computeGlobalScales(makeData(), spec);
            expect(result.yMin).toBe(0);
        });

        test('returns yMax as the max per-category sum across all facets', () => {
            // US site A: 10+5=15, site B: 20. EU site A: 8, site C: 15+3=18
            // Global max = 20
            const spec = makeSpec({ mapping: { x: 'site', y: 'value' } });
            const result = computeGlobalScales(makeData(), spec);
            expect(result.yMax).toBe(20);
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
            const emptyMap = new Map([['US', []], ['EU', []]]);
            const spec = makeSpec();
            const result = computeGlobalScales(emptyMap, spec);
            expect(result.yMax).toBe(0);
        });
    });
});
