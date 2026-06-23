/**
 * @jest-environment jsdom
 */

import facetBars from '../../src/facetBars.js';

global.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
};

const data = [
    { region: 'US', site: 'A', value: 10, group: 'X' },
    { region: 'US', site: 'B', value: 20, group: 'X' },
    { region: 'US', site: 'A', value: 5, group: 'Y' },
    { region: 'EU', site: 'A', value: 8, group: 'X' },
    { region: 'EU', site: 'C', value: 15, group: 'X' },
    { region: 'EU', site: 'C', value: 3, group: 'Y' },
    { region: 'APAC', site: 'B', value: 12, group: 'X' },
];

const baseSpec = {
    mapping: { x: 'site', y: 'value', fill: 'group' },
    facet: { field: 'region' },
};

describe('facetBars integration', () => {
    let container;

    beforeEach(() => {
        container = document.createElement('div');
        document.body.appendChild(container);
    });

    afterEach(() => {
        container.remove();
    });

    test('returns charts array and container element', () => {
        const result = facetBars(container, data, baseSpec);
        expect(Array.isArray(result.charts)).toBe(true);
        expect(result.container).toBeInstanceOf(HTMLElement);
    });

    test('creates one chart per unique facet value', () => {
        const { charts } = facetBars(container, data, baseSpec);
        // 3 unique regions: US, EU, APAC
        expect(charts).toHaveLength(3);
    });

    test('each chart is a Chart.js-like instance', () => {
        const { charts } = facetBars(container, data, baseSpec);
        charts.forEach((chart) => {
            expect(chart).toHaveProperty('data');
            expect(chart).toHaveProperty('options');
        });
    });

    test('grid container is appended to the parent element', () => {
        facetBars(container, data, baseSpec);
        expect(container.querySelector('.gsm-facet-grid')).not.toBeNull();
    });

    test('creates one .gsm-facet-cell per facet', () => {
        facetBars(container, data, baseSpec);
        expect(container.querySelectorAll('.gsm-facet-cell').length).toBe(3);
    });

    test('respects explicit facet.order', () => {
        const { charts } = facetBars(container, data, {
            ...baseSpec,
            facet: { field: 'region', order: ['APAC', 'EU', 'US'] },
        });
        // Chart labels come from the facet data — verify 3 charts are created in order
        expect(charts).toHaveLength(3);
        const cells = container.querySelectorAll('.gsm-facet-label');
        expect(cells[0].textContent).toBe('APAC');
        expect(cells[1].textContent).toBe('EU');
        expect(cells[2].textContent).toBe('US');
    });

    describe('constant x-axis domain (facet.scales.x.free: false, default)', () => {
        test('all charts have the same data.labels (global category union)', () => {
            const { charts } = facetBars(container, data, baseSpec);
            // Global union of US(A,B), EU(A,C), APAC(B) → A, B, C
            const allLabels = charts.map((c) => c.data.labels);
            allLabels.forEach((labels) => {
                expect(labels).toEqual(['A', 'B', 'C']);
            });
        });

        test('category axis min/max are pinned to the full global domain', () => {
            const { charts } = facetBars(container, data, baseSpec);
            // Global union = ['A','B','C'] — 3 entries, indices 0–2
            // Without pinning, Chart.js trims the visible axis to each facet's
            // data range, making "constant" and "free" look identical.
            charts.forEach((c) => {
                expect(c.options.scales.x.min).toBe(0);
                expect(c.options.scales.x.max).toBe(2);
            });
        });

        test('horizontal orientation pins category axis (y) min/max', () => {
            const { charts } = facetBars(container, data, {
                ...baseSpec,
                orientation: 'horizontal',
            });
            // Horizontal bars: category axis is y (not x)
            charts.forEach((c) => {
                expect(c.options.scales.y.min).toBe(0);
                expect(c.options.scales.y.max).toBe(2);
            });
        });

        test('a facet missing a category still includes it in its labels', () => {
            const { charts } = facetBars(container, data, baseSpec);
            // APAC only has 'B' in data, but global set is A, B, C
            // chart order: US(0), EU(1), APAC(2)
            const apacChart = charts[2];
            expect(apacChart.data.labels).toContain('A');
            expect(apacChart.data.labels).toContain('C');
        });

        test('respects explicit scales.x.order as the global domain', () => {
            const { charts } = facetBars(container, data, {
                ...baseSpec,
                scales: { x: { order: ['C', 'B', 'A'] } },
            });
            charts.forEach((c) => {
                expect(c.data.labels).toEqual(['C', 'B', 'A']);
            });
        });

        test('function order: global union is injected when x.free is false', () => {
            // US has A,B; EU has A,C; APAC has B — per-facet function sorts descending by value
            const { charts } = facetBars(container, data, {
                ...baseSpec,
                scales: {
                    x: {
                        order: (_facetValue, facetData) =>
                            [...new Set(facetData.map((d) => d.site))].sort(
                                (a, b) => b.localeCompare(a) // Z→A
                            ),
                    },
                },
            });
            // Each per-facet result: US→[B,A], EU→[C,A], APAC→[B]
            // Global union in first-seen order: B, A, C
            charts.forEach((c) => {
                expect(c.data.labels).toEqual(['B', 'A', 'C']);
            });
        });

        test('function order: facets with disjoint categories all get the full global label set', () => {
            // Simulate filtered data: US has only A, EU has only C (disjoint after filtering)
            const filteredData = [
                { region: 'US', site: 'A', value: 10, group: 'X' },
                { region: 'EU', site: 'C', value: 15, group: 'X' },
            ];
            const { charts } = facetBars(container, filteredData, {
                mapping: { x: 'site', y: 'value' },
                facet: { field: 'region' },
                scales: {
                    x: {
                        order: (_facetValue, facetData) =>
                            facetData.map((d) => d.site),
                    },
                },
            });
            // globalCategories = union(['A'], ['C']) = ['A', 'C']
            // Both charts must have labels = ['A', 'C'] and axis pinned to 0–1
            // so that the empty position is visible (not trimmed by Chart.js)
            charts.forEach((c) => {
                expect(c.data.labels).toContain('A');
                expect(c.data.labels).toContain('C');
                expect(c.data.labels).toHaveLength(2);
                expect(c.options.scales.x.min).toBe(0);
                expect(c.options.scales.x.max).toBe(1);
            });
        });
    });

    describe('free x-axis domain (facet.scales.x.free: true)', () => {
        test('each chart has only its own data categories', () => {
            const { charts } = facetBars(container, data, {
                ...baseSpec,
                facet: { field: 'region', scales: { x: { free: true } } },
            });
            // US: A, B; EU: A, C; APAC: B
            expect(charts[0].data.labels).toEqual(['A', 'B']); // US
            expect(charts[1].data.labels).toEqual(['A', 'C']); // EU
            expect(charts[2].data.labels).toEqual(['B']); // APAC
        });

        test('charts with x.free:true do NOT all share the same labels', () => {
            const { charts } = facetBars(container, data, {
                ...baseSpec,
                facet: { field: 'region', scales: { x: { free: true } } },
            });
            const labelSets = charts.map((c) => c.data.labels.join(','));
            expect(new Set(labelSets).size).toBeGreaterThan(1);
        });

        test('x.free:true does not pin category axis min/max', () => {
            const { charts } = facetBars(container, data, {
                ...baseSpec,
                facet: { field: 'region', scales: { x: { free: true } } },
            });
            // With free domain, no explicit min/max should be set on the axis
            charts.forEach((c) => {
                expect(c.options.scales.x.min).toBeUndefined();
                expect(c.options.scales.x.max).toBeUndefined();
            });
        });
    });

    describe('constant value-axis (default)', () => {
        test('all charts share the same value axis max', () => {
            const { charts } = facetBars(container, data, baseSpec);
            const maxValues = charts.map((c) => c.options.scales.y.max);
            expect(new Set(maxValues).size).toBe(1);
        });

        test('free y axis: charts have different (auto) scale maxes', () => {
            const { charts } = facetBars(container, data, {
                ...baseSpec,
                facet: { field: 'region', scales: { y: { free: true } } },
            });
            // When free, charts should NOT have an explicit max set
            charts.forEach((c) => {
                expect(c.options.scales.y.max).toBeUndefined();
            });
        });
    });

    describe('legend control', () => {
        test('legend shown on first chart by default', () => {
            const { charts } = facetBars(container, data, baseSpec);
            expect(charts[0].options.plugins.legend.display).toBe(true);
            expect(charts[1].options.plugins.legend.display).toBe(false);
            expect(charts[2].options.plugins.legend.display).toBe(false);
        });

        test('legend shown on last chart when facet.legend.chart is "last"', () => {
            const { charts } = facetBars(container, data, {
                ...baseSpec,
                facet: { field: 'region', legend: { chart: 'last' } },
            });
            expect(charts[0].options.plugins.legend.display).toBe(false);
            expect(charts[2].options.plugins.legend.display).toBe(true);
        });

        test('no legend when facet.legend.display is false', () => {
            const { charts } = facetBars(container, data, {
                ...baseSpec,
                facet: { field: 'region', legend: { display: false } },
            });
            charts.forEach((c) => {
                expect(c.options.plugins.legend.display).toBe(false);
            });
        });

        test('legend on specific facet value when chart is a string', () => {
            const { charts } = facetBars(container, data, {
                ...baseSpec,
                facet: { field: 'region', legend: { chart: 'EU' } },
            });
            // EU is the second facet (US=0, EU=1, APAC=2)
            expect(charts[1].options.plugins.legend.display).toBe(true);
            expect(charts[0].options.plugins.legend.display).toBe(false);
            expect(charts[2].options.plugins.legend.display).toBe(false);
        });

        test('injected legend datasets copy styling from a sibling facet', () => {
            // APAC has only group 'X'; making it the legend chart forces an
            // injected empty dataset for 'Y'. That dataset must copy styling
            // from a sibling (US/EU) so the legend swatch renders correctly.
            const { charts } = facetBars(container, data, {
                ...baseSpec,
                facet: { field: 'region', legend: { chart: 'APAC' } },
            });

            const apac = charts[2];
            const injected = apac.data.datasets.find(
                (ds) => String(ds.label) === 'Y'
            );
            expect(injected).toBeDefined();
            expect(injected.data).toEqual([]);
            expect(injected.backgroundColor).toBeDefined();

            // Should match the styling of a sibling that actually has 'Y'.
            const siblingY = charts[0].data.datasets.find(
                (ds) => String(ds.label) === 'Y'
            );
            expect(injected.backgroundColor).toBe(siblingY.backgroundColor);
            expect(injected.borderColor).toBe(siblingY.borderColor);
        });
    });

    describe('linked hover', () => {
        test('each chart has a sync-wrapped onHover', () => {
            const { charts } = facetBars(container, data, baseSpec);
            charts.forEach((c) => {
                expect(typeof c.options.onHover).toBe('function');
            });
        });
    });

    describe('callbacks', () => {
        test('onClick receives (point, facetValue, event)', () => {
            const onClick = jest.fn();
            const { charts } = facetBars(container, data, {
                ...baseSpec,
                callbacks: { onClick },
            });

            // Retrieve sub-spec callback stored in chart data and call it
            const subSpec = charts[0].data._spec_;
            const fakePoint = { x: 'A', y: 10 };
            const fakeEvent = {};
            subSpec.callbacks.onClick(fakePoint, fakeEvent);

            // The first chart corresponds to 'US'
            expect(onClick).toHaveBeenCalledWith(fakePoint, 'US', fakeEvent);
        });
    });

    describe('element selector', () => {
        test('accepts a CSS selector string', () => {
            container.id = 'facet-test-container';
            expect(() =>
                facetBars('#facet-test-container', data, baseSpec)
            ).not.toThrow();
            container.id = '';
        });

        test('throws for unknown CSS selector', () => {
            expect(() => facetBars('#nonexistent-xyz', data, baseSpec)).toThrow(
                'facetBars: could not find element matching'
            );
        });
    });

    describe('re-render', () => {
        test('replaces grid on re-render into the same container', () => {
            facetBars(container, data, baseSpec);
            facetBars(container, data, baseSpec);
            expect(container.querySelectorAll('.gsm-facet-grid').length).toBe(
                1
            );
        });
    });

    describe('chartHeight', () => {
        test('applies chartHeight to each canvas container after bars() renders', () => {
            facetBars(container, data, {
                ...baseSpec,
                facet: { field: 'region', chartHeight: 300 },
            });
            const canvasContainers =
                container.querySelectorAll('.gsm-facet-canvas');
            canvasContainers.forEach((el) => {
                expect(el.style.height).toBe('300px');
            });
        });

        test('does not set height on canvas containers when chartHeight is omitted', () => {
            facetBars(container, data, baseSpec);
            const canvasContainers =
                container.querySelectorAll('.gsm-facet-canvas');
            canvasContainers.forEach((el) => {
                expect(el.style.height).toBe('');
            });
        });
    });

    describe('dynamicCategoryAxis with facets', () => {
        test('each facet shows only its own categories when dynamicCategoryAxis is true', () => {
            // data: US={A,B}, EU={A,C}, APAC={B}
            const { charts } = facetBars(container, data, {
                ...baseSpec,
                theme: { dynamicCategoryAxis: true },
            });
            // Without the fix, all charts would share ['A','B','C'] (global domain).
            // With the fix, each chart should only contain its own categories.
            expect(charts[0].data.labels).toEqual(
                expect.arrayContaining(['A', 'B'])
            );
            expect(charts[0].data.labels).toHaveLength(2); // US: A, B only

            expect(charts[1].data.labels).toEqual(
                expect.arrayContaining(['A', 'C'])
            );
            expect(charts[1].data.labels).toHaveLength(2); // EU: A, C only

            expect(charts[2].data.labels).toEqual(['B']); // APAC: B only
        });

        test('category axis min/max are NOT pinned when dynamicCategoryAxis is true', () => {
            const { charts } = facetBars(container, data, {
                ...baseSpec,
                theme: { dynamicCategoryAxis: true },
            });
            // With dynamicCategoryAxis, each facet manages its own axis — no global pinning.
            charts.forEach((c) => {
                expect(c.options.scales.x.min).toBeUndefined();
                expect(c.options.scales.x.max).toBeUndefined();
            });
        });

        test('constant x-axis (dynamicCategoryAxis false) still injects global domain', () => {
            // Regression: the existing "constant" behaviour must not be broken.
            const { charts } = facetBars(container, data, baseSpec);
            charts.forEach((c) => {
                expect(c.data.labels).toEqual(['A', 'B', 'C']);
            });
        });
    });
});
