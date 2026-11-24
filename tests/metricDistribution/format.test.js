import {
    formatCount,
    formatPercent,
} from '../../src/metricDistribution/format.js';

describe('formatCount', () => {
    test('shows whole numbers with thousands separators', () => {
        expect(formatCount(0)).toBe('0');
        expect(formatCount(1234)).toBe('1,234');
    });

    test('shows a dash for an unavailable value', () => {
        expect(formatCount(null)).toBe('—');
        expect(formatCount(undefined)).toBe('—');
    });
});

describe('formatPercent', () => {
    test('shows a proportion as a percentage with one decimal', () => {
        expect(formatPercent(0)).toBe('0.0%');
        expect(formatPercent(0.4)).toBe('40.0%');
        expect(formatPercent(0.123456)).toBe('12.3%');
        expect(formatPercent(1)).toBe('100.0%');
    });

    test('shows a dash for an unavailable value', () => {
        expect(formatPercent(null)).toBe('—');
        expect(formatPercent(undefined)).toBe('—');
        expect(formatPercent(NaN)).toBe('—');
    });
});
