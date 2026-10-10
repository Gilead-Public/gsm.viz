import { Chart } from 'chart.js';
import { formatFacetValue } from './splitData.js';

function removeExistingGrids(parentElement) {
    [...parentElement.children]
        .filter((element) => element.classList.contains('gsm-facet-grid'))
        .forEach((grid) => {
            grid.querySelectorAll('canvas').forEach((canvas) => {
                Chart.getChart(canvas)?.destroy();
            });
            grid.remove();
        });
}

/**
 * Replace a prior facet grid with ordered point-chart containers.
 *
 * @param {Element} parentElement - Grid host.
 * @param {Array} facetValues - Typed values in display order.
 * @param {Object} spec - Merged facet points spec.
 * @returns {{containers: Map, grid: Element}} New containers and grid.
 */
export default function renderGrid(parentElement, facetValues, spec) {
    removeExistingGrids(parentElement);

    const nCol =
        spec.facet.nCol ?? Math.max(1, Math.min(facetValues.length, 3));
    const grid = document.createElement('div');
    grid.className = 'gsm-facet-grid';
    grid.style.display = 'grid';
    grid.style.gridTemplateColumns = `repeat(${nCol}, 1fr)`;
    grid.style.gap = '8px';

    const containers = new Map();
    facetValues.forEach((facetValue) => {
        const cell = document.createElement('div');
        cell.className = 'gsm-facet-cell';

        const label = document.createElement('div');
        label.className = 'gsm-facet-label';
        label.textContent = formatFacetValue(facetValue);
        if (spec.facet.label.font) {
            label.style.font = spec.facet.label.font;
        }

        const container = document.createElement('div');
        container.className = 'gsm-facet-canvas';
        if (spec.facet.chartHeight !== undefined) {
            container.style.height = `${spec.facet.chartHeight}px`;
        }

        if (spec.facet.label.position === 'bottom') {
            cell.append(container, label);
        } else {
            cell.append(label, container);
        }
        grid.appendChild(cell);
        containers.set(facetValue, container);
    });

    parentElement.appendChild(grid);
    return { containers, grid };
}
