import { group } from 'd3';

import sortByFlags from './structureData/sortByFlags';

/**
 * Structure the data for the table.
 *
 * @param {Array} results - analysis results data with one object per group ID per metric ID
 * @param {Array} columns - column metadata
 * @param {Array} groupMetadata - group metadata
 * @param {Object} config - table configuration
 *
 * @returns {Array} Array of objects, one per group, with one object per column
 */
export default function structureData(results, columns, groupMetadata, config) {
    const lookup = group(
        results,
        (d) => d.GroupID,
        (d) => d.MetricID
    );

    const rowData = Array.from(lookup, ([key, value]) => {
        const group = groupMetadata.find((group) => group.GroupID === key);

        const rowDatum = columns.map((column) => {
            const datum = {
                ...(column.getDatum(key) || {}),
                column: column,
                group: group,
                GroupID: key,
            };

            // TODO: get rid of value or text
            datum.value = datum[column.valueKey];
            datum.text = datum.value;

            // Format siteRiskScore to 3 decimal places
            if (column.valueKey === 'siteRiskScore' && datum.value !== null && !isNaN(datum.value)) {
                datum.text = parseFloat(datum.value).toFixed(3);
            }

            datum.sortValue =
                column.type === 'metric'
                    ? Math.abs(parseFloat(datum.value))
                    : datum.value;
            datum.class = [
                `group-overview--${column.type}`,
                `group-overview--${column.dataType}`,
                `group-overview--${column.valueKey}`,
            ].join(' ');
            datum.tooltip = column.tooltip;
            datum.tooltipContent = column.defineTooltip(column, datum, config);

            return datum;
        });

        rowDatum.key = key;

        return rowDatum;
    });

    // Sort by # Red Flags, then # Amber Flags, #Green Flags, then Investigator ID;
    // this is the default sort order for the table.
    const sortedData = sortByFlags(rowData);

    return sortedData;
}
