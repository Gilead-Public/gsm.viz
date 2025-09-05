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
        .classed('group-overview--tooltip', (d) => d.tooltip)
        .attr('title', (d) => (d.tooltip ? d.tooltipContent : null));

    return cells;
}
