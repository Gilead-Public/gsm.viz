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

    test('renders numeric and string color levels as distinct categories', () => {
        const typedData = [
            { phase: 'Numeric', id: 'number', x: 1, y: 1, color: 1 },
            { phase: 'String', id: 'string', x: 2, y: 2, color: '1' },
        ];
        const spec = {
            mapping: { x: 'x', y: 'y', key: 'id', color: 'color' },
            facet: { field: 'phase' },
        };
        const { charts } = facetPoints(parent, typedData, spec);
        const getColor = (chart, level) =>
            chart.data.datasets.find(
                (dataset) => !dataset._annotation && dataset._color === level
            ).borderColor;

        expect(charts).toHaveLength(2);
        expect(getColor(charts[0], 1)).not.toBe(getColor(charts[1], '1'));
    });

    test('rerenders numeric and string color levels without removing the grid', () => {
        const typedData = [
            { phase: 'Numeric', id: 'number', x: 1, y: 1, color: 1 },
            { phase: 'String', id: 'string', x: 2, y: 2, color: '1' },
        ];
        const spec = {
            mapping: { x: 'x', y: 'y', key: 'id', color: 'color' },
            facet: { field: 'phase' },
        };

        facetPoints(parent, data, baseSpec);
        const first = facetPoints(parent, typedData, spec);
        const firstCanvas = first.charts[0].canvas;
        const second = facetPoints(parent, typedData, spec);

        expect(first.charts).toHaveLength(2);
        expect(second.charts).toHaveLength(2);
        expect(parent.querySelectorAll('.gsm-facet-grid')).toHaveLength(1);
        expect(firstCanvas.isConnected).toBe(false);
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

    test('includes typed facet context in each child accessible summary', () => {
        const { charts } = facetPoints(parent, data, baseSpec);

        expect(charts[0].canvas.getAttribute('aria-label')).toContain(
            'Facet phase: "Baseline".'
        );
        expect(charts[1].canvas.getAttribute('aria-label')).toContain(
            'Facet phase: "Week 4".'
        );
        expect(charts[0].canvas.textContent).toBe(
            charts[0].canvas.getAttribute('aria-label')
        );
    });

    test('distinguishes numeric and string facet values in accessible summaries', () => {
        const { charts } = facetPoints(
            parent,
            [
                { phase: 1, id: 'A', x: 1, y: 2 },
                { phase: '1', id: 'A', x: 1, y: 2 },
            ],
            {
                mapping: { x: 'x', y: 'y', key: 'id' },
                facet: { field: 'phase' },
            }
        );

        const labels = charts.map((chart) =>
            chart.canvas.getAttribute('aria-label')
        );
        expect(labels[0]).toContain('Facet phase: 1.');
        expect(labels[1]).toContain('Facet phase: "1".');
        expect(labels[0]).not.toBe(labels[1]);
    });

    test('keeps missing and literal facet labels distinct for assistive technology', () => {
        const { charts } = facetPoints(
            parent,
            [
                { phase: null, id: 'A', x: 1, y: 2 },
                { phase: '(Missing)', id: 'B', x: 3, y: 4 },
            ],
            {
                mapping: { x: 'x', y: 'y', key: 'id' },
                facet: {
                    field: 'phase',
                    order: [null, '(Missing)'],
                },
            }
        );

        expect(charts[0].canvas.getAttribute('aria-label')).toContain(
            'Facet phase: (Missing).'
        );
        expect(charts[1].canvas.getAttribute('aria-label')).toContain(
            'Facet phase: "(Missing)".'
        );
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

    test('does not synchronize different facet-aware line groups', () => {
        const lineData = [
            { phase: 'Baseline', threshold: 'Low', x: 1, y: 5 },
            { phase: 'Baseline', threshold: 'Low', x: 8, y: 15 },
            { phase: 'Baseline', threshold: 'High', x: 1, y: 25 },
            { phase: 'Baseline', threshold: 'High', x: 8, y: 35 },
            { phase: 'Week 4', threshold: 'High', x: 1, y: 20 },
            { phase: 'Week 4', threshold: 'High', x: 8, y: 40 },
        ];
        const { charts } = facetPoints(parent, data, {
            ...baseSpec,
            annotations: {
                lines: [
                    {
                        data: lineData,
                        mapping: {
                            x: 'x',
                            y: 'y',
                            group: 'threshold',
                        },
                        showInLegend: true,
                    },
                ],
            },
        });
        const lowIndex = charts[0].data.datasets.findIndex(
            (dataset) =>
                dataset._annotation && dataset._annotationGroup === 'Low'
        );
        const siblingHighIndex = charts[1].data.datasets.findIndex(
            (dataset) =>
                dataset._annotation && dataset._annotationGroup === 'High'
        );
        const lowItem = charts[0].legend.legendItems.find(
            ({ datasetIndex }) => datasetIndex === lowIndex
        );

        charts[0].options.plugins.legend.onClick.call(
            charts[0].legend,
            {},
            lowItem,
            charts[0].legend
        );

        expect(charts[0].isDatasetVisible(lowIndex)).toBe(false);
        expect(charts[1].isDatasetVisible(siblingHighIndex)).toBe(true);
    });

    test('preserves grouped auxiliary-line order and colors across facets', () => {
        const lineData = [
            { phase: 'Baseline', threshold: 'Low', x: 1, y: 5 },
            { phase: 'Baseline', threshold: 'High', x: 8, y: 15 },
            { phase: 'Baseline', threshold: null, x: 4, y: 20 },
            { phase: 'Week 4', threshold: 'High', x: 1, y: 25 },
        ];
        const { charts } = facetPoints(parent, data, {
            ...baseSpec,
            annotations: {
                lines: [
                    {
                        data: lineData,
                        mapping: {
                            x: 'x',
                            y: 'y',
                            group: 'threshold',
                        },
                        showInLegend: true,
                    },
                ],
            },
        });
        const groups = charts.map((chart) =>
            chart.data.datasets
                .filter((dataset) => dataset._annotation)
                .map((dataset) => [
                    dataset._annotationGroup,
                    dataset.borderColor,
                ])
        );

        expect(groups[0].map(([group]) => group)).toEqual([
            'Low',
            'High',
            '(Missing)',
        ]);
        expect(groups[1].map(([group]) => group)).toEqual([
            'Low',
            'High',
            '(Missing)',
        ]);
        expect(groups[0][1][1]).toBe(groups[1][1][1]);
        expect(
            charts[1].data.datasets.filter((dataset) => dataset._annotation)[0]
                .data
        ).toEqual([]);
    });

    test('prepares auxiliary line partitions and shared bounds once per grid', () => {
        let facetReads = 0;
        let groupReads = 0;
        let commonXReads = 0;
        const lineData = ['A', 'B', 'C', 'D'].map((phase, index) => {
            const row = { x: index + 1, y: index + 10 };
            Object.defineProperties(row, {
                phase: {
                    enumerable: true,
                    get() {
                        facetReads += 1;
                        return phase;
                    },
                },
                threshold: {
                    enumerable: true,
                    get() {
                        groupReads += 1;
                        return `Group ${index}`;
                    },
                },
            });
            return row;
        });
        const commonLineData = [
            {
                get x() {
                    commonXReads += 1;
                    return 10;
                },
                y: 20,
            },
        ];
        const facetData = ['A', 'B', 'C', 'D'].map((phase, index) => ({
            ...data[0],
            phase,
            id: `point-${index}`,
            x: index + 1,
            y: index + 2,
        }));

        const { charts } = facetPoints(parent, facetData, {
            ...baseSpec,
            annotations: {
                lines: [
                    {
                        data: lineData,
                        mapping: { x: 'x', y: 'y', group: 'threshold' },
                    },
                    {
                        data: commonLineData,
                        mapping: { x: 'x', y: 'y' },
                    },
                ],
            },
        });

        expect(charts).toHaveLength(4);
        expect(facetReads).toBe(lineData.length * 2);
        expect(groupReads).toBe(lineData.length * 4);
        expect(commonXReads).toBe(charts.length + 2);
    });

    test.each(['updateData', 'updateSpec'])(
        'preserves chart state when a facet %s would add an unknown style',
        (updateName) => {
            const { charts } = facetPoints(parent, data, {
                ...baseSpec,
                selection: { enabled: true },
                zoom: { enabled: true },
            });
            const chart = charts[0];
            const datasets = chart.data.datasets;
            const spec = chart.data._spec_;

            chart.helpers.selectPoint(chart, 'A');
            chart.zoomScale('x', { min: 2, max: 3 }, 'none');
            const selection = chart.helpers.getSelection(chart);
            const zoom = [chart.scales.x.min, chart.scales.x.max];
            const update =
                updateName === 'updateData'
                    ? () =>
                          chart.helpers.updateData(chart, [
                              { ...data[0], status: 'Triangle' },
                          ])
                    : () =>
                          chart.helpers.updateSpec(chart, {
                              mapping: { color: 'status' },
                          });

            expect(update).toThrow(
                updateName === 'updateSpec'
                    ? 'facetPoints child updates cannot change color or shape mappings'
                    : 'facetPoints could not resolve point dataset identity'
            );
            expect(chart.data.datasets).toBe(datasets);
            expect(chart.data._spec_).toBe(spec);
            expect(chart.helpers.getSelection(chart)).toEqual(selection);
            expect([chart.scales.x.min, chart.scales.x.max]).toEqual(zoom);
        }
    );

    test('preserves chart state when a replacement spec removes a shape mapping', () => {
        const rows = [
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
                group: 'Control',
                status: 'Triangle',
            },
            {
                phase: 'Week 4',
                id: 'C',
                x: 8,
                y: 30,
                group: 'Control',
                status: 'Circle',
            },
        ];
        const { charts } = facetPoints(parent, rows, {
            ...baseSpec,
            selection: { enabled: true },
            zoom: { enabled: true },
        });
        const chart = charts[0];
        const datasets = chart.data.datasets;
        const spec = chart.data._spec_;

        chart.helpers.selectPoint(chart, 'A');
        chart.zoomScale('x', { min: 2, max: 3 }, 'none');
        const selection = chart.helpers.getSelection(chart);
        const zoom = [chart.scales.x.min, chart.scales.x.max];
        let error;

        try {
            chart.helpers.updateData(
                chart,
                rows.filter(({ phase }) => phase === 'Baseline'),
                {
                    mapping: {
                        x: 'x',
                        y: 'y',
                        key: 'id',
                        color: 'group',
                    },
                }
            );
        } catch (caught) {
            error = caught;
        }

        expect({
            error: error?.message,
            datasetsRetained: chart.data.datasets === datasets,
            specRetained: chart.data._spec_ === spec,
            selection: chart.helpers.getSelection(chart),
            zoom: [chart.scales.x.min, chart.scales.x.max],
        }).toEqual({
            error: 'facetPoints child updates cannot change color or shape mappings',
            datasetsRetained: true,
            specRetained: true,
            selection,
            zoom,
        });
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

    test('preserves explicit size and opacity domains on replacement-spec updates', () => {
        const rows = [
            { phase: 'Baseline', id: 'A', x: 1, y: 10, n: 10, o: 0.2 },
            { phase: 'Baseline', id: 'B', x: 4, y: 20, n: 20, o: 0.4 },
            { phase: 'Week 4', id: 'C', x: 8, y: 30, n: 200, o: 1 },
        ];
        const mapping = {
            x: 'x',
            y: 'y',
            key: 'id',
            size: 'n',
            opacity: 'o',
        };
        const { charts } = facetPoints(parent, rows, {
            mapping,
            scales: {
                size: { domain: [0, 200] },
                opacity: { domain: [0, 1] },
            },
            facet: { field: 'phase' },
        });
        const chart = charts[0];
        const before = {
            pointRadius: [...chart.data.datasets[0].pointRadius],
            backgroundColor: [...chart.data.datasets[0].backgroundColor],
        };

        chart.helpers.updateData(
            chart,
            rows.filter(({ phase }) => phase === 'Baseline'),
            { mapping }
        );

        expect(chart.data.datasets[0].pointRadius).toEqual(before.pointRadius);
        expect(chart.data.datasets[0].backgroundColor).toEqual(
            before.backgroundColor
        );
    });

    test.each([
        [null, 'spec.scales must be a plain object'],
        [{ x: null }, 'spec.scales.x must be a plain object'],
    ])(
        'preserves malformed replacement scales during shared-scale injection',
        (scales, message) => {
            const { charts } = facetPoints(parent, data, {
                ...baseSpec,
                selection: { enabled: true },
                zoom: { enabled: true },
            });
            const chart = charts[0];
            chart.helpers.selectPoint(chart, 'A');
            chart.zoomScale('x', { min: 2, max: 3 }, 'none');
            const before = {
                datasets: chart.data.datasets,
                spec: chart.data._spec_,
                selection: chart.helpers.getSelection(chart),
                zoom: [chart.scales.x.min, chart.scales.x.max],
            };

            expect(() =>
                chart.helpers.updateData(chart, data.slice(0, 2), {
                    mapping: baseSpec.mapping,
                    scales,
                })
            ).toThrow(message);
            expect(chart.data.datasets).toBe(before.datasets);
            expect(chart.data._spec_).toBe(before.spec);
            expect(chart.helpers.getSelection(chart)).toEqual(before.selection);
            expect([chart.scales.x.min, chart.scales.x.max]).toEqual(
                before.zoom
            );
        }
    );

    test('preserves child state when an update introduces an unknown style', () => {
        const { charts } = facetPoints(parent, data, {
            ...baseSpec,
            selection: { enabled: true },
            zoom: { enabled: true },
        });
        const chart = charts[0];
        chart.helpers.selectPoint(chart, 'A');
        chart.zoomScale('x', { min: 2, max: 3 }, 'none');
        const before = {
            datasets: chart.data.datasets,
            spec: chart.data._spec_,
            selection: chart.helpers.getSelection(chart),
            zoom: [chart.scales.x.min, chart.scales.x.max],
        };

        expect(() =>
            chart.helpers.updateData(chart, [
                { ...data[0], status: 'Triangle' },
            ])
        ).toThrow('facetPoints could not resolve point dataset identity');
        expect(chart.data.datasets).toBe(before.datasets);
        expect(chart.data._spec_).toBe(before.spec);
        expect(chart.helpers.getSelection(chart)).toEqual(before.selection);
        expect([chart.scales.x.min, chart.scales.x.max]).toEqual(before.zoom);
    });

    test.each(['updateData', 'updateSpec'])(
        'rejects malformed callback containers in facet %s updates',
        (updateName) => {
            const { charts } = facetPoints(parent, data, {
                ...baseSpec,
                selection: { enabled: true },
                zoom: { enabled: true },
            });
            const chart = charts[0];
            chart.helpers.selectPoint(chart, 'A');
            chart.zoomScale('x', { min: 2, max: 3 }, 'none');
            const before = {
                datasets: chart.data.datasets,
                spec: chart.data._spec_,
                selection: chart.helpers.getSelection(chart),
                zoom: [chart.scales.x.min, chart.scales.x.max],
            };
            const update =
                updateName === 'updateData'
                    ? () =>
                          chart.helpers.updateData(chart, data.slice(0, 2), {
                              mapping: baseSpec.mapping,
                              callbacks: [],
                          })
                    : () =>
                          chart.helpers.updateSpec(chart, {
                              callbacks: [],
                          });

            expect(update).toThrow('spec.callbacks must be a plain object');
            expect(chart.data.datasets).toBe(before.datasets);
            expect(chart.data._spec_).toBe(before.spec);
            expect(chart.helpers.getSelection(chart)).toEqual(before.selection);
            expect([chart.scales.x.min, chart.scales.x.max]).toEqual(
                before.zoom
            );
        }
    );

    test('preflights replacement specs after injecting shared size and opacity domains', () => {
        const rows = [
            { phase: 'Baseline', id: 'A', x: 1, y: 10, n: 10, o: 0.2 },
            { phase: 'Week 4', id: 'B', x: 2, y: 20, n: 20, o: 0.4 },
        ];
        const mapping = {
            x: 'x',
            y: 'y',
            key: 'id',
            size: 'n',
            opacity: 'o',
        };
        const { charts } = facetPoints(parent, rows, {
            mapping,
            scales: {
                size: { domain: [0, 20] },
                opacity: { domain: [0, 1] },
            },
            facet: { field: 'phase' },
        });

        charts[0].helpers.updateData(charts[0], rows.slice(0, 1), {
            mapping,
            scales: { size: {}, opacity: {} },
        });

        expect(charts[0].data._spec_.scales.size.domain).toEqual([0, 20]);
        expect(charts[0].data._spec_.scales.opacity.domain).toEqual([0, 1]);
    });

    test('updates a live child after a sibling has been destroyed', () => {
        const { charts } = facetPoints(parent, data, baseSpec);
        charts[1].destroy();

        expect(() =>
            charts[0].helpers.updateData(
                charts[0],
                data.filter(({ phase }) => phase === 'Baseline')
            )
        ).not.toThrow();
        expect(charts[0].canvas).not.toBeNull();
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
        expect(charts[0].canvas.getAttribute('aria-label')).toContain(
            'Facet phase: "Baseline".'
        );
        expect(
            charts[0].canvas
                .getAttribute('aria-label')
                .match(/Facet phase: "Baseline"\./g)
        ).toHaveLength(1);
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

    test('associates every canvas with its facet label for both positions', () => {
        ['top', 'bottom'].forEach((position) => {
            const { charts } = facetPoints(parent, data, {
                ...baseSpec,
                facet: { ...baseSpec.facet, label: { position } },
            });

            charts.forEach((chart, index) => {
                const label = document.getElementById(
                    chart.canvas.getAttribute('aria-describedby')
                );
                expect(label.classList.contains('gsm-facet-label')).toBe(true);
                expect(label.textContent).toBe(['Baseline', 'Week 4'][index]);
            });

            charts[0].helpers.updateSpec(charts[0], {
                labels: { title: 'Updated' },
            });
            expect(charts[0].canvas.getAttribute('aria-describedby')).toBe(
                charts[0].canvas
                    .closest('.gsm-facet-cell')
                    .querySelector('.gsm-facet-label').id
            );
        });
    });

    test('keeps rerendering when explicit breaks extend past the data', () => {
        const spec = {
            ...baseSpec,
            scales: {
                x: { breaks: [0, 5, 10], labels: ['zero', 'five', 'ten'] },
            },
        };

        facetPoints(parent, data, spec);
        const { charts } = facetPoints(parent, data, spec);

        expect(parent.querySelectorAll('.gsm-facet-grid')).toHaveLength(1);
        expect(charts).toHaveLength(2);
        expect(charts[0].options.scales.x.min).toBe(0);
        expect(charts[0].options.scales.x.max).toBe(10);
    });

    test('renders the same size and opacity value identically in every facet', () => {
        const sizeData = [
            { phase: 'Baseline', id: 'A', x: 1, y: 1, n: 10, o: 10 },
            { phase: 'Baseline', id: 'B', x: 2, y: 2, n: 20, o: 20 },
            { phase: 'Week 4', id: 'C', x: 3, y: 3, n: 20, o: 20 },
            { phase: 'Week 4', id: 'D', x: 4, y: 4, n: 500, o: 500 },
        ];
        const { charts } = facetPoints(parent, sizeData, {
            mapping: { x: 'x', y: 'y', key: 'id', size: 'n', opacity: 'o' },
            facet: { field: 'phase' },
        });
        const radius = (chart, key) => {
            const point = findPoint(chart, key);
            return chart.data.datasets[point.datasetIndex].pointRadius[
                point.index
            ];
        };
        const color = (chart, key) => {
            const point = findPoint(chart, key);
            return chart.data.datasets[point.datasetIndex].backgroundColor[
                point.index
            ];
        };

        expect(radius(charts[0], 'B')).toBeCloseTo(radius(charts[1], 'C'));
        expect(radius(charts[0], 'B')).toBeLessThan(12);
        expect(color(charts[0], 'B')).toBe(color(charts[1], 'C'));
        expect(radius(charts[1], 'D')).toBe(12);
    });

    test('keeps facet context for callbacks replaced after rendering', () => {
        const { charts } = facetPoints(parent, data, baseSpec);
        const onClick = jest.fn();
        const onHover = jest.fn();
        const onSelect = jest.fn();
        const active = findPoint(charts[1], 'A');
        const click = { type: 'click', native: { target: charts[1].canvas } };

        charts[1].helpers.updateSpec(charts[1], {
            callbacks: { onClick, onHover },
            selection: { enabled: true },
        });
        charts[1].options.onClick(click, [active], charts[1]);
        charts[1].options.onHover(click, [active], charts[1]);

        expect(onClick).toHaveBeenCalledTimes(1);
        expect(onClick).toHaveBeenCalledWith(
            expect.objectContaining({ _key: 'A' }),
            'Week 4',
            click
        );
        expect(onHover).toHaveBeenCalledWith(
            expect.objectContaining({ _key: 'A' }),
            'Week 4',
            click
        );

        charts[1].helpers.updateData(charts[1], data.slice(2), {
            mapping: baseSpec.mapping,
            selection: { enabled: true },
            callbacks: { onSelect },
        });
        charts[1].helpers.selectPoint(charts[1], 'A');
        expect(onSelect).toHaveBeenCalledTimes(1);
        expect(onSelect).toHaveBeenCalledWith(
            { type: 'point', values: ['A'] },
            'Week 4',
            undefined
        );
        expect(charts[0].helpers.getSelection(charts[0]).values).toEqual(['A']);
    });

    test('keeps rendering when mapped size values exceed the argument limit', () => {
        const rows = Array.from({ length: 300000 }, (_, index) => ({
            phase: index % 2 ? 'Baseline' : 'Week 4',
            id: index,
            x: index,
            y: index,
            n: index,
        }));

        expect(() =>
            facetPoints(parent, rows, {
                mapping: { x: 'x', y: 'y', size: 'n' },
                facet: { field: 'phase' },
            })
        ).not.toThrow();
    }, 60000);

    test('does not synchronize hover after a hover callback rebuilds the chart', () => {
        const { charts } = facetPoints(parent, data, {
            ...baseSpec,
            callbacks: {
                onHover: (point, facetValue) => {
                    if (facetValue === 'Baseline') {
                        charts[0].helpers.updateData(charts[0], [
                            {
                                phase: 'Baseline',
                                id: 'C',
                                x: 1,
                                y: 1,
                                group: 'Control',
                                status: 'Circle',
                            },
                        ]);
                    }
                },
            },
        });
        const hover = {
            type: 'mousemove',
            native: { target: charts[0].canvas },
        };

        charts[0].options.onHover(
            hover,
            [findPoint(charts[0], 'A')],
            charts[0]
        );

        expect(charts[1].getActiveElements()).toEqual([]);
    });

    test('does not throw when a hover callback rerenders the whole grid', () => {
        let rerendered;
        const spec = {
            ...baseSpec,
            callbacks: {
                onHover: () => {
                    if (!rerendered) {
                        rerendered = facetPoints(parent, data, baseSpec);
                    }
                },
            },
        };
        const { charts } = facetPoints(parent, data, spec);

        expect(() =>
            charts[0].options.onHover(
                {
                    type: 'mousemove',
                    native: { target: charts[0].canvas },
                },
                [findPoint(charts[0], 'A')],
                charts[0]
            )
        ).not.toThrow();
        expect(rerendered.charts[1].getActiveElements()).toEqual([]);
    });

    test('does not throw when a selection click rerenders the whole grid', () => {
        let rerendered;
        const spec = {
            ...baseSpec,
            selection: { enabled: true },
            callbacks: {
                onClick: () => {
                    if (!rerendered) {
                        rerendered = facetPoints(parent, data, spec);
                    }
                },
            },
        };
        const { charts } = facetPoints(parent, data, spec);
        const chart = charts[0];
        const click = {
            type: 'click',
            native: { target: chart.canvas },
        };

        expect(() =>
            chart.options.onClick(click, [findPoint(chart, 'A')], chart)
        ).not.toThrow();
        expect(chart.canvas).toBeNull();
        expect(rerendered.charts).toHaveLength(2);
    });

    test('keeps shared styles after a replacement-spec updateData', () => {
        const styledData = data.map((row, index) => ({
            ...row,
            n: [1, 2, 3, 100][index],
        }));
        const spec = {
            ...baseSpec,
            mapping: { ...baseSpec.mapping, shape: undefined, size: 'n' },
        };
        const { charts } = facetPoints(parent, styledData, spec);
        const snapshot = (chart) =>
            chart.data.datasets
                .filter((dataset) => !dataset._annotation)
                .map(({ _color, backgroundColor, pointRadius, data }) => ({
                    _color,
                    backgroundColor,
                    pointRadius: data.length ? pointRadius : undefined,
                }));
        const before = snapshot(charts[1]);

        charts[1].helpers.updateData(
            charts[1],
            styledData.filter(({ phase }) => phase === 'Week 4'),
            { mapping: spec.mapping }
        );

        expect(snapshot(charts[1])).toEqual(before);
        expect(charts[1].data._spec_.scales.size.domain).toEqual([1, 100]);
    });

    test('preserves shared fixed axes after a replacement-spec updateData', () => {
        const rows = [
            {
                phase: 'Baseline',
                id: 'A',
                x: 1,
                y: 10,
                group: 'Control',
                status: 'Circle',
            },
            {
                phase: 'Week 4',
                id: 'B',
                x: 100,
                y: 20,
                group: 'Treatment',
                status: 'Triangle',
            },
        ];
        const { charts } = facetPoints(parent, rows, baseSpec);
        const chart = charts[0];
        const originalRanges = {
            x: [chart.options.scales.x.min, chart.options.scales.x.max],
            y: [chart.options.scales.y.min, chart.options.scales.y.max],
        };

        expect(originalRanges.x).toEqual([1, 100]);

        chart.helpers.updateData(chart, rows.slice(0, 1), {
            mapping: baseSpec.mapping,
        });

        expect([
            chart.options.scales.x.min,
            chart.options.scales.x.max,
        ]).toEqual(originalRanges.x);
        expect([
            chart.options.scales.y.min,
            chart.options.scales.y.max,
        ]).toEqual(originalRanges.y);
    });

    test('drops the shared x range when a child update remaps x', () => {
        const rows = data.map((row) => ({ ...row, wide: row.x * 100 }));
        const { charts } = facetPoints(parent, rows, baseSpec);
        const [first, second] = charts;

        first.helpers.updateSpec(first, { labels: { title: 'Kept' } });
        expect(first.data._spec_.scales.x.range).toEqual([1, 8]);

        first.helpers.updateSpec(first, { mapping: { x: 'wide' } });
        expect(first.data._spec_.scales.x.range).toBeUndefined();
        expect(first.scales.x.max).toBeGreaterThanOrEqual(400);

        first.helpers.updateSpec(first, { mapping: { x: 'x' } });
        expect(first.data._spec_.scales.x.range).toEqual([1, 8]);

        second.helpers.updateData(
            second,
            rows.filter(({ phase }) => phase === 'Week 4'),
            { mapping: { ...baseSpec.mapping, x: 'wide' } }
        );
        expect(second.data._spec_.scales.x.range).toBeUndefined();
        expect(second.scales.x.max).toBeGreaterThanOrEqual(800);
    });

    test('keeps explicit local scales across unrelated partial updates', () => {
        const rows = data.map((row, index) => ({
            ...row,
            wide: row.x * 100,
            n: [1, 2, 3, 100][index],
            m: [500, 600, 700, 900][index],
        }));
        const spec = {
            ...baseSpec,
            mapping: { ...baseSpec.mapping, shape: undefined, size: 'n' },
        };
        const { charts } = facetPoints(parent, rows, spec);
        const chart = charts[0];

        chart.helpers.updateSpec(chart, {
            mapping: { x: 'wide', size: 'm' },
            scales: { x: { range: [0, 1000] }, size: { domain: [0, 1000] } },
        });
        chart.helpers.updateSpec(chart, { labels: { title: 'Updated' } });

        expect(chart.data._spec_.scales.x.range).toEqual([0, 1000]);
        expect(chart.data._spec_.scales.size.domain).toEqual([0, 1000]);
    });

    test('keeps hidden auxiliary lines hidden after a child update', () => {
        const spec = {
            ...baseSpec,
            annotations: {
                lines: [
                    {
                        data: [
                            { lineX: 0, lineY: 0 },
                            { lineX: 10, lineY: 40 },
                        ],
                        mapping: { x: 'lineX', y: 'lineY' },
                    },
                ],
            },
        };
        const { charts } = facetPoints(parent, data, spec);
        const lineIndex = (chart) =>
            chart.data.datasets.findIndex((dataset) => dataset._annotation);
        const item = { datasetIndex: lineIndex(charts[0]) };

        charts[0].options.plugins.legend.onClick.call(
            charts[0].legend,
            {},
            item,
            charts[0].legend
        );
        expect(charts[1].isDatasetVisible(lineIndex(charts[1]))).toBe(false);

        charts[1].helpers.updateSpec(charts[1], {
            labels: { title: 'Updated' },
        });
        charts[0].helpers.updateData(
            charts[0],
            data.filter(({ phase }) => phase === 'Baseline')
        );

        expect(charts[0].isDatasetVisible(lineIndex(charts[0]))).toBe(false);
        expect(charts[1].isDatasetVisible(lineIndex(charts[1]))).toBe(false);
    });

    test('drops the shared size domain when a child updateSpec remaps size', () => {
        const rows = data.map((row, index) => ({
            ...row,
            n: [1, 2, 3, 100][index],
            m: [500, 600, 700, 900][index],
        }));
        const spec = {
            ...baseSpec,
            mapping: { ...baseSpec.mapping, shape: undefined, size: 'n' },
        };
        const { charts } = facetPoints(parent, rows, spec);
        const chart = charts[0];

        chart.helpers.updateSpec(chart, { mapping: { size: 'm' } });

        expect(chart.data._spec_.scales.size.domain).toBeUndefined();
        const radii = chart.data.datasets
            .filter((dataset) => !dataset._annotation && dataset.data.length)
            .flatMap((dataset) => [].concat(dataset.pointRadius));
        expect(new Set(radii).size).toBeGreaterThan(1);
    });

    test('clears linked hover when the pointer leaves the canvas', () => {
        const { charts } = facetPoints(parent, data, baseSpec);

        charts[0].options.onHover(
            { type: 'mousemove', native: { target: charts[0].canvas } },
            [findPoint(charts[0], 'A')],
            charts[0]
        );
        expect(charts[1].getActiveElements()).toHaveLength(1);

        charts[0].canvas.dispatchEvent(new Event('mouseout'));
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
