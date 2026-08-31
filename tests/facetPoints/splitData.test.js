import splitData, {
    formatFacetValue,
} from '../../src/facetPoints/splitData.js';

const data = [
    { region: 'North', value: 1 },
    { region: 'South', value: 2 },
    { region: 'North', value: 3 },
];

describe('facetPoints/splitData', () => {
    test('splits rows in first-seen facet order and preserves references', () => {
        const result = splitData(data, 'region');

        expect(result).toBeInstanceOf(Map);
        expect([...result.keys()]).toEqual(['North', 'South']);
        expect(result.get('North')).toEqual([data[0], data[2]]);
        expect(result.get('North')[0]).toBe(data[0]);
    });

    test('uses explicit order as an ordered allowlist', () => {
        const result = splitData(data, 'region', ['South', 'Missing request']);

        expect([...result.keys()]).toEqual(['South', 'Missing request']);
        expect(result.get('South')).toEqual([data[1]]);
        expect(result.get('Missing request')).toEqual([]);
        expect(result.has('North')).toBe(false);
    });

    test('distinguishes numeric and string facet identities', () => {
        const number = { region: 1 };
        const string = { region: '1' };
        const result = splitData([number, string], 'region', [1, '1']);

        expect([...result.keys()]).toEqual([1, '1']);
        expect(result.get(1)).toEqual([number]);
        expect(result.get('1')).toEqual([string]);
    });

    test('coalesces all missing source values into the null facet', () => {
        const rows = [
            { region: null },
            {},
            { region: '' },
            { region: '   ' },
            { region: NaN },
        ];
        const result = splitData(rows, 'region');

        expect([...result.keys()]).toEqual([null]);
        expect(result.get(null)).toEqual(rows);
        expect(formatFacetValue(null)).toBe('(Missing)');
    });

    test('keeps literal "(Missing)" separate from the missing facet', () => {
        const result = splitData(
            [{ region: null }, { region: '(Missing)' }],
            'region',
            [null, '(Missing)']
        );

        expect([...result.keys()]).toEqual([null, '(Missing)']);
        expect(formatFacetValue(null)).toBe('(Missing)');
        expect(formatFacetValue('(Missing)')).toBe('"(Missing)"');
    });

    test('returns no entries for empty data without an order', () => {
        expect(splitData([], 'region')).toEqual(new Map());
    });

    test('creates ordered empty facets for empty data', () => {
        expect(splitData([], 'region', ['South', 'North'])).toEqual(
            new Map([
                ['South', []],
                ['North', []],
            ])
        );
    });
});
