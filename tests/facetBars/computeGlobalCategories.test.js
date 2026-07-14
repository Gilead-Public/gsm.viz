import computeGlobalCategories from '../../src/facetBars/computeGlobalCategories.js';

/**
 * Build a simple facetDataMap from an object of { facetValue: [rows] }.
 */
const makeMap = (obj) => new Map(Object.entries(obj));

const baseSpec = (overrides = {}) => ({
    mapping: { x: 'site', y: 'value' },
    orientation: 'vertical',
    position: 'stack',
    scales: {},
    nCategories: undefined,
    facet: {
        scales: { x: { free: false }, y: { free: false } },
    },
    ...overrides,
});

describe('facetBars/computeGlobalCategories', () => {
    describe('x.free: true', () => {
        test('returns null when facet.scales.x.free is true', () => {
            const facetDataMap = makeMap({
                US: [{ site: 'A', value: 1 }],
                EU: [{ site: 'B', value: 2 }],
            });
            const spec = baseSpec({
                facet: { scales: { x: { free: true }, y: { free: false } } },
            });
            expect(computeGlobalCategories(facetDataMap, spec)).toBeNull();
        });
    });

    describe('no scales.x.order (alphanumeric union)', () => {
        test('returns all unique categories sorted alphanumerically', () => {
            const facetDataMap = makeMap({
                US: [
                    { site: 'C', value: 1 },
                    { site: 'A', value: 2 },
                ],
                EU: [
                    { site: 'B', value: 3 },
                    { site: 'A', value: 4 },
                ],
            });
            const spec = baseSpec();
            const result = computeGlobalCategories(facetDataMap, spec);
            expect(result).toEqual(['A', 'B', 'C']);
        });

        test('includes categories present in only one facet', () => {
            const facetDataMap = makeMap({
                US: [{ site: 'A', value: 1 }],
                EU: [{ site: 'B', value: 2 }],
                APAC: [
                    { site: 'A', value: 3 },
                    { site: 'C', value: 4 },
                ],
            });
            const spec = baseSpec();
            const result = computeGlobalCategories(facetDataMap, spec);
            expect(result).toEqual(['A', 'B', 'C']);
        });

        test('handles a single facet', () => {
            const facetDataMap = makeMap({
                US: [
                    { site: 'B', value: 1 },
                    { site: 'A', value: 2 },
                ],
            });
            const spec = baseSpec();
            expect(computeGlobalCategories(facetDataMap, spec)).toEqual([
                'A',
                'B',
            ]);
        });

        test('handles a facet with empty data', () => {
            const facetDataMap = makeMap({
                US: [{ site: 'A', value: 1 }],
                EU: [], // no rows
            });
            const spec = baseSpec();
            expect(computeGlobalCategories(facetDataMap, spec)).toEqual(['A']);
        });

        test('handles all facets empty', () => {
            const facetDataMap = makeMap({ US: [], EU: [] });
            const spec = baseSpec();
            expect(computeGlobalCategories(facetDataMap, spec)).toEqual([]);
        });

        test('sorts case-insensitively', () => {
            const facetDataMap = makeMap({
                US: [{ site: 'b', value: 1 }],
                EU: [{ site: 'A', value: 2 }],
            });
            const spec = baseSpec();
            const result = computeGlobalCategories(facetDataMap, spec);
            // 'A' < 'b' case-insensitively
            expect(result[0]).toBe('A');
            expect(result[1]).toBe('b');
        });
    });

    describe('scales.x.order is an array (explicit global order)', () => {
        test('returns the explicit order array unchanged', () => {
            const facetDataMap = makeMap({
                US: [
                    { site: 'A', value: 1 },
                    { site: 'B', value: 2 },
                ],
                EU: [{ site: 'C', value: 3 }],
            });
            const spec = baseSpec({
                scales: { x: { order: ['C', 'B', 'A'] } },
            });
            expect(computeGlobalCategories(facetDataMap, spec)).toEqual([
                'C',
                'B',
                'A',
            ]);
        });

        test('includes order entries even when absent from all facets', () => {
            const facetDataMap = makeMap({
                US: [{ site: 'A', value: 1 }],
            });
            const spec = baseSpec({
                scales: { x: { order: ['A', 'B', 'C'] } },
            });
            // 'B' and 'C' not in data — still included in global list
            expect(computeGlobalCategories(facetDataMap, spec)).toEqual([
                'A',
                'B',
                'C',
            ]);
        });
    });

    describe('scales.x.order is a function (per-facet order)', () => {
        test('calls the function for each facet with (facetValue, facetData)', () => {
            const orderFn = jest.fn().mockReturnValue([]);
            const facetDataMap = makeMap({
                US: [{ site: 'A', value: 1 }],
                EU: [{ site: 'B', value: 2 }],
            });
            const spec = baseSpec({ scales: { x: { order: orderFn } } });
            computeGlobalCategories(facetDataMap, spec);
            expect(orderFn).toHaveBeenCalledTimes(2);
            expect(orderFn).toHaveBeenCalledWith('US', facetDataMap.get('US'));
            expect(orderFn).toHaveBeenCalledWith('EU', facetDataMap.get('EU'));
        });

        test('unions per-facet results preserving first-seen order', () => {
            // US returns ['B','A'], EU returns ['C','A'] → union: ['B','A','C']
            const orderFn = jest
                .fn()
                .mockReturnValueOnce(['B', 'A'])
                .mockReturnValueOnce(['C', 'A']);
            const facetDataMap = makeMap({
                US: [{ site: 'A' }, { site: 'B' }],
                EU: [{ site: 'A' }, { site: 'C' }],
            });
            const spec = baseSpec({ scales: { x: { order: orderFn } } });
            expect(computeGlobalCategories(facetDataMap, spec)).toEqual([
                'B',
                'A',
                'C',
            ]);
        });

        test('appends any categories missing from all per-facet orders alphanumerically', () => {
            // orderFn only returns ['A'] but 'D' appears in data without being in any facet order
            const orderFn = jest.fn().mockReturnValue(['A']);
            const facetDataMap = makeMap({
                US: [
                    { site: 'A', value: 1 },
                    { site: 'D', value: 2 },
                ],
                EU: [{ site: 'A', value: 3 }],
            });
            const spec = baseSpec({ scales: { x: { order: orderFn } } });
            const result = computeGlobalCategories(facetDataMap, spec);
            // 'A' from order, then 'D' appended (in data but not in any order result)
            expect(result).toEqual(['A', 'D']);
        });
    });
});
