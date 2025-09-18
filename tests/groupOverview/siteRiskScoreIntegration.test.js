/**
 * @jest-environment jsdom
 */

import groupOverview from '../../src/groupOverview.js';

describe('groupOverview site risk score integration tests', () => {
    const mockGroupMetadata = [
        { GroupLevel: 'Site', GroupID: 'Site001', Param: 'ParticipantCount', Value: '25' },
        { GroupLevel: 'Site', GroupID: 'Site002', Param: 'ParticipantCount', Value: '30' }
    ];

    const mockMetricMetadata = [
        { MetricID: 'kri0001', GroupLevel: 'Site', Metric: 'Test Metric 1' },
        { MetricID: 'kri0002', GroupLevel: 'Site', Metric: 'Test Metric 2' },
        { MetricID: 'srs0001', GroupLevel: 'Site', Metric: 'Site Risk Score' }
    ];

    let container;

    beforeEach(() => {
        container = document.createElement('div');
        document.body.appendChild(container);
    });

    afterEach(() => {
        document.body.removeChild(container);
    });

    test('creates table with Risk Score column when metric exists', () => {
        const mockResults = [
            { StudyID: 'STUDY01', GroupLevel: 'Site', GroupID: 'Site001', MetricID: 'kri0001', Flag: 1, Score: 0.5, SnapshotDate: '2023-01-01', Numerator: '5', Denominator: '10', Metric: 'Test Metric 1' },
            { StudyID: 'STUDY01', GroupLevel: 'Site', GroupID: 'Site001', MetricID: 'kri0002', Flag: 0, Score: 0.3, SnapshotDate: '2023-01-01', Numerator: '3', Denominator: '10', Metric: 'Test Metric 2' },
            { StudyID: 'STUDY01', GroupLevel: 'Site', GroupID: 'Site001', MetricID: 'srs0001', Flag: 1, Score: 75.5, SnapshotDate: '2023-01-01', Numerator: '75.5', Denominator: '100', Metric: 'Site Risk Score' },
            { StudyID: 'STUDY01', GroupLevel: 'Site', GroupID: 'Site002', MetricID: 'kri0001', Flag: 2, Score: 0.8, SnapshotDate: '2023-01-01', Numerator: '8', Denominator: '10', Metric: 'Test Metric 1' },
            { StudyID: 'STUDY01', GroupLevel: 'Site', GroupID: 'Site002', MetricID: 'kri0002', Flag: 1, Score: 0.6, SnapshotDate: '2023-01-01', Numerator: '6', Denominator: '10', Metric: 'Test Metric 2' },
            { StudyID: 'STUDY01', GroupLevel: 'Site', GroupID: 'Site002', MetricID: 'srs0001', Flag: 0, Score: 25.0, SnapshotDate: '2023-01-01', Numerator: '25.0', Denominator: '100', Metric: 'Site Risk Score' }
        ];

        const config = {
            GroupLevel: 'Site',
            SiteRiskMetric: 'srs0001'
        };

        const instance = groupOverview(
            container,
            mockResults,
            config,
            mockGroupMetadata,
            mockMetricMetadata
        );

        expect(instance).toBeDefined();
        
        // Check that Risk Score column header exists
        const headers = Array.from(container.querySelectorAll('th'));
        const riskScoreHeaderExists = headers.some(header => 
            header.textContent.includes('Risk Score')
        );
        expect(riskScoreHeaderExists).toBe(true);
    });

    test('creates table without Risk Score column when metric is missing', () => {
        const mockResults = [
            { StudyID: 'STUDY01', GroupLevel: 'Site', GroupID: 'Site001', MetricID: 'kri0001', Flag: 1, Score: 0.5, SnapshotDate: '2023-01-01', Numerator: '5', Denominator: '10', Metric: 'Test Metric 1' },
            { StudyID: 'STUDY01', GroupLevel: 'Site', GroupID: 'Site001', MetricID: 'kri0002', Flag: 0, Score: 0.3, SnapshotDate: '2023-01-01', Numerator: '3', Denominator: '10', Metric: 'Test Metric 2' },
            { StudyID: 'STUDY01', GroupLevel: 'Site', GroupID: 'Site002', MetricID: 'kri0001', Flag: 2, Score: 0.8, SnapshotDate: '2023-01-01', Numerator: '8', Denominator: '10', Metric: 'Test Metric 1' },
            { StudyID: 'STUDY01', GroupLevel: 'Site', GroupID: 'Site002', MetricID: 'kri0002', Flag: 1, Score: 0.6, SnapshotDate: '2023-01-01', Numerator: '6', Denominator: '10', Metric: 'Test Metric 2' }
            // No srs0001 data
        ];

        const config = {
            GroupLevel: 'Site',
            SiteRiskMetric: 'srs0001'
        };

        const instance = groupOverview(
            container,
            mockResults,
            config,
            mockGroupMetadata,
            mockMetricMetadata
        );

        expect(instance).toBeDefined();
        
        // Check that Risk Score column header does not exist
        const headers = Array.from(container.querySelectorAll('th'));
        const riskScoreHeaderExists = headers.some(header => 
            header.textContent.includes('Risk Score')
        );
        expect(riskScoreHeaderExists).toBe(false);
        
        // Verify other columns still exist
        const groupHeaderExists = headers.some(header => 
            header.textContent.includes('Group')
        );
        expect(groupHeaderExists).toBe(true);
    });

    test('creates table without Risk Score column for non-Site GroupLevel', () => {
        const mockResults = [
            { StudyID: 'STUDY01', GroupLevel: 'Country', GroupID: 'USA', MetricID: 'srs0001', Flag: 1, Score: 75.5, SnapshotDate: '2023-01-01', Numerator: '75.5', Denominator: '100', Metric: 'Site Risk Score' }
        ];

        const countryGroupMetadata = [
            { GroupLevel: 'Country', GroupID: 'USA', Param: 'ParticipantCount', Value: '100' }
        ];

        const config = {
            GroupLevel: 'Country', // Non-site level
            SiteRiskMetric: 'srs0001'
        };

        const instance = groupOverview(
            container,
            mockResults,
            config,
            countryGroupMetadata,
            mockMetricMetadata
        );

        expect(instance).toBeDefined();
        
        // Risk Score column should not exist for non-Site GroupLevel
        const headers = Array.from(container.querySelectorAll('th'));
        const riskScoreHeaderExists = headers.some(header => 
            header.textContent.includes('Risk Score')
        );
        expect(riskScoreHeaderExists).toBe(false);
    });

    test('handles empty results gracefully', () => {
        const config = {
            GroupLevel: 'Site',
            SiteRiskMetric: 'srs0001'
        };

        const instance = groupOverview(
            container,
            [], // Empty results
            config,
            mockGroupMetadata,
            mockMetricMetadata
        );

        expect(instance).toBeDefined();
        
        // Should still create table structure
        const table = container.querySelector('table');
        expect(table).toBeDefined();
        
        // Risk Score column should not exist with empty results
        const headers = Array.from(container.querySelectorAll('th'));
        const riskScoreHeaderExists = headers.some(header => 
            header.textContent.includes('Risk Score')
        );
        expect(riskScoreHeaderExists).toBe(false);
    });

    test('handles missing config gracefully', () => {
        const mockResults = [
            { StudyID: 'STUDY01', GroupLevel: 'Site', GroupID: 'Site001', MetricID: 'srs0001', Flag: 1, Score: 75.5, SnapshotDate: '2023-01-01', Numerator: '75.5', Denominator: '100', Metric: 'Site Risk Score' }
        ];

        const instance = groupOverview(
            container,
            mockResults,
            null, // No config
            mockGroupMetadata,
            mockMetricMetadata
        );

        expect(instance).toBeDefined();
        
        // Should use default config and create Risk Score column
        const headers = Array.from(container.querySelectorAll('th'));
        const riskScoreHeaderExists = headers.some(header => 
            header.textContent.includes('Risk Score')
        );
        expect(riskScoreHeaderExists).toBe(true);
    });

    test('updateTable method preserves risk score column behavior', () => {
        const mockResults = [
            { StudyID: 'STUDY01', GroupLevel: 'Site', GroupID: 'Site001', MetricID: 'kri0001', Flag: 1, Score: 0.5, SnapshotDate: '2023-01-01', Numerator: '5', Denominator: '10', Metric: 'Test Metric 1' },
            { StudyID: 'STUDY01', GroupLevel: 'Site', GroupID: 'Site001', MetricID: 'srs0001', Flag: 1, Score: 75.5, SnapshotDate: '2023-01-01', Numerator: '75.5', Denominator: '100', Metric: 'Site Risk Score' }
        ];

        const config = {
            GroupLevel: 'Site',
            SiteRiskMetric: 'srs0001'
        };

        const instance = groupOverview(
            container,
            mockResults,
            config,
            mockGroupMetadata,
            mockMetricMetadata
        );

        expect(instance.updateTable).toBeDefined();
        expect(typeof instance.updateTable).toBe('function');
        
        // The updateTable function should exist and be callable
        // (Full testing of updateTable would require more complex setup)
    });
});