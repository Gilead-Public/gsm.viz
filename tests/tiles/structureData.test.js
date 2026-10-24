import mergeSpec from '../../src/tiles/mergeSpec.js';
import structureData, {
    orderValues,
    sortDetailValues,
} from '../../src/tiles/structureData.js';
import { makeData, makeSpec } from './fixtures.js';

describe('tiles/structureData', () => {
    test('orders by first appearance by default (unsorted)', () => {
        const data = [
            { y: 'b', x: 'Z' },
            { y: 'a', x: 'A' },
            { y: 'b', x: 'A' },
        ];
        const s = structureData(
            data,
            mergeSpec({ mapping: { x: 'x', y: 'y' } })
        );
        expect(s.rows.map((r) => r.value)).toEqual(['b', 'a']);
        expect(s.columns.map((c) => c.value)).toEqual(['Z', 'A']);
    });

    test('explicit order first, then remaining values', () => {
        expect(orderValues(['a', 'b', 'c', 'a'], ['c', 'x'])).toEqual([
            'c',
            'x',
            'a',
            'b',
        ]);
    });

    test('looks up cells and reports missing combinations', () => {
        const s = structureData(makeData(), mergeSpec(makeSpec()));
        expect(s.getCell('S1', 'Weight').flag).toBe('Red');
        expect(s.getCell('S2', 'Pulse')).toBeUndefined();
        expect(s.rowData.get('S1')).toHaveLength(2);
    });

    test('builds numerically sorted detail columns per x', () => {
        const s = structureData(makeData(), mergeSpec(makeSpec()));
        const weight = s.columns.find((c) => c.value === 'Weight');
        const pulse = s.columns.find((c) => c.value === 'Pulse');
        expect(weight.details).toEqual([1, 2, 10]);
        expect(pulse.details).toEqual([]);
    });

    test('joins detail rows on compact x and y fields', () => {
        const s = structureData(makeData(), mergeSpec(makeSpec()));
        expect(s.getDetailCell('S1', 'Weight', 10).value).toBe(70);
        expect(s.getDetailCell('S2', 'Weight', 10)).toBeUndefined();
        expect(s.getDetailCell('S1', 'Pulse', 10)).toBeUndefined();
    });

    test('keeps first-appearance order for non-numeric detail values', () => {
        expect(sortDetailValues(['v2', 'v10', 'v1'])).toEqual([
            'v2',
            'v10',
            'v1',
        ]);
        expect(sortDetailValues(['3', 1, '2'])).toEqual([1, '2', '3']);
    });
});
