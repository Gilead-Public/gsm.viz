import sortString from './sortString';
import sortNumber from './sortNumber';
import defineGroupTooltip from './defineGroupTooltip';
import defineRiskScoreTooltip from './defineRiskScoreTooltip';

/**
 * Define group-related table columns.
 *
 * @param {Array} groupMetadata - group metadata
 * @param {Object} config - table configuration
 * @param {Array} results - analysis results data (needed for risk score tooltip)
 * @param {Array} metricMetadata - metric metadata (needed for risk score tooltip)
 *
 * @returns {Array} Array of column metadata objects
 */

export default function defineGroupColumns(
    groupMetadata,
    config,
    results = null,
    metricMetadata = null
) {
    let columns = [
        {
            label: 'Group',
            data: groupMetadata,
            filterKey: 'GroupID',
            valueKey: 'GroupLabel',

            headerTooltip: null,
            sort: sortString,
            tooltip: true,
            type: 'group',
            dataType: 'string',
        },
        {
            label: 'Enrolled',
            data: groupMetadata,
            filterKey: 'GroupID',
            valueKey: config.groupParticipantCountKey,

            headerTooltip: null,
            sort: sortNumber,
            tooltip: false,
            type: 'group',
            dataType: 'number',
        },
        {
            label: 'Red Flags',
            data: groupMetadata,
            filterKey: 'GroupID',
            valueKey: 'nRedFlags',

            headerTooltip: null,
            sort: sortNumber,
            tooltip: false,
            type: 'group',
            dataType: 'number',
        },
        {
            label: 'Amber Flags',
            data: groupMetadata,
            filterKey: 'GroupID',
            valueKey: 'nAmberFlags',

            headerTooltip: null,
            sort: sortNumber,
            tooltip: false,
            type: 'group',
            dataType: 'number',
        },
    ];

    columns.forEach((column) => {
        column.defineTooltip = defineGroupTooltip;
    });

    columns = columns.filter((column) =>
        groupMetadata.some((groupMetadatum) =>
            groupMetadatum.hasOwnProperty(column.valueKey)
        )
    );

    // Only add Risk Score column for Site-level data when the site risk score metric exists in the data
    const hasSiteRiskScoreData =
        results &&
        results.some(
            (result) => result.MetricID === config.SiteRiskScoreMetricID
        );

    const shouldAddRiskScoreColumn =
        config.GroupLevel === 'Site' && hasSiteRiskScoreData;

    if (shouldAddRiskScoreColumn) {
        const riskScoreColumn = {
            label: 'Risk Score',
            data: groupMetadata,
            filterKey: 'GroupID',
            valueKey: 'siteRiskScore',

            headerTooltip:
                'Site risk score across all metrics. Score ranges from 0-100.\nClick score for more information.',
            sort: sortNumber,
            tooltip: true,
            type: 'group',
            dataType: 'number',
        };

        // Custom tooltip for Risk Score column that shows amber/red flags and calculation
        if (results) {
            riskScoreColumn.defineTooltip = (col, content, config) =>
                defineRiskScoreTooltip(
                    col,
                    content,
                    config,
                    results,
                    metricMetadata
                );
        } else {
            riskScoreColumn.defineTooltip = defineGroupTooltip;
        }

        columns.push(riskScoreColumn);
    }
    return columns;
}
