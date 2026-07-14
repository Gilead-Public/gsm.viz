/**
 * @jest-environment jsdom
 */

import renderGrid from '../../src/facetBars/renderGrid.js';

const makeMergedSpec = (overrides = {}) => ({
    facet: {
        nCol: undefined,
        label: { position: 'top', font: undefined },
        legend: { display: true, chart: 'first' },
        scales: { x: { free: false }, y: { free: false } },
    },
    ...overrides,
});

describe('facetBars/renderGrid', () => {
    let parent;

    beforeEach(() => {
        parent = document.createElement('div');
        document.body.appendChild(parent);
    });

    afterEach(() => {
        parent.remove();
    });

    test('returns an object with containers Map and grid Element', () => {
        const result = renderGrid(parent, ['US', 'EU'], makeMergedSpec());
        expect(result.containers).toBeInstanceOf(Map);
        expect(result.grid).toBeInstanceOf(HTMLElement);
    });

    test('appends the grid element to the parent', () => {
        renderGrid(parent, ['US', 'EU'], makeMergedSpec());
        expect(parent.querySelector('.gsm-facet-grid')).not.toBeNull();
    });

    test('creates one cell per facet value', () => {
        renderGrid(parent, ['US', 'EU', 'APAC'], makeMergedSpec());
        expect(parent.querySelectorAll('.gsm-facet-cell').length).toBe(3);
    });

    test('creates a canvas container for each facet value', () => {
        const { containers } = renderGrid(
            parent,
            ['US', 'EU'],
            makeMergedSpec()
        );
        expect(containers.size).toBe(2);
        expect(containers.has('US')).toBe(true);
        expect(containers.has('EU')).toBe(true);
    });

    test('each canvas container is inside its cell', () => {
        const { containers } = renderGrid(parent, ['US'], makeMergedSpec());
        const cell = parent.querySelector('.gsm-facet-cell');
        expect(cell.contains(containers.get('US'))).toBe(true);
    });

    test('renders facet label text for each cell', () => {
        renderGrid(parent, ['US', 'EU'], makeMergedSpec());
        const labels = parent.querySelectorAll('.gsm-facet-label');
        const texts = [...labels].map((el) => el.textContent);
        expect(texts).toContain('US');
        expect(texts).toContain('EU');
    });

    describe('label position', () => {
        test('label appears before canvas container when position is top (default)', () => {
            renderGrid(parent, ['US'], makeMergedSpec());
            const cell = parent.querySelector('.gsm-facet-cell');
            const children = [...cell.children];
            const labelIdx = children.findIndex((c) =>
                c.classList.contains('gsm-facet-label')
            );
            const canvasIdx = children.findIndex((c) =>
                c.classList.contains('gsm-facet-canvas')
            );
            expect(labelIdx).toBeLessThan(canvasIdx);
        });

        test('label appears after canvas container when position is bottom', () => {
            renderGrid(
                parent,
                ['US'],
                makeMergedSpec({
                    facet: {
                        ...makeMergedSpec().facet,
                        label: { position: 'bottom' },
                    },
                })
            );
            const cell = parent.querySelector('.gsm-facet-cell');
            const children = [...cell.children];
            const labelIdx = children.findIndex((c) =>
                c.classList.contains('gsm-facet-label')
            );
            const canvasIdx = children.findIndex((c) =>
                c.classList.contains('gsm-facet-canvas')
            );
            expect(labelIdx).toBeGreaterThan(canvasIdx);
        });
    });

    describe('column count (nCol)', () => {
        test('auto-computes nCol as min(facetCount, 3) when not specified', () => {
            const { grid } = renderGrid(
                parent,
                ['A', 'B', 'C', 'D'],
                makeMergedSpec()
            );
            expect(grid.style.gridTemplateColumns).toBe('repeat(3, 1fr)');
        });

        test('uses provided nCol when specified', () => {
            const { grid } = renderGrid(
                parent,
                ['A', 'B', 'C', 'D'],
                makeMergedSpec({
                    facet: { ...makeMergedSpec().facet, nCol: 2 },
                })
            );
            expect(grid.style.gridTemplateColumns).toBe('repeat(2, 1fr)');
        });

        test('nCol=1 for a single facet', () => {
            const { grid } = renderGrid(parent, ['US'], makeMergedSpec());
            expect(grid.style.gridTemplateColumns).toBe('repeat(1, 1fr)');
        });
    });

    test('removes existing grid before re-rendering', () => {
        renderGrid(parent, ['US'], makeMergedSpec());
        renderGrid(parent, ['US', 'EU'], makeMergedSpec());
        expect(parent.querySelectorAll('.gsm-facet-grid').length).toBe(1);
        expect(parent.querySelectorAll('.gsm-facet-cell').length).toBe(2);
    });

    describe('chartHeight', () => {
        test('sets height on each canvas container when facet.chartHeight is specified', () => {
            const { containers } = renderGrid(
                parent,
                ['US', 'EU'],
                makeMergedSpec({
                    facet: { ...makeMergedSpec().facet, chartHeight: 300 },
                })
            );
            for (const container of containers.values()) {
                expect(container.style.height).toBe('300px');
            }
        });

        test('does not set height on canvas containers when facet.chartHeight is not specified', () => {
            const { containers } = renderGrid(
                parent,
                ['US', 'EU'],
                makeMergedSpec()
            );
            for (const container of containers.values()) {
                expect(container.style.height).toBe('');
            }
        });
    });

    test('sets custom font style on label when specified', () => {
        renderGrid(
            parent,
            ['US'],
            makeMergedSpec({
                facet: {
                    ...makeMergedSpec().facet,
                    label: { position: 'top', font: 'bold 14px sans-serif' },
                },
            })
        );
        const label = parent.querySelector('.gsm-facet-label');
        // jsdom re-serialises font shorthand differently; just verify font was set
        expect(label.style.font).not.toBe('');
    });
});
