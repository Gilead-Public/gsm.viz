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

        // pull out siteRiskScore from results
        group.siteRiskScore = groupResults
            .filter((result) => result.MetricID === config.SiteRiskMetric)
            .map((result) => parseFloat(result.Score));
    });

    return groups;
}
