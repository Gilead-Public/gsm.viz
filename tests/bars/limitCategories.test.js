import limitCategories from '../../src/bars/structureData/limitCategories.js';

const data = [
    { site: 'A', score: 5 },
    { site: 'B', score: 30 },
    { site: 'C', score: 10 },
    { site: 'D', score: 20 },
    { site: 'E', score: 1 },
];

const categories = ['A', 'B', 'C', 'D', 'E'];

describe('limitCategories', () => {
    describe('no-op cases', () => {
        test('returns original list when nCategories is undefined', () => {
            const result = limitCategories(
                categories,
                data,
                'site',
                'score',
                undefined
            );
            expect(result.limitedCategories).toEqual(categories);
            expect(result.nExcluded).toBe(0);
        });

        test('returns original list when nCategories equals category count', () => {
            const result = limitCategories(
                categories,
                data,
                'site',
                'score',
                5
            );
            expect(result.limitedCategories).toEqual(categories);
            expect(result.nExcluded).toBe(0);
        });

        test('returns original list when nCategories exceeds category count', () => {
            const result = limitCategories(
                categories,
                data,
                'site',
                'score',
                100
            );
            expect(result.limitedCategories).toEqual(categories);
            expect(result.nExcluded).toBe(0);
        });
    });

    describe("sort='total'", () => {
        test('selects top N categories by descending total', () => {
            const result = limitCategories(
                categories,
                data,
                'site',
                'score',
                3,
                'total'
            );
            // B=30, D=20, C=10, A=5, E=1 → top 3: B, D, C
            expect(result.limitedCategories).toEqual(['B', 'D', 'C']);
            expect(result.nExcluded).toBe(2);
        });

        test('breaks ties alphanumerically', () => {
            const tieData = [
                { site: 'Z', score: 10 },
                { site: 'A', score: 10 },
                { site: 'M', score: 10 },
            ];
            const tieCats = ['A', 'M', 'Z'];
            const result = limitCategories(
                tieCats,
                tieData,
                'site',
                'score',
                2,
                'total'
            );
            // all tied at 10 → alphanumeric: A, M, Z → top 2: A, M
            expect(result.limitedCategories).toEqual(['A', 'M']);
            expect(result.nExcluded).toBe(1);
        });

        test('defaults to total sort when sort parameter is omitted', () => {
            const result = limitCategories(
                categories,
                data,
                'site',
                'score',
                2
            );
            expect(result.limitedCategories).toEqual(['B', 'D']);
        });

        test('works in count mode (no yKey)', () => {
            const countData = [
                { site: 'A' },
                { site: 'A' },
                { site: 'B' },
                { site: 'B' },
                { site: 'B' },
                { site: 'C' },
            ];
            const countCats = ['A', 'B', 'C'];
            const result = limitCategories(
                countCats,
                countData,
                'site',
                undefined,
                2,
                'total'
            );
            // B=3, A=2, C=1 → top 2: B, A
            expect(result.limitedCategories).toEqual(['B', 'A']);
            expect(result.nExcluded).toBe(1);
        });
    });

    describe("sort='alphanumeric'", () => {
        test('selects first N categories in alphanumeric order', () => {
            const result = limitCategories(
                categories,
                data,
                'site',
                'score',
                3,
                'alphanumeric'
            );
            // categories = ['A','B','C','D','E'] → first 3: A, B, C
            expect(result.limitedCategories).toEqual(['A', 'B', 'C']);
            expect(result.nExcluded).toBe(2);
        });

        test('returns correct nExcluded', () => {
            const result = limitCategories(
                categories,
                data,
                'site',
                'score',
                1,
                'alphanumeric'
            );
            expect(result.nExcluded).toBe(4);
        });
    });
});
