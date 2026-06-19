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

    describe('constant axes (default)', () => {
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
});
