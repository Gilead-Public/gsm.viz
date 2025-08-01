import defineGroupColumns from './defineColumns/defineGroupColumns.js';
import defineMetricColumns from './defineColumns/defineMetricColumns.js';
import defineGroupTooltip from './defineColumns/defineGroupTooltip.js';
import defineMetricTooltip from './defineColumns/defineMetricTooltip.js';

/**
 * Define column metadata for group overview table. Column metadata includes the following properties:
 * - column label (label)
 * - column data (data)
 * - column key (valueKey)
 * - column sort (sort)
 * - column sort state (sortState)
 *
 * @param {Array} groupMetadata - group metadata
 * @param {Array} metricMetadata - metric metadata
 * @param {Array} results - metric results
 * @param {Object} config - table configuration and metadata
 *
 * @returns {Array} columns
 */
export default function defineColumns(
    groupMetadata,
    metricMetadata,
    results,
    config
) {
    const groupColumns = defineGroupColumns(groupMetadata, config, results, metricMetadata);
    const metricColumns = defineMetricColumns(metricMetadata, results, config);
    const columns = [...groupColumns, ...metricColumns];

    columns.forEach((column, i) => {
        column.getDatum = (key) =>
            column.data.find((d) => d[column.filterKey] === key);
        column.index = i;
        column.sortState = column.dataType === 'string' ? 0 : 1;
        column.activeSort = false;
    });

    return columns;
}
