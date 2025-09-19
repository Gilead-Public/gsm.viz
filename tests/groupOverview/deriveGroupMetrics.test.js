/**
 * @jest-environment jsdom
 */

import deriveGroupMetrics from '../../src/groupOverview/deriveGroupMetrics.js';

describe('deriveGroupMetrics site risk score handling', () => {
    const mockGroupMetadata = [
        {
            GroupLevel: 'Site',
            GroupID: 'Site001',
            Param: 'ParticipantCount',
            Value: '25',
        },
        {
            GroupLevel: 'Site',
            GroupID: 'Site002',
            Param: 'ParticipantCount',
            Value: '30',
        },
    ];

    const mockConfig = {
        GroupLevel: 'Site',
        groupLabelKey: null,
        SiteRiskMetric: 'srs0001',
    };

    test('sets siteRiskScore when metric exists in results', () => {
        const mockResults = [
            { GroupID: 'Site001', MetricID: 'kri0001', Flag: 0, Score: 0.5 },
            { GroupID: 'Site001', MetricID: 'srs0001', Flag: 1, Score: 75.5 },
            { GroupID: 'Site002', MetricID: 'kri0001', Flag: 2, Score: 0.8 },
            { GroupID: 'Site002', MetricID: 'srs0001', Flag: 0, Score: 25.0 },
        ];

        const result = deriveGroupMetrics(
            mockGroupMetadata,
            mockResults,
            mockConfig
        );

        expect(result).toHaveLength(2);
        expect(result[0].siteRiskScore).toBe(75.5);
        expect(result[1].siteRiskScore).toBe(25.0);
    });

    test('does not set siteRiskScore when metric is missing from results', () => {
        const mockResults = [
            { GroupID: 'Site001', MetricID: 'kri0001', Flag: 0, Score: 0.5 },
            { GroupID: 'Site002', MetricID: 'kri0001', Flag: 2, Score: 0.8 },
            // No srs0001 metric data
        ];

        const result = deriveGroupMetrics(
            mockGroupMetadata,
            mockResults,
            mockConfig
        );

        expect(result).toHaveLength(2);
        expect(result[0]).not.toHaveProperty('siteRiskScore');
        expect(result[1]).not.toHaveProperty('siteRiskScore');
    });

    test('handles partial site risk score data', () => {
        const mockResults = [
            { GroupID: 'Site001', MetricID: 'kri0001', Flag: 0, Score: 0.5 },
            { GroupID: 'Site001', MetricID: 'srs0001', Flag: 1, Score: 60.0 },
            { GroupID: 'Site002', MetricID: 'kri0001', Flag: 2, Score: 0.8 },
            // Site002 has no srs0001 data
        ];

        const result = deriveGroupMetrics(
            mockGroupMetadata,
            mockResults,
            mockConfig
        );

        expect(result).toHaveLength(2);
        expect(result[0].siteRiskScore).toBe(60.0);
        expect(result[1]).not.toHaveProperty('siteRiskScore');
    });

    test('does not set siteRiskScore for non-Site GroupLevel', () => {
        const nonSiteConfig = {
            ...mockConfig,
            GroupLevel: 'Country',
        };

        const countryGroupMetadata = [
            {
                GroupLevel: 'Country',
                GroupID: 'USA',
                Param: 'ParticipantCount',
                Value: '100',
            },
            {
                GroupLevel: 'Country',
                GroupID: 'Canada',
                Param: 'ParticipantCount',
                Value: '50',
            },
        ];

        const mockResults = [
            { GroupID: 'USA', MetricID: 'srs0001', Flag: 1, Score: 75.5 },
        ];

        const result = deriveGroupMetrics(
            countryGroupMetadata,
            mockResults,
            nonSiteConfig
        );

        expect(result).toHaveLength(2);
        expect(result[0]).not.toHaveProperty('siteRiskScore');
    });

    test('correctly parses site risk score as float', () => {
        const mockResults = [
            {
                GroupID: 'Site001',
                MetricID: 'srs0001',
                Flag: 1,
                Score: '85.75',
            },
        ];

        const result = deriveGroupMetrics(
            mockGroupMetadata,
            mockResults,
            mockConfig
        );

        expect(result[0].siteRiskScore).toBe(85.75);
        expect(typeof result[0].siteRiskScore).toBe('number');
    });

    test('handles empty results array', () => {
        const result = deriveGroupMetrics(mockGroupMetadata, [], mockConfig);

        expect(result).toHaveLength(2);
        expect(result[0]).not.toHaveProperty('siteRiskScore');
        expect(result[1]).not.toHaveProperty('siteRiskScore');
    });

    test('correctly counts flags regardless of site risk score presence', () => {
        const mockResults = [
            { GroupID: 'Site001', MetricID: 'kri0001', Flag: 2, Score: 0.5 },
            { GroupID: 'Site001', MetricID: 'kri0002', Flag: 1, Score: 0.3 },
            { GroupID: 'Site001', MetricID: 'kri0003', Flag: 0, Score: 0.1 },
            // No site risk score data
        ];

        const result = deriveGroupMetrics(
            mockGroupMetadata,
            mockResults,
            mockConfig
        );

        expect(result[0].nRedFlags).toBe(1);
        expect(result[0].nAmberFlags).toBe(1);
        expect(result[0].nGreenFlags).toBe(1);
        expect(result[0]).not.toHaveProperty('siteRiskScore');
    });
});
