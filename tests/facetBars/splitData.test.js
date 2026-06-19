import splitData from '../../src/facetBars/splitData.js';

describe('facetBars/splitData', () => {
    const data = [
        { country: 'US', metric: 'AE', value: 10 },
        { country: 'US', metric: 'SAE', value: 5 },
        { country: 'EU', metric: 'AE', value: 8 },
        { country: 'EU', metric: 'SAE', value: 3 },
        { country: 'APAC', metric: 'AE', value: 6 },
    ];

    test('returns a Map', () => {
        expect(splitData(data, 'country')).toBeInstanceOf(Map);
    });

    test('splits data into correct number of groups', () => {
        expect(splitData(data, 'country').size).toBe(3);
    });

    test('each group contains the correct rows', () => {
        const result = splitData(data, 'country');
        expect(result.get('US')).toHaveLength(2);
        expect(result.get('EU')).toHaveLength(2);
        expect(result.get('APAC')).toHaveLength(1);
    });

    test('preserves original row references', () => {
        const result = splitData(data, 'country');
        expect(result.get('US')[0]).toBe(data[0]);
    });

    test('uses natural insertion order when no order provided', () => {
        const result = splitData(data, 'country');
        expect([...result.keys()]).toEqual(['US', 'EU', 'APAC']);
    });

    test('respects explicit order array', () => {
        const result = splitData(data, 'country', ['APAC', 'EU', 'US']);
        expect([...result.keys()]).toEqual(['APAC', 'EU', 'US']);
    });

    test('filters out values not in order array', () => {
        const result = splitData(data, 'country', ['US', 'EU']);
        expect(result.size).toBe(2);
        expect(result.has('APAC')).toBe(false);
    });

    test('handles empty data', () => {
        expect(splitData([], 'country').size).toBe(0);
    });

    test('coerces field values to strings for consistent keying', () => {
        const numData = [
            { group: 1, val: 10 },
            { group: 2, val: 20 },
            { group: 1, val: 30 },
        ];
        const result = splitData(numData, 'group');
        expect(result.has('1')).toBe(true);
        expect(result.get('1')).toHaveLength(2);
    });

    test('order array values are also coerced to strings', () => {
        const numData = [
            { group: 1, val: 10 },
            { group: 2, val: 20 },
        ];
        const result = splitData(numData, 'group', [2, 1]);
        expect([...result.keys()]).toEqual(['2', '1']);
    });

    test('returns empty groups for order values with no matching rows', () => {
        const result = splitData(data, 'country', ['US', 'MISSING']);
        expect(result.has('MISSING')).toBe(true);
        expect(result.get('MISSING')).toHaveLength(0);
    });
});
