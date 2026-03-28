/**
 * @jest-environment jsdom
 */

import results from '../../examples/data/results.json';
import metricMetadata from '../../examples/data/metricMetadata.json';
import groupMetadata from '../../examples/data/groupMetadata.json';

import groupOverview from '../../src/groupOverview.js';
import groupOverviewSubset from '../../src/groupOverviewSubset.js';

const GroupLevel = 'Site';
const regex = /^kri/;

const resultsSubset = results.filter(
    (d) => regex.test(d.MetricID) || d.MetricID === 'srs0001'
);
const metricMetadataSubset = metricMetadata.filter((d) =>
    regex.test(d.MetricID)
);

describe('groupOverviewSubset integration', () => {
    let container;

    beforeEach(() => {
        container = document.createElement('div');
        document.body.appendChild(container);
    });

    afterEach(() => {
        document.body.innerHTML = '';
    });

    test('renders filter controls and subsets the table', () => {
        const table = groupOverview(
            container,
            resultsSubset,
            { GroupLevel, SiteRiskScoreMetricID: 'srs0001' },
            groupMetadata,
            metricMetadataSubset
        );

        const filters = groupOverviewSubset(table, {
            groupCharacteristics: { Country: 'country', Status: 'Status' },
            defaultFilters: ['anyFlag'],
        });

        // Filter controls should be rendered.
        const fieldsets = container.parentNode.querySelectorAll('.gsm-viz-filter');
        // anyFlag + Country + Status = 3
        expect(fieldsets.length).toBe(3);

        // API methods exist.
        expect(typeof filters.applyFilters).toBe('function');
        expect(typeof filters.getGroupIDs).toBe('function');
        expect(typeof filters.setFilter).toBe('function');
        expect(typeof filters.getFilterState).toBe('function');
    });

    test('table contains only matching group IDs after filtering', () => {
        const table = groupOverview(
            container,
            resultsSubset,
            { GroupLevel, SiteRiskScoreMetricID: 'srs0001' },
            groupMetadata,
            metricMetadataSubset
        );

        const filters = groupOverviewSubset(table, {
            defaultFilters: ['anyFlag'],
            initialSubset: { anyFlag: 'red' },
        });

        // Get visible group IDs from the API.
        const visibleIDs = filters.getGroupIDs();

        // There should be at least one visible group.
        expect(visibleIDs.length).toBeGreaterThan(0);

        // Derive the set of group IDs that have at least one red flag
        // by looking at the enriched group metrics from the context.
        const groupsWithRedFlags = new Set(
            resultsSubset
                .filter((r) => Math.abs(parseInt(r.Flag)) === 2)
                .map((r) => r.GroupID)
        );

        // Every visible group must be one that has a red flag.
        visibleIDs.forEach((id) => {
            expect(groupsWithRedFlags.has(id)).toBe(true);
        });

        // And every group with a red flag should be visible.
        groupsWithRedFlags.forEach((id) => {
            expect(visibleIDs).toContain(id);
        });
    });

    test('throws when passed an invalid groupOverview instance', () => {
        expect(() => {
            groupOverviewSubset({}, {});
        }).toThrow();
    });

    test('siteRiskScore filter is not rendered for non-Site GroupLevel', () => {
        const couResults = results.filter((d) => /^cou/.test(d.MetricID));
        const couMetadata = metricMetadata.filter((d) =>
            /^cou/.test(d.MetricID)
        );
        const couGroupMetadata = groupMetadata.filter(
            (d) => d.GroupLevel === 'Country'
        );

        const table = groupOverview(
            container,
            couResults,
            { GroupLevel: 'Country' },
            couGroupMetadata,
            couMetadata
        );

        const filters = groupOverviewSubset(table, {
            defaultFilters: ['anyFlag', 'siteRiskScore'],
        });

        // siteRiskScore should not appear — only anyFlag should be present.
        const filterIds = filters.filters.map((f) => f.id);
        expect(filterIds).not.toContain('siteRiskScore');
        expect(filterIds).toContain('anyFlag');
    });

    test('setFilter programmatically updates the table', () => {
        const table = groupOverview(
            container,
            resultsSubset,
            { GroupLevel, SiteRiskScoreMetricID: 'srs0001' },
            groupMetadata,
            metricMetadataSubset
        );

        const subset = groupOverviewSubset(table, {
            defaultFilters: ['anyFlag'],
        });

        // Programmatically set to red-only.
        subset.setFilter('anyFlag', ['red']);

        const state = subset.getFilterState();
        // The anyFlag filter should reflect the selection — 'red' selected.
        expect(state.anyFlag).toEqual(['red']);
    });
});
