/**
 * @jest-environment jsdom
 */

import { Chart } from 'chart.js';
import gsmViz from '../../src/main.js';
import facetPoints from '../../src/facetPoints.js';

global.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
};

const data = [
    {
        phase: 'Baseline',
        id: 'A',
        x: 1,
        y: 10,
        group: 'Control',
        status: 'Circle',
    },
    {
        phase: 'Baseline',
        id: 'B',
        x: 4,
        y: 20,
        group: 'Treatment',
        status: 'Triangle',
    },
    {
        phase: 'Week 4',
        id: 'A',
        x: 2,
        y: 12,
        group: 'Control',
        status: 'Circle',
    },
    {
        phase: 'Week 4',
        id: 'C',
        x: 8,
        y: 30,
        group: 'Other',
        status: 'Rect',
    },
];

const baseSpec = {
    mapping: {
        x: 'x',
        y: 'y',
        key: 'id',
        color: 'group',
        shape: 'status',
    },
    facet: { field: 'phase' },
};

function getPoints(chart) {
    return chart.data.datasets
        .filter((dataset) => !dataset._annotation)
        .flatMap((dataset) => dataset.data);
}

function findPoint(chart, key) {
    for (
        let datasetIndex = 0;
        datasetIndex < chart.data.datasets.length;
        datasetIndex += 1
    ) {
        const index = chart.data.datasets[datasetIndex].data.findIndex(
            (point) => point._key === key
        );
        if (index !== -1) return { datasetIndex, index };
    }
    return undefined;
}

describe('facetPoints', () => {
    let parent;

    beforeEach(() => {
        parent = document.createElement('div');
        document.body.appendChild(parent);
    });

    afterEach(() => {
        parent.querySelectorAll('canvas').forEach((canvas) => {
            Chart.getChart(canvas)?.destroy();
        });
        parent.remove();
        jest.restoreAllMocks();
    });

    test('is exported from the main gsmViz namespace', () => {
        expect(gsmViz.facetPoints).toBe(facetPoints);
    });

    test('renders one complete points chart per first-seen facet', () => {
        const result = facetPoints(parent, data, baseSpec);

        expect(result).toEqual({
            charts: expect.any(Array),
            container: expect.any(HTMLElement),
        });
        expect(result.charts).toHaveLength(2);
        expect(result.container).toBe(parent.querySelector('.gsm-facet-grid'));
        expect(
            [...parent.querySelectorAll('.gsm-facet-label')].map(
                ({ textContent }) => textContent
            )
        ).toEqual(['Baseline', 'Week 4']);
        expect(getPoints(result.charts[0]).map(({ _key }) => _key)).toEqual([
            'A',
            'B',
        ]);
        expect(getPoints(result.charts[1]).map(({ _key }) => _key)).toEqual([
            'A',
            'C',
        ]);
        result.charts.forEach((chart) => {
            expect(chart.config.type).toBe('scatter');
            expect(chart.helpers).toEqual(
                expect.objectContaining({
                    selectPoint: expect.any(Function),
                    updateData: expect.any(Function),
                    exportImage: expect.any(Function),
                })
            );
        });
        expect(result).not.toHaveProperty('helpers');
    });

    test('renders ordered requested empty facets with configured layout', () => {
        const { charts, container } = facetPoints(parent, data, {
            ...baseSpec,
            facet: {
                field: 'phase',
                order: ['Week 4', 'Not observed', 'Baseline'],
                nCol: 2,
                chartHeight: 260,
                label: {
                    position: 'bottom',
                    font: 'bold 13px sans-serif',
                },
            },
        });

        expect(charts).toHaveLength(3);
        expect(container.style.gridTemplateColumns).toBe('repeat(2, 1fr)');
        expect(
            [...container.querySelectorAll('.gsm-facet-label')].map(
                ({ textContent }) => textContent
            )
        ).toEqual(['Week 4', 'Not observed', 'Baseline']);
        expect(getPoints(charts[1])).toEqual([]);
        expect(charts[1].canvas.getAttribute('aria-label')).toContain(
            'No data available.'
        );
        container.querySelectorAll('.gsm-facet-cell').forEach((cell) => {
            expect(
                cell.firstElementChild.classList.contains('gsm-facet-canvas')
            ).toBe(true);
            expect(cell.firstElementChild.style.height).toBe('260px');
            expect(cell.lastElementChild.style.font).not.toBe('');
        });
    });

    test('applies default fixed x/y domains including annotations', () => {
        const { charts } = facetPoints(parent, data, {
            ...baseSpec,
            annotations: {
                referenceLines: [{ axis: 'y', value: 40 }],
                lines: [
                    {
                        data: [
                            { x: -5, y: 5 },
                            { x: 10, y: 35 },
                        ],
                        mapping: { x: 'x', y: 'y' },
                    },
                ],
            },
        });

        charts.forEach((chart) => {
            expect(chart.options.scales.x.min).toBe(-5);
            expect(chart.options.scales.x.max).toBe(10);
            expect(chart.options.scales.y.min).toBe(5);
            expect(chart.options.scales.y.max).toBe(40);
        });
    });

    test('lets x and y scales be free independently', () => {
        const { charts } = facetPoints(parent, data, {
            ...baseSpec,
            facet: {
                field: 'phase',
                scales: {
                    x: { free: true },
                    y: { free: false },
                },
            },
        });

        charts.forEach((chart) => {
            expect(chart.config.options.scales.x.min).toBeUndefined();
            expect(chart.config.options.scales.x.max).toBeUndefined();
            expect(chart.options.scales.y.min).toBe(10);
            expect(chart.options.scales.y.max).toBe(30);
        });
        expect(charts[0].scales.x.max).not.toBe(charts[1].scales.x.max);
    });

    test('uses a global composite style domain in every legend', () => {
        const { charts } = facetPoints(parent, data, baseSpec);
        const identities = (chart) =>
            chart.data.datasets
                .filter((dataset) => !dataset._annotation)
                .map((dataset) => [
                    dataset._color,
                    dataset._shape,
                    dataset.backgroundColor,
                    dataset.pointStyle,
                ]);

        expect(identities(charts[0])).toEqual(identities(charts[1]));
        expect(identities(charts[0])).toHaveLength(3);
        expect(
            charts[0].data.datasets.filter((dataset) => dataset._facetGhost)
        ).toHaveLength(1);
        expect(
            charts[1].data.datasets.filter((dataset) => dataset._facetGhost)
        ).toHaveLength(1);
    });

    test('synchronizes legend visibility by default', () => {
        const { charts } = facetPoints(parent, data, baseSpec);
        const index = charts[0].data.datasets.findIndex(
            (dataset) =>
                dataset._color === 'Treatment' && dataset._shape === 'Triangle'
        );
        const item = charts[0].legend.legendItems.find(
            ({ datasetIndex }) => datasetIndex === index
        );

        charts[0].options.plugins.legend.onClick.call(
            charts[0].legend,
            {},
            item,
            charts[0].legend
        );

        expect(charts[0].isDatasetVisible(index)).toBe(false);
        expect(charts[1].isDatasetVisible(index)).toBe(false);
    });

    test('can keep legend visibility local or hide every legend', () => {
        const local = facetPoints(parent, data, {
            ...baseSpec,
            facet: {
                field: 'phase',
                legend: { sync: false },
            },
        });
        const item = local.charts[0].legend.legendItems[0];
        local.charts[0].options.plugins.legend.onClick.call(
            local.charts[0].legend,
            {},
            item,
            local.charts[0].legend
        );

        expect(local.charts[0].isDatasetVisible(item.datasetIndex)).toBe(false);
        expect(local.charts[1].isDatasetVisible(item.datasetIndex)).toBe(true);

        const hidden = facetPoints(parent, data, {
            ...baseSpec,
            facet: {
                field: 'phase',
                legend: { display: false },
            },
        });
        hidden.charts.forEach((chart) => {
            expect(chart.options.plugins.legend.display).toBe(false);
        });
    });

    test('preserves facet legend behavior after local child updates', () => {
        const { charts } = facetPoints(parent, data, baseSpec);
        const identities = (chart) =>
            chart.data.datasets
                .filter((dataset) => !dataset._annotation)
                .map((dataset) => [dataset._color, dataset._shape]);

        charts[0].helpers.updateData(
            charts[0],
            data.filter(({ phase }) => phase === 'Baseline')
        );

        expect(identities(charts[0])).toEqual(identities(charts[1]));
        const treatmentIndex = charts[0].data.datasets.findIndex(
            (dataset) =>
                dataset._color === 'Treatment' && dataset._shape === 'Triangle'
        );
        charts[0].options.plugins.legend.onClick.call(
            charts[0].legend,
            {},
            charts[0].legend.legendItems.find(
                ({ datasetIndex }) => datasetIndex === treatmentIndex
            ),
            charts[0].legend
        );
        expect(charts[0].isDatasetVisible(treatmentIndex)).toBe(false);
        expect(charts[1].isDatasetVisible(treatmentIndex)).toBe(false);

        charts[0].helpers.updateSpec(charts[0], {
            labels: { title: 'Updated facet' },
        });

        expect(identities(charts[0])).toEqual(identities(charts[1]));
        expect(charts[0].isDatasetVisible(treatmentIndex)).toBe(false);
        charts[0].options.plugins.legend.onClick.call(
            charts[0].legend,
            {},
            charts[0].legend.legendItems.find(
                ({ datasetIndex }) => datasetIndex === treatmentIndex
            ),
            charts[0].legend
        );
        expect(charts[0].isDatasetVisible(treatmentIndex)).toBe(true);
        expect(charts[1].isDatasetVisible(treatmentIndex)).toBe(true);
    });

    test('keeps facet legends hidden after local child updates', () => {
        const { charts } = facetPoints(parent, data, {
            ...baseSpec,
            facet: {
                field: 'phase',
                legend: { display: false },
            },
        });

        charts[0].helpers.updateData(
            charts[0],
            data.filter(({ phase }) => phase === 'Baseline')
        );
        charts[0].helpers.updateSpec(charts[0], {
            labels: { title: 'Updated facet' },
        });

        expect(charts[0].options.plugins.legend.display).toBe(false);
        expect(
            charts[0].data.datasets.filter((dataset) => !dataset._annotation)
        ).toHaveLength(3);
    });

    test('does not introduce legends into ungrouped child updates', () => {
        const ungrouped = data.map(({ phase, id, x, y }) => ({
            phase,
            id,
            x,
            y,
        }));
        const { charts } = facetPoints(parent, ungrouped, {
            mapping: { x: 'x', y: 'y', key: 'id' },
            facet: { field: 'phase' },
        });

        charts[0].helpers.updateData(
            charts[0],
            ungrouped.filter(({ phase }) => phase === 'Baseline')
        );

        expect(charts[0].options.plugins.legend.display).toBe(false);
    });

    test('adds typed facet context to click and hover callbacks', () => {
        const onClick = jest.fn();
        const onHover = jest.fn();
        const { charts } = facetPoints(parent, data, {
            ...baseSpec,
            callbacks: { onClick, onHover },
        });
        const active = findPoint(charts[0], 'A');
        const click = { type: 'click', native: { target: charts[0].canvas } };
        const hover = {
            type: 'mousemove',
            native: { target: charts[0].canvas },
        };

        charts[0].options.onClick(click, [active], charts[0]);
        charts[0].options.onHover(hover, [active], charts[0]);

        expect(onClick).toHaveBeenCalledWith(
            expect.objectContaining({ _key: 'A' }),
            'Baseline',
            click
        );
        expect(onHover).toHaveBeenCalledWith(
            expect.objectContaining({ _key: 'A' }),
            'Baseline',
            hover
        );
    });

    test('synchronizes keyed hover without opening sibling tooltips', () => {
        const { charts } = facetPoints(parent, data, baseSpec);
        const active = findPoint(charts[0], 'A');

        charts[0].options.onHover(
            { type: 'mousemove', native: { target: charts[0].canvas } },
            [active],
            charts[0]
        );

        const siblingActive = charts[1].getActiveElements();
        expect(siblingActive).toHaveLength(1);
        expect(
            charts[1].data.datasets[siblingActive[0].datasetIndex].data[
                siblingActive[0].index
            ]._key
        ).toBe('A');
        expect(charts[1].tooltip.getActiveElements()).toEqual([]);

        charts[0].options.onHover({}, [], charts[0]);
        expect(charts[1].getActiveElements()).toEqual([]);
    });

    test('synchronizes keyed selection and fires onSelect once with facet context', () => {
        const onSelect = jest.fn();
        const { charts } = facetPoints(parent, data, {
            ...baseSpec,
            selection: { enabled: true },
            callbacks: { onSelect },
        });

        charts[0].helpers.selectPoint(charts[0], 'A');

        expect(charts[0].helpers.getSelection(charts[0])).toEqual({
            type: 'point',
            values: ['A'],
        });
        expect(charts[1].helpers.getSelection(charts[1])).toEqual({
            type: 'point',
            values: ['A'],
        });
        expect(onSelect).toHaveBeenCalledWith(
            { type: 'point', values: ['A'] },
            'Baseline',
            undefined
        );
        expect(onSelect).toHaveBeenCalledTimes(1);
    });

    test('reinvocation destroys prior charts and leaves one grid', () => {
        const first = facetPoints(parent, data, baseSpec);
        const destroy = first.charts.map((chart) =>
            jest.spyOn(chart, 'destroy')
        );

        const second = facetPoints(
            parent,
            data.filter(({ phase }) => phase === 'Week 4'),
            baseSpec
        );

        destroy.forEach((spy) => expect(spy).toHaveBeenCalledTimes(1));
        expect(parent.querySelectorAll('.gsm-facet-grid')).toHaveLength(1);
        expect(second.charts).toHaveLength(1);
    });

    test('invalid rerender input leaves the existing grid intact', () => {
        const first = facetPoints(parent, data, baseSpec);
        const grid = first.container;
        const canvas = first.charts[0].canvas;

        expect(() =>
            facetPoints(parent, [{ ...data[0], x: 'invalid' }], baseSpec)
        ).toThrow('data[0].x mapped by spec.mapping.x must be a finite number');
        expect(parent.querySelector('.gsm-facet-grid')).toBe(grid);
        expect(parent.contains(canvas)).toBe(true);
        expect(Chart.getChart(canvas)).toBe(first.charts[0]);
    });

    test('throws a descriptive selector error', () => {
        expect(() => facetPoints('#does-not-exist', data, baseSpec)).toThrow(
            'facetPoints: could not find element matching "#does-not-exist"'
        );
    });
});
