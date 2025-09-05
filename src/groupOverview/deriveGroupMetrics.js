import structureGroupMetadata from '../util/structureGroupMetadata.js';
import { ascending } from 'd3';

/**
 * Derive group metrics. TODO: refactor array > map > array
 *
 * @param {Array} _groupMetadata_ - group metadata
 * @param {Array} _results_ - analysis results data with one object per group ID per metric ID
 * @param {Object} config - chart configuration and metadata
 *
 * @returns {Array} group metrics
 */
export default function deriveGroupMetrics(_groupMetadata_, _results_, config) {
    const groupMetadata = structureGroupMetadata(_groupMetadata_, config);

    const missingGroups = [
        ...new Set(
            _results_
                .map((result) => result.GroupID)
                .filter(
                    (GroupID) =>
                        ![...groupMetadata.keys()].find(
                            (group) => group === GroupID
                        )
                )
                .sort(ascending)
        ),
    ];

    missingGroups.forEach((group) => {
        // add missing groups to groupMetadata
        groupMetadata.set(group, { GroupID: group });
    });

    const groups = Array.from(groupMetadata).map(([key, value]) => ({
        GroupLevel: config.GroupLevel,
        GroupID: key,
        ...value,
    }));

    groups.forEach((group) => {
        group.GroupLabel = group.hasOwnProperty(config.groupLabelKey)
            ? `${group.GroupID} (${group[config.groupLabelKey]})`
            : group.GroupID;

        const groupResults = _results_.filter(
            (result) => result.GroupID === group.GroupID
        );

        // count red flags
        group.nRedFlags = groupResults.filter(
            (result) => Math.abs(parseInt(result.Flag)) === 2
        ).length;

        // count amber flags
        group.nAmberFlags = groupResults.filter(
            (result) => Math.abs(parseInt(result.Flag)) === 1
        ).length;

        // count green flags
        group.nGreenFlags = groupResults.filter(
            (result) => Math.abs(parseInt(result.Flag)) === 0
        ).length;

        // pull out siteRiskScore from results - only for Site-level groups
        if (config.GroupLevel === 'Site') {
            const riskScoreResult = groupResults.find(
                (result) => result.MetricID === config.SiteRiskMetric
            );
            
            if (riskScoreResult) {
                group.siteRiskScore = parseFloat(riskScoreResult.Score);
            } else {
                // TESTING OVERRIDE: Add mock site risk score data for testing
                // Generate a mock score between 0-100 based on flag counts
                const totalFlags = group.nRedFlags + group.nAmberFlags + group.nGreenFlags;
                const riskFlags = group.nRedFlags + group.nAmberFlags;
                const mockScore = totalFlags > 0 ? Math.round((riskFlags / totalFlags) * 100) : 50;
                group.siteRiskScore = mockScore;
                console.log(`DEBUG: TESTING - Added mock site risk score ${mockScore} for group ${group.GroupID}`);
            }
        }
    });

    return groups;
}
