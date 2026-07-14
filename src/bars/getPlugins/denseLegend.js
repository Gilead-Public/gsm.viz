/**
 * Build dense legend configuration for the bars module.
 *
 * When dense mode is active, legend items display only their color swatch
 * (no text). Hovering a swatch reveals a DOM tooltip with the full label.
 *
 * @returns {Object} Chart.js legend plugin config overrides
 */
export default function denseLegend() {
    return {
        labels: {
            /**
             * Generate legend items with empty text but preserve the full
             * label in a custom _fullLabel property for tooltip display.
             */
            generateLabels(chart) {
                return chart.data.datasets.map((dataset, i) => ({
                    text: '',
                    _fullLabel: dataset.label,
                    datasetIndex: i,
                    fillStyle: dataset.backgroundColor,
                    strokeStyle: dataset.borderColor,
                    lineWidth: 1,
                    hidden: !chart.isDatasetVisible(i),
                }));
            },
        },

        /**
         * Show a positioned tooltip with the full label on legend item hover.
         */
        onHover(event, legendItem, legend) {
            const chart = legend.chart;
            const container = chart.canvas.parentElement;
            if (!container) return;

            // Ensure the container is a positioning context for absolute placement.
            const pos = getComputedStyle(container).position;
            if (pos === 'static') {
                container.style.position = 'relative';
            }

            let tooltip = container.querySelector(
                '[data-dense-legend-tooltip]'
            );

            if (!tooltip) {
                tooltip = document.createElement('div');
                tooltip.setAttribute('data-dense-legend-tooltip', '');
                tooltip.style.position = 'absolute';
                tooltip.style.pointerEvents = 'none';
                tooltip.style.padding = '4px 8px';
                tooltip.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
                tooltip.style.color = '#fff';
                tooltip.style.borderRadius = '4px';
                tooltip.style.fontSize = '12px';
                tooltip.style.whiteSpace = 'nowrap';
                tooltip.style.zIndex = '1000';
                container.appendChild(tooltip);
            }

            tooltip.textContent = legendItem._fullLabel || '';
            tooltip.style.display = '';

            // Position relative to the canvas element within the container.
            const canvasRect = chart.canvas.getBoundingClientRect();
            const containerRect = container.getBoundingClientRect();
            const offsetX = canvasRect.left - containerRect.left;
            const offsetY = canvasRect.top - containerRect.top;

            // Chart.js legend onHover receives the event with x/y relative to
            // the canvas. Use those directly, offset by the canvas position
            // within the container.
            const x = (event.x ?? event.native?.offsetX ?? 0) + offsetX;
            const y = (event.y ?? event.native?.offsetY ?? 0) + offsetY;
            tooltip.style.left = `${x}px`;
            tooltip.style.top = `${y + 16}px`;
        },

        /**
         * Hide the tooltip when the cursor leaves a legend item.
         */
        onLeave(event, legendItem, legend) {
            const chart = legend.chart;
            const container = chart.canvas.parentElement;
            if (!container) return;

            const tooltip = container.querySelector(
                '[data-dense-legend-tooltip]'
            );
            if (tooltip) {
                tooltip.style.display = 'none';
            }
        },
    };
}
