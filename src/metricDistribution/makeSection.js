import { select } from 'd3';

import { MESSAGES, TEXT_COLORS } from './defaults.js';
import { formatCount, formatPercent } from './format.js';

const FORMATTERS = {
    count: formatCount,
    percent: formatPercent,
    percentOfDenominator: formatPercent,
};

const BAR_HEIGHT = '8px';

export function appendMessage(parent, text) {
    return parent
        .append('p')
        .classed('metric-distribution--message', true)
        .style('margin', '0')
        .style('color', TEXT_COLORS.muted)
        .text(text);
}

function appendHeaderRow(table, columns) {
    const row = table.append('thead').append('tr');
    row.append('th').attr('scope', 'col');
    columns.forEach(({ label }) => {
        row.append('th')
            .attr('scope', 'col')
            .style('padding-left', '12px')
            .style('text-align', 'right')
            .style('font-weight', 'normal')
            .style('font-size', '0.85em')
            .style('color', TEXT_COLORS.muted)
            .text(label);
    });
}

function appendBarRow(tbody, bar, columns) {
    const row = tbody
        .append('tr')
        .attr('data-kind', bar.kind)
        .attr('title', bar.tooltip);

    const labelCell = row
        .append('th')
        .attr('scope', 'row')
        .style('width', '100%')
        .style('padding', '3px 0')
        .style('text-align', 'left')
        .style('font-weight', 'normal')
        .style('font-style', bar.kind === 'category' ? null : 'italic');
    labelCell.append('span').text(bar.label);
    labelCell
        .append('div')
        .classed('metric-distribution--track', true)
        .attr('aria-hidden', 'true')
        .style('margin-top', '2px')
        .style('background', '#f0f0f0')
        .style('border-radius', '0 4px 4px 0')
        .append('div')
        .classed('metric-distribution--bar', true)
        .style('width', `${Number((bar.width * 100).toFixed(2))}%`)
        .style('height', BAR_HEIGHT)
        .style('border-radius', '0 4px 4px 0')
        .style('background-color', bar.color);

    columns.forEach(({ value }) => {
        row.append('td')
            .attr('data-value', value)
            .style('padding', '3px 0 3px 12px')
            .style('vertical-align', 'top')
            .style('text-align', 'right')
            .style('white-space', 'nowrap')
            .style('font-variant-numeric', 'tabular-nums')
            .text(FORMATTERS[value](bar[value]));
    });
}

/**
 * Append one section (title, bar table, footnotes) to the widget root.
 *
 * @param {Node} root - widget root element
 * @param {Object} section - section view model from structureSection
 * @returns {Object} D3 selection of the section
 */
export default function makeSection(root, section) {
    const container = select(root)
        .append('div')
        .classed('metric-distribution--section', true)
        .attr('data-source', section.source)
        .attr('data-variable', section.variable);

    container
        .append('div')
        .classed('metric-distribution--title', true)
        .style('font-weight', '600')
        .style('margin-bottom', '4px')
        .text(section.title);

    if (section.empty) {
        appendMessage(container, MESSAGES.emptySection);
        return container;
    }

    const table = container
        .append('table')
        .attr('aria-label', section.title)
        .style('width', '100%')
        .style('border-collapse', 'collapse')
        .style('color', TEXT_COLORS.primary);
    appendHeaderRow(table, section.columns);
    const tbody = table.append('tbody');
    section.bars.forEach((bar) => appendBarRow(tbody, bar, section.columns));

    section.footnotes.forEach((footnote) => {
        container
            .append('p')
            .classed('metric-distribution--footnote', true)
            .style('margin', '4px 0 0')
            .style('font-size', '0.85em')
            .style('color', TEXT_COLORS.muted)
            .text(footnote);
    });

    return container;
}
