import { interpolateYlOrRd } from 'd3-scale-chromatic';

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
        .classed('group-overview--tooltip', (d) => d.tooltip)
        .attr('title', (d) => (d.tooltip ? d.tooltipContent : null))
        .style('background-color', (d) => {
            // Apply yellow-to-red color scale for Risk Score column
            if (d.column.valueKey === 'siteRiskScore' && d.value !== null && !isNaN(d.value)) {
                // Normalize the risk score from 0-100 to 0-1 for the color scale
                const normalizedValue = d.value / 100;
                return interpolateYlOrRd(normalizedValue);
            }
            return null; // Use default CSS styling for other columns
        });

    return cells;
}
