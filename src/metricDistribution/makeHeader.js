import { select } from 'd3';

import { formatCount, formatPercent } from './format.js';

// The metric overview header (metric name, percent, numerator / denominator).
// It is kept to this one file so it can be replaced by the metricOverview
// module (#618) once that module is available.

function describeCounts(metric, result) {
    if (!metric.Numerator || !metric.Denominator) return null;
    return `${metric.Numerator}: ${formatCount(result.Numerator)}; ${
        metric.Denominator
    }: ${formatCount(result.Denominator)}`;
}

/**
 * Append the header to the widget root.
 *
 * @param {Node} root - widget root element
 * @param {Object} data - { metric, result }
 * @returns {Object} D3 selection of the header
 */
export default function makeHeader(root, { metric, result }) {
    const header = select(root)
        .append('div')
        .classed('metric-distribution--header', true)
        .style('display', 'flex')
        .style('flex-wrap', 'wrap')
        .style('align-items', 'baseline')
        .style('gap', '8px');

    header
        .append('span')
        .classed('metric-distribution--name', true)
        .style('font-weight', '600')
        .text(metric.Metric);

    if (result === undefined || result === null) return header;

    header
        .append('strong')
        .classed('metric-distribution--percent', true)
        .style('font-size', '1.5em')
        .text(formatPercent(result.Metric));

    header
        .append('span')
        .classed('metric-distribution--fraction', true)
        .style('font-variant-numeric', 'tabular-nums')
        .attr('title', describeCounts(metric, result))
        .text(
            `${formatCount(result.Numerator)} / ${formatCount(
                result.Denominator
            )}`
        );

    return header;
}
