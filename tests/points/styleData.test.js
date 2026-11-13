import {
    mapSizeValue,
    mapOpacityValue,
    withOpacity,
} from '../../src/points/styleData.js';

describe('points/styleData transforms', () => {
    test('maps size by point area rather than radius', () => {
        const domain = [0, 100];
        const range = [2, 10];

        expect(mapSizeValue(0, domain, range)).toBe(2);
        expect(mapSizeValue(100, domain, range)).toBe(10);
        expect(mapSizeValue(50, domain, range)).toBeCloseTo(
            Math.sqrt((2 ** 2 + 10 ** 2) / 2)
        );
        expect(mapSizeValue(50, domain, range)).not.toBe(6);
    });

    test('uses the midpoint radius for an equal size domain', () => {
        expect(mapSizeValue(5, [5, 5], [2, 10])).toBe(6);
    });

    test('maps and clamps opacity into the configured range', () => {
        expect(mapOpacityValue(-10, [0, 10], [0.2, 0.8])).toBe(0.2);
        expect(mapOpacityValue(0, [0, 10], [0.2, 0.8])).toBe(0.2);
        expect(mapOpacityValue(5, [0, 10], [0.2, 0.8])).toBeCloseTo(0.5);
        expect(mapOpacityValue(10, [0, 10], [0.2, 0.8])).toBe(0.8);
        expect(mapOpacityValue(20, [0, 10], [0.2, 0.8])).toBe(0.8);
    });

    test('uses the midpoint opacity for an equal domain', () => {
        expect(mapOpacityValue(5, [5, 5], [0.2, 0.8])).toBeCloseTo(0.5);
    });

    test('applies opacity to supported CSS colors', () => {
        expect(withOpacity('#123456', 0.5)).toBe('rgba(18, 52, 86, 0.5)');
        expect(withOpacity('red', 1)).toBe('rgb(255, 0, 0)');
    });

    test('rejects a color that cannot be combined with opacity', () => {
        expect(() => withOpacity('not-a-color', 0.5)).toThrow(
            'points could not apply opacity to color "not-a-color"'
        );
    });
});
