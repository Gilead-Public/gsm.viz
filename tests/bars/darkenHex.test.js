import darkenHex from '../../src/bars/structureData/darkenHex.js';

describe('bars/structureData/darkenHex', () => {
    test('darkens a 6-digit hex color by 20%', () => {
        // #ffffff → 255 * 0.8 = 204 = #cc
        expect(darkenHex('#ffffff')).toBe('#cccccc');
    });

    test('handles lowercase hex', () => {
        // #4e79a7 → r=78*0.8=62.4→62=3e, g=121*0.8=96.8→97=61, b=167*0.8=133.6→134=86
        expect(darkenHex('#4e79a7')).toBe('#3e6186');
    });

    test('handles uppercase hex', () => {
        expect(darkenHex('#FFFFFF')).toBe('#cccccc');
    });

    test('returns input unchanged for shorthand 3-digit hex', () => {
        expect(darkenHex('#fff')).toBe('#fff');
    });

    test('returns input unchanged for CSS color names', () => {
        expect(darkenHex('red')).toBe('red');
    });

    test('returns input unchanged for rgb() strings', () => {
        expect(darkenHex('rgb(100,200,50)')).toBe('rgb(100,200,50)');
    });

    test('returns input unchanged for rgba() strings', () => {
        expect(darkenHex('rgba(100,200,50,0.5)')).toBe('rgba(100,200,50,0.5)');
    });

    test('returns input unchanged for undefined', () => {
        expect(darkenHex(undefined)).toBe(undefined);
    });

    test('returns input unchanged for null', () => {
        expect(darkenHex(null)).toBe(null);
    });

    test('pads single-digit hex channels correctly', () => {
        // #0f0000 → r=15*0.8=12=0c, g=0*0.8=0=00, b=0*0.8=0=00
        expect(darkenHex('#0f0000')).toBe('#0c0000');
    });
});
