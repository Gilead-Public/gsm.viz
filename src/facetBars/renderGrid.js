import { Chart } from 'chart.js';

/**
 * Create a CSS grid layout inside a parent element, with one cell per facet
 * value. Each cell contains a label and a canvas container div.
 *
 * Any previously rendered `.gsm-facet-grid` is removed after destroying its
 * Chart.js instances to avoid memory leaks.
 *
 * @param {Element}  parentElement - DOM element in which to build the grid
 * @param {string[]} facetValues   - ordered array of facet value strings
 * @param {Object}   mergedSpec    - merged facetBars spec
 * @returns {{ containers: Map<string, Element>, grid: Element }}
 */
export default function renderGrid(parentElement, facetValues, mergedSpec) {
    // Destroy existing Chart.js instances before removing the old grid DOM to
    // prevent memory leaks (Chart.js holds internal state on canvas elements).
    const existing = parentElement.querySelector('.gsm-facet-grid');
    if (existing) {
        existing.querySelectorAll('canvas').forEach((canvas) => {
            const chart = Chart.getChart(canvas);
            if (chart) chart.destroy();
        });
        existing.remove();
    }

    const { facet } = mergedSpec;
    const nCol = facet.nCol ?? Math.min(facetValues.length, 3);
    const labelPosition = facet.label?.position ?? 'top';

    const grid = document.createElement('div');
    grid.className = 'gsm-facet-grid';
    grid.style.display = 'grid';
    grid.style.gridTemplateColumns = `repeat(${nCol}, 1fr)`;
    grid.style.gap = '8px';

    const containers = new Map();

    for (const facetValue of facetValues) {
        const cell = document.createElement('div');
        cell.className = 'gsm-facet-cell';

        const label = document.createElement('div');
        label.className = 'gsm-facet-label';
        label.textContent = String(facetValue);
        if (facet.label?.font) {
            label.style.font = facet.label.font;
        }

        const canvasContainer = document.createElement('div');
        canvasContainer.className = 'gsm-facet-canvas';

        if (labelPosition === 'bottom') {
            cell.appendChild(canvasContainer);
            cell.appendChild(label);
        } else {
            cell.appendChild(label);
            cell.appendChild(canvasContainer);
        }

        grid.appendChild(cell);
        containers.set(String(facetValue), canvasContainer);
    }

    parentElement.appendChild(grid);

    return { containers, grid };
}
