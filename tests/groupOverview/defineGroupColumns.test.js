/**
 * @jest-environment jsdom
 */

import defineGroupColumns from '../../src/groupOverview/defineColumns/defineGroupColumns.js';

describe('defineGroupColumns site risk score column', () => {
    const mockGroupMetadata = [
        {
            GroupID: 'Site001',
            ParticipantCount: 25,
            GroupLabel: 'Site001',
            nRedFlags: 2,
            nAmberFlags: 1,
            nGreenFlags: 5,
            siteRiskScore: 75.5,
        },
        {
            GroupID: 'Site002',
            ParticipantCount: 30,
            GroupLabel: 'Site002',
            nRedFlags: 0,
            nAmberFlags: 2,
            nGreenFlags: 8,
            siteRiskScore: 25.0,
        },
    ];

    const mockGroupMetadataWithoutRiskScore = [
        {
            GroupID: 'Site001',
            ParticipantCount: 25,
            GroupLabel: 'Site001',
            nRedFlags: 2,
            nAmberFlags: 1,
            nGreenFlags: 5,
            // No siteRiskScore property
        },
        {
            GroupID: 'Site002',
            ParticipantCount: 30,
            GroupLabel: 'Site002',
            nRedFlags: 0,
            nAmberFlags: 2,
            nGreenFlags: 8,
            // No siteRiskScore property
        },
    ];

    const mockConfig = {
        GroupLevel: 'Site',
        groupLabelKey: null,
        groupParticipantCountKey: 'ParticipantCount',
        SiteRiskScoreMetricID: 'srs0001',
    };

    const mockMetricMetadata = [
        { MetricID: 'kri0001', GroupLevel: 'Site' },
        { MetricID: 'srs0001', GroupLevel: 'Site' },
    ];

    test('includes Risk Score column when site risk metric exists in results', () => {
        const mockResults = [
            { GroupID: 'Site001', MetricID: 'kri0001', Flag: 0, Score: 0.5 },
            { GroupID: 'Site001', MetricID: 'srs0001', Flag: 1, Score: 75.5 },
            { GroupID: 'Site002', MetricID: 'kri0001', Flag: 2, Score: 0.8 },
            { GroupID: 'Site002', MetricID: 'srs0001', Flag: 0, Score: 25.0 },
        ];

        const columns = defineGroupColumns(
            mockGroupMetadata,
            mockConfig,
            mockResults,
            mockMetricMetadata
        );

        const riskScoreColumn = columns.find(
            (col) => col.label === 'Risk Score'
        );
        expect(riskScoreColumn).toBeDefined();
        expect(riskScoreColumn.valueKey).toBe('siteRiskScore');
        expect(riskScoreColumn.type).toBe('group');
        expect(riskScoreColumn.dataType).toBe('number');
    });

    test('excludes Risk Score column when site risk metric is missing from results', () => {
        const mockResults = [
            { GroupID: 'Site001', MetricID: 'kri0001', Flag: 0, Score: 0.5 },
            { GroupID: 'Site002', MetricID: 'kri0001', Flag: 2, Score: 0.8 },
            // No srs0001 metric data
        ];

        const columns = defineGroupColumns(
            mockGroupMetadataWithoutRiskScore,
            mockConfig,
            mockResults,
            mockMetricMetadata
        );

        const riskScoreColumn = columns.find(
            (col) => col.label === 'Risk Score'
        );
        expect(riskScoreColumn).toBeUndefined();
    });

    test('excludes Risk Score column for non-Site GroupLevel even with risk metric data', () => {
        const nonSiteConfig = {
            ...mockConfig,
            GroupLevel: 'Country',
        };

        const mockResults = [
            { GroupID: 'Site001', MetricID: 'srs0001', Flag: 1, Score: 75.5 },
        ];

        const columns = defineGroupColumns(
            mockGroupMetadata,
            nonSiteConfig,
            mockResults,
            mockMetricMetadata
        );

        const riskScoreColumn = columns.find(
            (col) => col.label === 'Risk Score'
        );
        expect(riskScoreColumn).toBeUndefined();
    });

    test('includes standard columns regardless of risk score availability', () => {
        const mockResults = [
            { GroupID: 'Site001', MetricID: 'kri0001', Flag: 0, Score: 0.5 },
            // No site risk score data
        ];

        const columns = defineGroupColumns(
            mockGroupMetadataWithoutRiskScore,
            mockConfig,
            mockResults,
            mockMetricMetadata
        );

        const columnLabels = columns.map((col) => col.label);
        expect(columnLabels).toContain('Group');
        expect(columnLabels).toContain('Enrolled');
        expect(columnLabels).toContain('Red Flags');
        expect(columnLabels).toContain('Amber Flags');
        expect(columnLabels).not.toContain('Risk Score');
    });

    test('handles empty results array', () => {
        const columns = defineGroupColumns(
            mockGroupMetadataWithoutRiskScore,
            mockConfig,
            [],
            mockMetricMetadata
        );

        const riskScoreColumn = columns.find(
            (col) => col.label === 'Risk Score'
        );
        expect(riskScoreColumn).toBeUndefined();
    });

    test('handles null results parameter', () => {
        const columns = defineGroupColumns(
            mockGroupMetadataWithoutRiskScore,
            mockConfig,
            null,
            mockMetricMetadata
        );

        const riskScoreColumn = columns.find(
            (col) => col.label === 'Risk Score'
        );
        expect(riskScoreColumn).toBeUndefined();
    });

    test('Risk Score column has correct properties when included', () => {
        const mockResults = [
            { GroupID: 'Site001', MetricID: 'srs0001', Flag: 1, Score: 75.5 },
        ];

        const columns = defineGroupColumns(
            mockGroupMetadata,
            mockConfig,
            mockResults,
            mockMetricMetadata
        );

        const riskScoreColumn = columns.find(
            (col) => col.label === 'Risk Score'
        );

        expect(riskScoreColumn).toEqual(
            expect.objectContaining({
                label: 'Risk Score',
                data: mockGroupMetadata,
                filterKey: 'GroupID',
                valueKey: 'siteRiskScore',
                headerTooltip: expect.stringContaining('Site risk score'),
                tooltip: true,
                type: 'group',
                dataType: 'number',
            })
        );
        expect(riskScoreColumn.sort).toBeDefined();
        expect(riskScoreColumn.defineTooltip).toBeDefined();
    });

    test('filters out columns with missing data properties', () => {
        const incompleteGroupMetadata = [
            {
                GroupID: 'Site001',
                GroupLabel: 'Site001',
                nRedFlags: 2,
                nAmberFlags: 1,
                nGreenFlags: 5,
                // Missing ParticipantCount
            },
        ];

        const mockResults = [
            { GroupID: 'Site001', MetricID: 'kri0001', Flag: 0, Score: 0.5 },
        ];

        const columns = defineGroupColumns(
            incompleteGroupMetadata,
            mockConfig,
            mockResults,
            mockMetricMetadata
        );

        const enrolledColumn = columns.find((col) => col.label === 'Enrolled');
        expect(enrolledColumn).toBeUndefined(); // Should be filtered out due to missing ParticipantCount

        const groupColumn = columns.find((col) => col.label === 'Group');
        expect(groupColumn).toBeDefined(); // Should be present
    });
});
