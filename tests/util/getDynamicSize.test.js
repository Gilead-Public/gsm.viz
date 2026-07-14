import getDynamicSize from '../../src/util/getDynamicSize.js';

describe('getDynamicSize', () => {
    test('returns numCategories * default pxPerCategory (30)', () => {
        expect(getDynamicSize(10)).toBe(300);
    });

    test('returns numCategories * custom pxPerCategory', () => {
        expect(getDynamicSize(10, 40)).toBe(400);
    });

    test('returns 0 when numCategories is 0', () => {
        expect(getDynamicSize(0)).toBe(0);
    });

    test('returns pxPerCategory for a single category', () => {
        expect(getDynamicSize(1)).toBe(30);
    });
});
