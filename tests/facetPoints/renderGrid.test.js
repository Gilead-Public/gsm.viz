/**
 * @jest-environment jsdom
 */

import { Chart } from 'chart.js';
import renderGrid from '../../src/facetPoints/renderGrid.js';

jest.mock('chart.js', () => ({
    Chart: { getChart: jest.fn() },
}));

const makeSpec = (facet = {}) => ({
    facet: {
        nCol: undefined,
        chartHeight: undefined,
        label: { position: 'top', font: undefined },
        ...facet,
    },
});

describe('facetPoints/renderGrid', () => {
    let parent;

    beforeEach(() => {
        parent = document.createElement('div');
        document.body.appendChild(parent);
    });

    afterEach(() => {
        jest.clearAllMocks();
        parent.remove();
    });

    test('creates the established facet grid structure in source order', () => {
        const result = renderGrid(
            parent,
            ['North', 'South', 'West'],
            makeSpec()
        );

        expect(result.grid).toBe(parent.querySelector('.gsm-facet-grid'));
        expect(result.grid.style.display).toBe('grid');
        expect(result.grid.style.gridTemplateColumns).toBe('repeat(3, 1fr)');
        expect(parent.querySelectorAll('.gsm-facet-cell')).toHaveLength(3);
        expect(parent.querySelectorAll('.gsm-facet-canvas')).toHaveLength(3);
        expect(
            [...parent.querySelectorAll('.gsm-facet-label')].map(
                ({ textContent }) => textContent
            )
        ).toEqual(['North', 'South', 'West']);
        expect([...result.containers.keys()]).toEqual([
            'North',
            'South',
            'West',
        ]);
    });

    test('preserves typed container keys and formats missing labels', () => {
        const { containers } = renderGrid(
            parent,
            [1, '1', null, '(Missing)'],
            makeSpec()
        );

        expect([...containers.keys()]).toEqual([1, '1', null, '(Missing)']);
        expect(
            [...parent.querySelectorAll('.gsm-facet-label')].map(
                ({ textContent }) => textContent
            )
        ).toEqual(['1', '1', '(Missing)', '"(Missing)"']);
    });

    test('uses text content rather than parsing facet labels as markup', () => {
        renderGrid(parent, ['<img src=x onerror=alert(1)>'], makeSpec());

        expect(parent.querySelector('.gsm-facet-label').textContent).toBe(
            '<img src=x onerror=alert(1)>'
        );
        expect(parent.querySelector('.gsm-facet-label img')).toBeNull();
    });

    test('honors column count, height, label position, and label font', () => {
        const { grid, containers } = renderGrid(
            parent,
            ['North', 'South'],
            makeSpec({
                nCol: 1,
                chartHeight: 280,
                label: {
                    position: 'bottom',
                    font: 'bold 14px sans-serif',
                },
            })
        );
        const cell = parent.querySelector('.gsm-facet-cell');

        expect(grid.style.gridTemplateColumns).toBe('repeat(1, 1fr)');
        expect(
            [...containers.values()].every((container) => {
                return container.style.height === '280px';
            })
        ).toBe(true);
        expect(
            cell.firstElementChild.classList.contains('gsm-facet-canvas')
        ).toBe(true);
        expect(
            cell.lastElementChild.classList.contains('gsm-facet-label')
        ).toBe(true);
        expect(cell.lastElementChild.style.font).not.toBe('');
    });

    test('uses one valid grid column for an empty facet list', () => {
        const { grid, containers } = renderGrid(parent, [], makeSpec());

        expect(grid.style.gridTemplateColumns).toBe('repeat(1, 1fr)');
        expect(containers.size).toBe(0);
    });

    test('destroys every old chart before replacing only the prior grid', () => {
        const sibling = document.createElement('p');
        parent.appendChild(sibling);
        const first = renderGrid(parent, ['North', 'South'], makeSpec());
        const canvases = [...first.containers.values()].map((container) => {
            const canvas = document.createElement('canvas');
            container.appendChild(canvas);
            return canvas;
        });
        const charts = canvases.map(() => ({ destroy: jest.fn() }));
        Chart.getChart.mockImplementation((canvas) => {
            return charts[canvases.indexOf(canvas)];
        });

        renderGrid(parent, ['West'], makeSpec());

        expect(
            charts.every((chart) => {
                return chart.destroy.mock.calls.length === 1;
            })
        ).toBe(true);
        expect(parent.querySelectorAll('.gsm-facet-grid')).toHaveLength(1);
        expect(parent.querySelectorAll('.gsm-facet-cell')).toHaveLength(1);
        expect(parent.contains(sibling)).toBe(true);
    });
});
