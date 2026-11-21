import normalizeResult from '../../src/metricDistribution/normalizeResult.js';

describe('normalizeResult', () => {
    test('reads numeric strings as numbers', () => {
        expect(
            normalizeResult({
                Numerator: '57',
                Denominator: ' 412 ',
                Metric: '0.138349515',
            })
        ).toEqual({ Numerator: 57, Denominator: 412, Metric: 0.138349515 });
    });

    test('keeps numbers as they are', () => {
        expect(
            normalizeResult({ Numerator: 0, Denominator: 15, Metric: 0 })
        ).toEqual({ Numerator: 0, Denominator: 15, Metric: 0 });
    });

    test('reads unavailable values as null, never as zero', () => {
        expect(
            normalizeResult({ Numerator: 'NA', Denominator: '', Metric: null })
        ).toEqual({ Numerator: null, Denominator: null, Metric: null });
        expect(normalizeResult({ Numerator: ' ' })).toEqual({
            Numerator: null,
            Denominator: null,
            Metric: null,
        });
    });

    test('leaves the other columns and the input row untouched', () => {
        const row = { MetricID: 'kri0006', Score: '1.2', Numerator: '3' };
        expect(normalizeResult(row)).toMatchObject({
            MetricID: 'kri0006',
            Score: '1.2',
            Numerator: 3,
        });
        expect(row.Numerator).toBe('3');
    });

    test('passes an absent result through', () => {
        expect(normalizeResult(undefined)).toBeUndefined();
        expect(normalizeResult(null)).toBeNull();
    });
});
