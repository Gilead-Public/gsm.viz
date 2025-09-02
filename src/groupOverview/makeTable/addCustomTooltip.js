import { select } from 'd3';

/**
 * Add custom tooltip functionality that allows interaction (e.g., clicking links).
 * This replaces the native browser tooltip for specific cells.
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
            .style('font-family', '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif');
    }

    // Filter Risk Score cells that need custom tooltips
    const riskScoreCells = cells.filter((d) => d.column.valueKey === 'siteRiskScore' && d.tooltip);

    riskScoreCells
        .on('mouseenter', function(event, d) {
            // Remove the native title attribute to prevent default tooltip
            select(this).attr('title', null);
            
            // Parse the tooltip content to detect links
            const content = d.tooltipContent;
            const lines = content.split('\n');
            
            // Clear tooltip
            tooltip.selectAll('*').remove();
            
            // Add content line by line, converting URLs to clickable links
            lines.forEach(line => {
                const lineElement = tooltip.append('div');
                
                // Check if line contains a URL
                const urlRegex = /(https?:\/\/[^\s]+)/g;
                const matches = line.match(urlRegex);
                
                if (matches) {
                    // Split line by URLs and create text/link elements
                    const parts = line.split(urlRegex);
                    parts.forEach(part => {
                        if (urlRegex.test(part)) {
                            // This is a URL - create a clickable link
                            lineElement.append('a')
                                .attr('href', part)
                                .attr('target', '_blank')
                                .attr('rel', 'noopener noreferrer')
                                .style('color', '#0066cc')
                                .style('text-decoration', 'underline')
                                .text(part)
                                .on('mouseover', function() {
                                    select(this).style('color', '#004499');
                                })
                                .on('mouseout', function() {
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
                .style('left', (mouseX + 10) + 'px')
                .style('top', (mouseY - 10) + 'px')
                .style('display', 'block');
        })
        .on('mouseleave', function() {
            // Add delay before hiding to allow moving to tooltip
            setTimeout(() => {
                if (!tooltip.node().matches(':hover') && !select(this).node().matches(':hover')) {
                    tooltip.style('display', 'none');
                }
            }, 100);
        });

    // Handle tooltip hover to keep it visible
    tooltip
        .on('mouseenter', function() {
            // Keep tooltip visible when hovering over it
            select(this).style('display', 'block');
        })
        .on('mouseleave', function() {
            // Hide tooltip when leaving it
            select(this).style('display', 'none');
        });
}
