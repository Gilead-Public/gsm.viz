import { interpolate } from 'd3-interpolate';

/**
 * Add cells to table.
 *
 * @param {object} bodyRows - The rows of the table body.
 *
 * @returns {object} - The cells of the table.
 */
export default function addCells(bodyRows) {
    const cells = bodyRows
        .selectAll('td')
        .data(
            (d) => d,
            // Define a unique key for each cell.
            (d) => {
                const id =
                    d.column.type === 'metric'
                        ? `${d.GroupID}-${d.column.meta.MetricID}`
                        : `${d.GroupID}-${d.column.valueKey}`;

                return id;
            }
        )
        .join('td')
        .text((d) => (d.text === 'NA' ? '-' : d.text))
        .attr('class', (d) => d.class)
        .classed('group-overview--tooltip', (d) => {
            // Don't apply tooltip class to Risk Score cells (they use custom click tooltips)
            if (d.column.valueKey === 'siteRiskScore') {
                return false;
            }
            return d.tooltip;
        })
        .attr('title', (d) => {
            // Don't add native title attribute for Risk Score cells (they use custom tooltips)
            if (d.column.valueKey === 'siteRiskScore') {
                return null;
            }
            return d.tooltip ? d.tooltipContent : null;
        });

    return cells;
}
