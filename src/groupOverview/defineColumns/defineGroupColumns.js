import sortString from './sortString';
import sortNumber from './sortNumber';
import defineGroupTooltip from './defineGroupTooltip';

/**
 * Define group-related table columns.
 *
 * @param {Array} groupMetadata - group metadata
 * @param {Object} config - table configuration
 *
 * @returns {Array} Array of column metadata objects
 */

export default function defineGroupColumns(groupMetadata, config) {
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
        {
            label: 'Risk Score',
            data: groupMetadata,
            filterKey: 'GroupID',
            valueKey: 'siteRiskScore',

            headerTooltip: 'Site risk score across all metrics',
            sort: sortNumber,
            tooltip: true,
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

    return columns;
}
