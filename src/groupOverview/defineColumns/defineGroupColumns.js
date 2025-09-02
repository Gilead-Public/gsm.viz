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

export default function defineGroupColumns(groupMetadata, config, results = null, metricMetadata = null) {
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

    // Only add Risk Score column for Site-level data
    if (config.GroupLevel === 'Site') {
        columns.push({
            label: 'Risk Score',
            data: groupMetadata,
            filterKey: 'GroupID',
            valueKey: 'siteRiskScore',

            headerTooltip: 'Site risk score across all metrics. Score ranges from 0-100.',
            sort: sortNumber,
            tooltip: true,
            type: 'group',
            dataType: 'number',
        });
    }

    columns.forEach((column) => {
        if (column.valueKey === 'siteRiskScore' && results) {
            // Custom tooltip for Risk Score column that shows amber/red flags and calculation
            column.defineTooltip = (col, content, config) => 
                defineRiskScoreTooltip(col, content, config, results, metricMetadata);
        } else {
            column.defineTooltip = defineGroupTooltip;
        }
    });

    columns = columns.filter((column) =>
        groupMetadata.some((groupMetadatum) =>
            groupMetadatum.hasOwnProperty(column.valueKey)
        )
    );

    return columns;
}
