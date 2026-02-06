/**
 * @jest-environment jsdom
 */

import getGroupIDs from '../../src/groupOverviewSubset/getGroupIDs.js';

const groups = [
    { GroupID: 'Site001', country: 'USA', Status: 'Active', siteRiskScore: 75, ParticipantCount: 25, nRedFlags: 2, nAmberFlags: 0, nGreenFlags: 3 },
    { GroupID: 'Site002', country: 'USA', Status: 'Closed', siteRiskScore: 30, ParticipantCount: 10, nRedFlags: 0, nAmberFlags: 1, nGreenFlags: 4 },
    { GroupID: 'Site003', country: 'China', Status: 'Active', siteRiskScore: 50, ParticipantCount: 40, nRedFlags: 0, nAmberFlags: 0, nGreenFlags: 5 },
    { GroupID: 'Site004', country: 'China', Status: 'Closed', siteRiskScore: 90, ParticipantCount: 15, nRedFlags: 1, nAmberFlags: 2, nGreenFlags: 2 },
    { GroupID: 'Site005', country: 'Japan', Status: 'Active', ParticipantCount: 20, nRedFlags: 0, nAmberFlags: 0, nGreenFlags: 5 },
];

describe('getGroupIDs', () => {
    // ── categorical ──────────────────────────────────────────────────

    describe('categorical filter', () => {
        test('returns matching group IDs for a single value', () => {
            const ids = getGroupIDs(groups, 'country', ['Japan']);
            expect(ids).toEqual(['Site005']);
        });

        test('returns matching group IDs for multiple values', () => {
            const ids = getGroupIDs(groups, 'country', ['USA', 'Japan']);
            expect(ids).toEqual(['Site001', 'Site002', 'Site005']);
        });

        test('returns all group IDs for ["all"]', () => {
            const ids = getGroupIDs(groups, 'country', ['all']);
            expect(ids).toEqual(groups.map((g) => g.GroupID));
        });

        test('returns all group IDs for empty array', () => {
            const ids = getGroupIDs(groups, 'country', []);
            expect(ids).toEqual(groups.map((g) => g.GroupID));
        });

        test('returns empty array when no groups match', () => {
            const ids = getGroupIDs(groups, 'country', ['Germany']);
            expect(ids).toEqual([]);
        });

        test('handles scalar value as single-value categorical', () => {
            const ids = getGroupIDs(groups, 'Status', 'Active');
            expect(ids).toEqual(['Site001', 'Site003', 'Site005']);
        });
    });

    // ── range ────────────────────────────────────────────────────────

    describe('range filter', () => {
        test('returns group IDs within a min/max range', () => {
            const ids = getGroupIDs(groups, 'siteRiskScore', { min: 40, max: 80 });
            expect(ids).toEqual(['Site001', 'Site003']);
        });

        test('returns group IDs with only min specified', () => {
            const ids = getGroupIDs(groups, 'siteRiskScore', { min: 80 });
            expect(ids).toEqual(['Site004']);
        });

        test('returns group IDs with only max specified', () => {
            const ids = getGroupIDs(groups, 'siteRiskScore', { max: 35 });
            expect(ids).toEqual(['Site002']);
        });

        test('excludes groups with undefined values for the property', () => {
            const ids = getGroupIDs(groups, 'siteRiskScore', { min: 0, max: 100 });
            // Site005 has no siteRiskScore
            expect(ids).not.toContain('Site005');
            expect(ids).toHaveLength(4);
        });

        test('returns empty array when no groups fall in range', () => {
            const ids = getGroupIDs(groups, 'siteRiskScore', { min: 200, max: 300 });
            expect(ids).toEqual([]);
        });

        test('handles string numeric values from CSV metadata', () => {
            const stringGroups = [
                { GroupID: 'S1', ParticipantCount: '25' },
                { GroupID: 'S2', ParticipantCount: '10' },
                { GroupID: 'S3', ParticipantCount: '40' },
            ];
            const ids = getGroupIDs(stringGroups, 'ParticipantCount', { min: 15, max: 30 });
            expect(ids).toEqual(['S1']);
        });
    });

    // ── anyFlag ──────────────────────────────────────────────────────

    describe('anyFlag filter', () => {
        test('returns groups with red flags', () => {
            const ids = getGroupIDs(groups, 'anyFlag', 'red');
            expect(ids).toEqual(['Site001', 'Site004']);
        });

        test('returns groups with amber flags', () => {
            const ids = getGroupIDs(groups, 'anyFlag', 'amber');
            expect(ids).toEqual(['Site002', 'Site004']);
        });

        test('returns groups with red or amber flags', () => {
            const ids = getGroupIDs(groups, 'anyFlag', 'red-or-amber');
            expect(ids).toEqual(['Site001', 'Site002', 'Site004']);
        });

        test('returns all groups for "all"', () => {
            const ids = getGroupIDs(groups, 'anyFlag', 'all');
            expect(ids).toEqual(groups.map((g) => g.GroupID));
        });

        test('handles array input for anyFlag', () => {
            const ids = getGroupIDs(groups, 'anyFlag', ['red']);
            expect(ids).toEqual(['Site001', 'Site004']);
        });
    });

    // ── null / undefined ─────────────────────────────────────────────

    describe('null and undefined values', () => {
        test('returns all group IDs when value is null', () => {
            const ids = getGroupIDs(groups, 'country', null);
            expect(ids).toEqual(groups.map((g) => g.GroupID));
        });

        test('returns all group IDs when value is undefined', () => {
            const ids = getGroupIDs(groups, 'country', undefined);
            expect(ids).toEqual(groups.map((g) => g.GroupID));
        });
    });

    // ── edge cases ───────────────────────────────────────────────────

    describe('edge cases', () => {
        test('handles empty groups array', () => {
            const ids = getGroupIDs([], 'country', ['USA']);
            expect(ids).toEqual([]);
        });

        test('handles property that does not exist on any group', () => {
            const ids = getGroupIDs(groups, 'nonexistent', ['anything']);
            expect(ids).toEqual([]);
        });
    });
});
