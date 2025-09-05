import { select } from 'd3';

/**
 * Add custom tooltip functionality that allows interaction (e.g., clicking links).
 * Uses click events for Risk Score cells to avoid conflicts with row highlighting.
 *
 * @param {object} cells - The cells of the table.
 *
 * @returns {void}
 */
export default function addCustomTooltip(cells) {
    // Create tooltip container if it doesn't exist
    let tooltip = select('body').select('.custom-tooltip');
    if (tooltip.empty()) {
        tooltip = select('body')
            .append('div')
            .attr('class', 'custom-tooltip')
            .style('position', 'absolute')
            .style('background', '#ffffff')
            .style('color', '#000')
            .style('padding', '8px 10px')
            .style('border', '1px solid #ccc')
            .style('border-radius', '3px')
            .style('font-size', '11px')
            .style('line-height', '1.3')
            .style('white-space', 'pre-line')
            .style('max-width', '350px')
            .style('box-shadow', '0 2px 4px rgba(0,0,0,0.2)')
            .style('z-index', '1000')
            .style('pointer-events', 'auto') // Allow interaction with tooltip
            .style('display', 'none')
            .style(
                'font-family',
                '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
            );
    }

    // Filter Risk Score cells that need custom tooltips
    const riskScoreCells = cells.filter(
        (d) => d.column.valueKey === 'siteRiskScore' && d.tooltip
    );

    // Add click event to show/hide tooltip for Risk Score cells
    riskScoreCells
        .style('cursor', 'pointer') // Indicate clickable
        .classed('group-overview--tooltip', false) // Explicitly remove conflicting class
        .on('click.risk-score-tooltip', function (event, d) {
            // Stop event propagation to prevent other click handlers
            event.stopPropagation();
            event.preventDefault();

            // Toggle tooltip visibility
            const isVisible = tooltip.style('display') === 'block';

            if (isVisible) {
                tooltip.style('display', 'none');
                return;
            }

            // Parse the tooltip content to detect links
            const content = d.tooltipContent;
            if (!content) {
                return;
            }

            const lines = content.split('\n');

            // Clear tooltip
            tooltip.selectAll('*').remove();

            // Add content line by line, converting URLs to clickable links
            lines.forEach((line) => {
                const lineElement = tooltip.append('div');

                // Check if line contains a URL
                const urlRegex = /(https?:\/\/[^\s]+)/g;
                const matches = line.match(urlRegex);

                if (matches) {
                    // Split line by URLs and create text/link elements
                    const parts = line.split(urlRegex);
                    parts.forEach((part) => {
                        if (urlRegex.test(part)) {
                            // This is a URL - create a clickable link
                            lineElement
                                .append('a')
                                .attr('href', part)
                                .attr('target', '_blank')
                                .attr('rel', 'noopener noreferrer')
                                .style('color', '#0066cc')
                                .style('text-decoration', 'underline')
                                .text(part)
                                .on('mouseover', function () {
                                    select(this).style('color', '#004499');
                                })
                                .on('mouseout', function () {
                                    select(this).style('color', '#0066cc');
                                });
                        } else if (part) {
                            // This is regular text
                            lineElement.append('span').text(part);
                        }
                    });
                } else {
                    // No URLs, just add as text
                    lineElement.text(line);
                }
            });

            // Position and show tooltip
            const [mouseX, mouseY] = [event.pageX, event.pageY];
            tooltip
                .style('left', mouseX + 10 + 'px')
                .style('top', mouseY - 10 + 'px')
                .style('display', 'block');
        });

    // Handle clicking outside to close tooltip
    select('body').on('click.custom-tooltip', function (event) {
        // Check if click is outside both the tooltip and risk score cells
        const clickedElement = event.target;
        const isTooltipClick =
            tooltip.node() && tooltip.node().contains(clickedElement);
        const isRiskScoreClick = riskScoreCells
            .nodes()
            .some((node) => node.contains(clickedElement));

        if (!isTooltipClick && !isRiskScoreClick) {
            tooltip.style('display', 'none');
        }
    });
}
