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

describe('filter combinations', () => {
    test('intersection of two categorical filters', () => {
        const byCountry = getGroupIDs(groups, 'country', ['USA']);
        const byStatus = getGroupIDs(groups, 'Status', ['Active']);
        const intersection = byCountry.filter((id) =>
            byStatus.includes(id)
        );
        expect(intersection).toEqual(['Site001']);
    });

    test('intersection of categorical + continuous filter', () => {
        const byCountry = getGroupIDs(groups, 'country', ['China']);
        const byScore = getGroupIDs(groups, 'siteRiskScore', {
            min: 40,
            max: 60,
        });
        const intersection = byCountry.filter((id) =>
            byScore.includes(id)
        );
        expect(intersection).toEqual(['Site003']);
    });

    test('intersection of flag + categorical filter', () => {
        const byFlag = getGroupIDs(groups, 'anyFlag', 'red-or-amber');
        const byCountry = getGroupIDs(groups, 'country', ['China']);
        const intersection = byFlag.filter((id) =>
            byCountry.includes(id)
        );
        expect(intersection).toEqual(['Site004']);
    });

    test('all filters active simultaneously', () => {
        const byFlag = getGroupIDs(groups, 'anyFlag', 'all');
        const byCountry = getGroupIDs(groups, 'country', ['USA', 'China']);
        const byScore = getGroupIDs(groups, 'siteRiskScore', {
            min: 20,
            max: 80,
        });
        const byEnrolled = getGroupIDs(groups, 'ParticipantCount', {
            min: 10,
            max: 30,
        });

        let intersection = byFlag;
        [byCountry, byScore, byEnrolled].forEach((ids) => {
            const set = new Set(ids);
            intersection = intersection.filter((id) => set.has(id));
        });

        // Site001: USA, score 75, enrolled 25, flags → yes
        // Site002: USA, score 30, enrolled 10, flags → yes
        expect(intersection).toEqual(['Site001', 'Site002']);
    });

    test('resetting a filter to "all" widens the results', () => {
        // Start with narrow filter.
        const narrow = getGroupIDs(groups, 'country', ['Japan']);
        expect(narrow).toEqual(['Site005']);

        // Reset to all.
        const wide = getGroupIDs(groups, 'country', null);
        expect(wide).toEqual(groups.map((g) => g.GroupID));
    });

    test('empty intersection when filters are contradictory', () => {
        const byFlag = getGroupIDs(groups, 'anyFlag', 'red');
        const byCountry = getGroupIDs(groups, 'country', ['Japan']);
        const intersection = byFlag.filter((id) =>
            byCountry.includes(id)
        );
        expect(intersection).toEqual([]);
    });
});
