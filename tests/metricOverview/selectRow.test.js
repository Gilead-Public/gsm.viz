import selectRow from '../../src/metricOverview/selectRow.js';

const rows = [
    { GroupID: 'Site 01', SnapshotDate: '2024-01-01', Metric: 0.1 },
    { GroupID: 'Site 01', SnapshotDate: '2024-02-01', Metric: 0.2 },
    { GroupID: 'Site 02', SnapshotDate: '2024-02-01', Metric: 0.3 },
    { GroupID: 101, SnapshotDate: '2024-02-01', Metric: 0.4 },
];

// One GroupID shared by two group levels of one study and by a site of
// another study.
const overlapping = [
    { StudyID: 'AA-1', GroupLevel: 'Site', GroupID: '01', Metric: 0.1 },
    { StudyID: 'AA-1', GroupLevel: 'Country', GroupID: '01', Metric: 0.2 },
    { StudyID: 'BB-2', GroupLevel: 'Site', GroupID: '01', Metric: 0.3 },
].map((row) => ({ ...row, SnapshotDate: '2024-02-01' }));

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

    test('selects by study and group level when group IDs overlap', () => {
        const group = { groupId: '01', snapshotDate: '2024-02-01' };
        const pick = (spec) => selectRow(overlapping, { ...group, ...spec });

        expect(pick({ studyId: 'AA-1', groupLevel: 'Site' })).toBe(
            overlapping[0]
        );
        expect(pick({ studyId: 'AA-1', groupLevel: 'Country' })).toBe(
            overlapping[1]
        );
        expect(pick({ groupLevel: 'Country' })).toBe(overlapping[1]);
        expect(pick({ studyId: 'BB-2' })).toBe(overlapping[2]);
        expect(pick({ studyId: 'BB-2', groupLevel: 'Country' })).toBeNull();
    });

    test('refuses to choose between rows that share a group ID across studies or group levels', () => {
        expect(() =>
            selectRow(overlapping, {
                groupId: '01',
                snapshotDate: '2024-02-01',
            })
        ).toThrow('3 results rows match');
        expect(() =>
            selectRow(overlapping, { groupId: '01', studyId: 'AA-1' })
        ).toThrow('2 results rows match');
    });

    test('refuses to choose between several matching rows', () => {
        expect(() => selectRow(rows, {})).toThrow(
            '4 results rows match; set spec.studyId, spec.groupLevel, spec.groupId and/or spec.snapshotDate to choose one'
        );
        expect(() => selectRow(rows, { groupId: 'Site 01' })).toThrow(
            '2 results rows match'
        );
    });
});
