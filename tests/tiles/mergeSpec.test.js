import mergeSpec, { deepMerge } from '../../src/tiles/mergeSpec.js';
import { makeSpec } from './fixtures.js';

describe('tiles/mergeSpec', () => {
    test('applies defaults', () => {
        const merged = mergeSpec({ mapping: { x: 'a', y: 'b' } });
        expect(merged.theme).toEqual({
            cellWidth: 64,
            detailCellWidth: 32,
            cellHeight: 28,
            rowHeaderWidth: 120,
            maxHeight: '600px',
            fontSize: 12,
            legend: true,
        });
        expect(merged.scales.fill.missing).toBe('#f6f6f6');
        expect(merged.rows.pageSize).toBeNull();
        expect(merged.expand).toBeNull();
        expect(merged.callbacks).toEqual({
            onClick: null,
            onRowClick: null,
            onExpand: null,
        });
    });

    test('keeps user values and is idempotent', () => {
        const merged = mergeSpec(makeSpec({ theme: { cellWidth: 80 } }));
        expect(merged.theme.cellWidth).toBe(80);
        expect(merged.expand.initial).toEqual([]);
        expect(mergeSpec(merged)).toEqual(merged);
    });

    test('deepMerge merges objects and replaces arrays', () => {
        const target = { a: { b: 1, c: [1, 2] }, d: 1 };
        expect(deepMerge(target, { a: { c: [3] } })).toEqual({
            a: { b: 1, c: [3] },
            d: 1,
        });
        expect(target.a.c).toEqual([1, 2]);
        expect(deepMerge(target, { a: null })).toEqual({ a: null, d: 1 });
    });
});
