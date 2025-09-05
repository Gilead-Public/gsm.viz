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

    // Only add Risk Score column for Site-level data
    // Check that config.GroupLevel is 'Site' AND that the actual metricMetadata contains Site-level data
    // AND that the site risk score data exists in the results
    console.log('DEBUG: Checking Risk Score column conditions');
    console.log('DEBUG: config.GroupLevel:', config.GroupLevel);
    console.log('DEBUG: metricMetadata:', metricMetadata);

    const hasSiteLevelData =
        metricMetadata &&
        metricMetadata.some(
            (metricMetadatum) => metricMetadatum.GroupLevel === 'Site'
        );

    const hasSiteRiskScoreData =
        results &&
        results.some((result) => result.MetricID === config.SiteRiskMetric);

    console.log('DEBUG: hasSiteLevelData:', hasSiteLevelData);
    console.log('DEBUG: hasSiteRiskScoreData:', hasSiteRiskScoreData);
    console.log('DEBUG: config.SiteRiskMetric:', config.SiteRiskMetric);

    // OVERRIDE FOR TESTING: Force Risk Score column to appear when GroupLevel is 'Site'
    const shouldAddRiskScoreColumn = config.GroupLevel === 'Site';
    console.log('DEBUG: TESTING OVERRIDE - shouldAddRiskScoreColumn:', shouldAddRiskScoreColumn);

    if (shouldAddRiskScoreColumn) {
        console.log('DEBUG: Creating Risk Score column');
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

        // TESTING: Add mock tooltip content for testing when no real site risk score data exists
        if (!hasSiteRiskScoreData) {
            riskScoreColumn.defineTooltip = (col, content, config) => {
                return 'TESTING: Mock Risk Score Tooltip\n\nRed Flags:\n• AE - Non-serious AE Reporting Rate: 0.75\n• SAE - SAE Reporting Rate: 0.60\n\nAmber Flags:\n• PD - Non-important PD Rate: 0.45\n\nCalculation: 85 (17 flags / 20 total metrics)\n\nFor more information, see:\n' + (config.SiteRiskScoreURL || 'https://gilead-biostats.github.io/gsm.kri/articles/SiteRiskScore.html');
            };
        }

        columns.push(riskScoreColumn);
        console.log('DEBUG: Risk Score column added to columns');
    } else {
        console.log('DEBUG: Risk Score column NOT added - conditions not met');
    }

    console.log(
        'DEBUG: Final columns:',
        columns.map((c) => c.label)
    );

    return columns;
}
