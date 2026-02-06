/**
 * @jest-environment jsdom
 */

import applyFilters from '../../src/groupOverviewSubset/applyFilters.js';

describe('applyFilters', () => {
    const groups = [
        { GroupID: 'S1', country: 'USA', siteRiskScore: 75, nRedFlags: 1, nAmberFlags: 0, nGreenFlags: 3 },
        { GroupID: 'S2', country: 'China', siteRiskScore: 30, nRedFlags: 0, nAmberFlags: 1, nGreenFlags: 4 },
        { GroupID: 'S3', country: 'Japan', siteRiskScore: 50, nRedFlags: 0, nAmberFlags: 0, nGreenFlags: 5 },
    ];

    const results = [
        { GroupID: 'S1', MetricID: 'kri0001', Flag: 2 },
        { GroupID: 'S1', MetricID: 'kri0002', Flag: 0 },
        { GroupID: 'S2', MetricID: 'kri0001', Flag: 1 },
        { GroupID: 'S2', MetricID: 'kri0002', Flag: 0 },
        { GroupID: 'S3', MetricID: 'kri0001', Flag: 0 },
        { GroupID: 'S3', MetricID: 'kri0002', Flag: 0 },
    ];

    let updateTableCalls;
    let mockGroupOverview;

    beforeEach(() => {
        updateTableCalls = [];
        mockGroupOverview = {
            updateTable: (filteredResults) => {
                updateTableCalls.push(filteredResults);
            },
        };
    });

    test('filters results to matching group IDs and calls updateTable', () => {
        const filters = [
            {
                id: 'country',
                property: 'country',
                getValue: () => ['USA'],
            },
        ];

        const visibleIDs = applyFilters(mockGroupOverview, results, groups, filters);
        expect(visibleIDs).toEqual(['S1']);
        expect(updateTableCalls).toHaveLength(1);
        expect(updateTableCalls[0].every((r) => r.GroupID === 'S1')).toBe(true);
    });

    test('intersects multiple filters', () => {
        const filters = [
            {
                id: 'country',
                property: 'country',
                getValue: () => ['USA', 'China'],
            },
            {
                id: 'siteRiskScore',
                property: 'siteRiskScore',
                getValue: () => ({ min: 40, max: 100 }),
            },
        ];

        const visibleIDs = applyFilters(mockGroupOverview, results, groups, filters);
        expect(visibleIDs).toEqual(['S1']);
    });

    test('returns all groups when no filters are active', () => {
        const filters = [];
        const visibleIDs = applyFilters(mockGroupOverview, results, groups, filters);
        expect(visibleIDs).toEqual(['S1', 'S2', 'S3']);
    });

    test('returns all groups when all filters return null (no filter)', () => {
        const filters = [
            {
                id: 'country',
                property: 'country',
                getValue: () => null,
            },
            {
                id: 'siteRiskScore',
                property: 'siteRiskScore',
                getValue: () => null,
            },
        ];

        const visibleIDs = applyFilters(mockGroupOverview, results, groups, filters);
        expect(visibleIDs).toEqual(['S1', 'S2', 'S3']);
    });

    test('returns empty array when filters eliminate all groups', () => {
        const filters = [
            {
                id: 'country',
                property: 'country',
                getValue: () => ['Germany'],
            },
        ];

        const visibleIDs = applyFilters(mockGroupOverview, results, groups, filters);
        expect(visibleIDs).toEqual([]);
        expect(updateTableCalls[0]).toEqual([]);
    });
});
