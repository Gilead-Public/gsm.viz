import getContrastColor from '../../src/bars/structureData/getContrastColor.js';

describe('bars/structureData/getContrastColor', () => {
    describe('dark backgrounds → light text (#ffffff)', () => {
        test('returns white for #4e79a7 (Tableau blue)', () => {
            expect(getContrastColor('#4e79a7')).toBe('#ffffff');
        });

        test('returns white for #9c755f (Tableau brown)', () => {
            expect(getContrastColor('#9c755f')).toBe('#ffffff');
        });

        test('returns white for pure black', () => {
            expect(getContrastColor('#000000')).toBe('#ffffff');
        });

        test('returns white for #333333 (dark gray)', () => {
            expect(getContrastColor('#333333')).toBe('#ffffff');
        });

        test('returns white for #e15759 (Tableau red)', () => {
            expect(getContrastColor('#e15759')).toBe('#ffffff');
        });
    });

    describe('light backgrounds → dark text (#333333)', () => {
        test('returns dark for pure white', () => {
            expect(getContrastColor('#ffffff')).toBe('#333333');
        });

        test('returns dark for #edc948 (Tableau yellow)', () => {
            expect(getContrastColor('#edc948')).toBe('#333333');
        });

        test('returns dark for #ff9da7 (Tableau pink)', () => {
            expect(getContrastColor('#ff9da7')).toBe('#333333');
        });

        test('returns dark for #bab0ac (Tableau light gray)', () => {
            expect(getContrastColor('#bab0ac')).toBe('#333333');
        });

        test('returns dark for #76b7b2 (Tableau teal)', () => {
            expect(getContrastColor('#76b7b2')).toBe('#333333');
        });
    });

    describe('fallback for non-parseable inputs', () => {
        test('returns dark text for undefined', () => {
            expect(getContrastColor(undefined)).toBe('#333333');
        });

        test('returns dark text for null', () => {
            expect(getContrastColor(null)).toBe('#333333');
        });

        test('returns dark text for shorthand 3-digit hex', () => {
            expect(getContrastColor('#fff')).toBe('#333333');
        });

        test('returns dark text for CSS color name', () => {
            expect(getContrastColor('red')).toBe('#333333');
        });

        test('returns dark text for rgba() string', () => {
            expect(getContrastColor('rgba(78,121,167,1)')).toBe('#333333');
        });
    });
});
