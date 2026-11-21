import orderCategories from '../../src/metricDistribution/orderCategories.js';

const rows = [
    { Category: 'Adverse Event', Count: 3 },
    { Category: null, Count: 2 },
    { Category: 'Other', Count: 7 },
    { Category: 'Physician Decision', Count: 3 },
    { Category: 'Withdrawal by Participant', Count: 0 },
    { Category: 'Progressive Disease', Count: 5 },
];

const names = (list) => list.map((row) => row.Category);

describe('orderCategories', () => {
    test('sorts recorded categories by descending count', () => {
        const { shown } = orderCategories(rows);
        expect(names(shown)).toEqual([
            'Other',
            'Progressive Disease',
            'Adverse Event',
            'Physician Decision',
            'Withdrawal by Participant',
        ]);
    });

    test('keeps input order between categories with equal counts', () => {
        const { shown } = orderCategories([
            { Category: 'B', Count: 1 },
            { Category: 'A', Count: 1 },
        ]);
        expect(names(shown)).toEqual(['B', 'A']);
    });

    test('takes the blank category out of the sort as "Not recorded"', () => {
        const { shown, notRecorded } = orderCategories(rows);
        expect(names(shown)).not.toContain(null);
        expect(notRecorded).toEqual({ Category: null, Count: 2 });
    });

    test('treats an absent Category as blank', () => {
        const { shown, notRecorded } = orderCategories([
            { Category: 'A', Count: 1 },
            { Count: 4 },
        ]);
        expect(names(shown)).toEqual(['A']);
        expect(notRecorded).toEqual({ Count: 4 });
    });

    test('drops a blank category with no records', () => {
        const { notRecorded } = orderCategories([
            { Category: 'A', Count: 1 },
            { Category: null, Count: 0 },
        ]);
        expect(notRecorded).toBeNull();
    });

    test('shows every recorded category without a top-N limit', () => {
        const { shown, collapsed } = orderCategories(rows);
        expect(shown).toHaveLength(5);
        expect(collapsed).toEqual([]);
    });

    test('collapses categories beyond the top N, largest first', () => {
        const { shown, collapsed } = orderCategories(rows, 2);
        expect(names(shown)).toEqual(['Other', 'Progressive Disease']);
        expect(names(collapsed)).toEqual([
            'Adverse Event',
            'Physician Decision',
            'Withdrawal by Participant',
        ]);
    });

    test('never collapses "Not recorded"', () => {
        const { collapsed, notRecorded } = orderCategories(rows, 1);
        expect(names(collapsed)).not.toContain(null);
        expect(notRecorded.Count).toBe(2);
    });

    test('collapses nothing when the top N covers every category', () => {
        const { shown, collapsed } = orderCategories(rows, 5);
        expect(shown).toHaveLength(5);
        expect(collapsed).toEqual([]);
    });

    test('does not reorder its input', () => {
        const input = rows.slice();
        orderCategories(input, 2);
        expect(input).toEqual(rows);
    });
});
