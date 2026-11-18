import selectRow from '../../src/metricOverview/selectRow.js';

const rows = [
    { GroupID: 'Site 01', SnapshotDate: '2024-01-01', Metric: 0.1 },
    { GroupID: 'Site 01', SnapshotDate: '2024-02-01', Metric: 0.2 },
    { GroupID: 'Site 02', SnapshotDate: '2024-02-01', Metric: 0.3 },
    { GroupID: 101, SnapshotDate: '2024-02-01', Metric: 0.4 },
];

describe('metricOverview selectRow', () => {
    test('returns the only row without selectors', () => {
        expect(selectRow([rows[2]], {})).toBe(rows[2]);
    });

    test('returns null when there are no rows', () => {
        expect(selectRow([], {})).toBeNull();
    });

    test('selects by group and snapshot', () => {
        expect(
            selectRow(rows, { groupId: 'Site 01', snapshotDate: '2024-02-01' })
        ).toBe(rows[1]);
    });

    test('selects by group when the group has one row', () => {
        expect(selectRow(rows, { groupId: 'Site 02' })).toBe(rows[2]);
    });

    test('matches numeric and string IDs by their text', () => {
        expect(selectRow(rows, { groupId: '101' })).toBe(rows[3]);
        expect(selectRow(rows.slice(0, 3), { groupId: 'Site 02' })).toBe(
            rows[2]
        );
    });

    test('returns null when no row matches the selectors', () => {
        expect(selectRow(rows, { groupId: 'Site 99' })).toBeNull();
        expect(
            selectRow(rows, { groupId: 'Site 02', snapshotDate: '2024-01-01' })
        ).toBeNull();
    });

    test('refuses to choose between several matching rows', () => {
        expect(() => selectRow(rows, {})).toThrow(
            '4 results rows match; set spec.groupId and/or spec.snapshotDate to choose one'
        );
        expect(() => selectRow(rows, { groupId: 'Site 01' })).toThrow(
            '2 results rows match'
        );
    });
});
