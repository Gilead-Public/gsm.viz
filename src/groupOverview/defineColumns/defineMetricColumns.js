import sortString from './sortString';
import sortNumber from './sortNumber';
import defineMetricTooltip from './defineMetricTooltip';

/**
 * Define metric-related table columns.
 *
 * @param {Array} metricMetadata - metric metadata
 * @param {Array} results - analysis results data with one object per group ID per metric ID
 * @param {Object} config - table configuration
 *
 * @returns {Array} Array of column metadata objects
 */

export default function defineMetricColumns(metricMetadata, results, config) {
    const metricColumns = metricMetadata.map((metric) => {
        const column = {
            label: metric.Abbreviation,
            data: results.filter((d) => d.MetricID === metric.MetricID),
            filterKey: 'GroupID',
            valueKey: 'Flag',

            headerTooltip: metric.Metric,
            sort: sortNumber,
            tooltip: true,
            defineTooltip: defineMetricTooltip,
            type: 'metric',
            dataType: 'number',

            meta: {
                ...metric,
                ...{
                    resultTooltipKeys: config.setResultTooltipKeys(metric),
                },
            },
        };

        return column;
    });

    return metricColumns;
}
