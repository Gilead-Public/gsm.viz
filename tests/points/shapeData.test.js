import structureData from '../../src/points/structureData.js';

function makeSpec(data, mapping, overrides = {}) {
    return {
        data,
        mapping: { x: 'x', y: 'y', ...mapping },
        scales: {
            x: { type: 'linear' },
            y: { type: 'linear' },
            color: {
                colors: {},
                palette: ['#111111', '#222222', '#333333'],
                order: [],
            },
            size: { range: [3, 12] },
            opacity: { range: [0.25, 1] },
            shape: {
                values: {},
                order: [],
                label: undefined,
            },
            ...overrides,
        },
    };
}

describe('points shape data', () => {
    test('creates one deterministically styled dataset per shape level', () => {
        const first = { x: 1, y: 2, marker: 'Triangle' };
        const second = { x: 3, y: 4, marker: 'Circle' };
        const third = { x: 5, y: 6, marker: 'Triangle' };
        const datasets = structureData(
            makeSpec([first, second, third], { shape: 'marker' })
        ).datasets;

        expect(datasets.map((dataset) => dataset.label)).toEqual([
            'Triangle',
            'Circle',
        ]);
        expect(datasets.map((dataset) => dataset.pointStyle)).toEqual([
            'circle',
            'triangle',
        ]);
        expect(datasets[0].data.map((point) => point._datum)).toEqual([
            first,
            third,
        ]);
        expect(datasets[0].data[0]._shape).toBe('Triangle');
    });

    test('honors named styles and explicit shape order', () => {
        const datasets = structureData(
            makeSpec(
                [
                    { x: 1, y: 2, marker: 'Observed' },
                    { x: 3, y: 4, marker: 'Expected' },
                ],
                { shape: 'marker' },
                {
                    shape: {
                        values: {
                            Observed: 'star',
                            Expected: 'rectRot',
                        },
                        order: ['Expected', 'Observed'],
                        label: 'Status',
                    },
                }
            )
        ).datasets;

        expect(datasets.map((dataset) => dataset.label)).toEqual([
            'Expected',
            'Observed',
        ]);
        expect(datasets.map((dataset) => dataset.pointStyle)).toEqual([
            'rectRot',
            'star',
        ]);
    });

    test('uses a reserved neutral cross for missing shape values', () => {
        const datasets = structureData(
            makeSpec(
                [
                    { x: 1, y: 2, marker: null },
                    { x: 3, y: 4 },
                ],
                { shape: 'marker' }
            )
        ).datasets;

        expect(datasets).toHaveLength(1);
        expect(datasets[0].label).toBe('(Missing)');
        expect(datasets[0].pointStyle).toBe('cross');
        expect(datasets[0].data.map((point) => point._shape)).toEqual([
            '(Missing)',
            '(Missing)',
        ]);
    });

    test('combines color and shape once when they map the same field', () => {
        const datasets = structureData(
            makeSpec(
                [
                    { x: 1, y: 2, group: 'A' },
                    { x: 3, y: 4, group: 'B' },
                ],
                { color: 'group', shape: 'group' },
                {
                    color: {
                        colors: { A: '#aa0000', B: '#0000aa' },
                        palette: ['#111111'],
                        order: ['A', 'B'],
                    },
                    shape: {
                        values: { A: 'star', B: 'triangle' },
                        order: ['A', 'B'],
                    },
                }
            )
        ).datasets;

        expect(datasets.map((dataset) => dataset.label)).toEqual(['A', 'B']);
        expect(
            datasets.map(({ backgroundColor, pointStyle }) => ({
                backgroundColor,
                pointStyle,
            }))
        ).toEqual([
            { backgroundColor: '#aa0000', pointStyle: 'star' },
            { backgroundColor: '#0000aa', pointStyle: 'triangle' },
        ]);
    });

    test('retains absent ordered levels when color and shape share a field', () => {
        const datasets = structureData(
            makeSpec(
                [{ x: 1, y: 2, group: 'A' }],
                { color: 'group', shape: 'group' },
                {
                    color: {
                        colors: { A: '#aa0000', B: '#0000aa' },
                        palette: ['#111111'],
                        order: ['A', 'B'],
                    },
                    shape: {
                        values: { A: 'star', B: 'triangle' },
                        order: [],
                    },
                }
            )
        ).datasets;

        expect(datasets.map((dataset) => dataset.label)).toEqual(['A', 'B']);
        expect(datasets[1].data).toEqual([]);
        expect(datasets[1].backgroundColor).toBe('#0000aa');
        expect(datasets[1].pointStyle).toBe('triangle');
    });

    test('uses one stable domain for same-field color and shape fallbacks', () => {
        const scales = {
            color: {
                colors: {},
                palette: ['#111111', '#222222', '#333333'],
                order: ['Ghost', 'A'],
            },
            shape: {
                values: {},
                order: ['Shape only', 'A'],
            },
        };
        const complete = structureData(
            makeSpec(
                [
                    { x: 1, y: 2, group: 'Ghost' },
                    { x: 3, y: 4, group: 'A' },
                ],
                { color: 'group', shape: 'group' },
                scales
            )
        ).datasets;
        const filtered = structureData(
            makeSpec(
                [{ x: 3, y: 4, group: 'A' }],
                { color: 'group', shape: 'group' },
                scales
            )
        ).datasets;

        expect(filtered.map((dataset) => dataset.label)).toEqual([
            'Ghost',
            'A',
            'Shape only',
        ]);
        expect(
            complete.find((dataset) => dataset.label === 'A').pointStyle
        ).toBe('triangle');
        expect(
            filtered.find((dataset) => dataset.label === 'A').pointStyle
        ).toBe('triangle');
    });

    test('builds and orders actual color-shape combinations', () => {
        const datasets = structureData(
            makeSpec(
                [
                    { x: 1, y: 2, group: 'B', marker: 'Square' },
                    { x: 3, y: 4, group: 'A', marker: 'Triangle' },
                    { x: 5, y: 6, group: 'A', marker: 'Circle' },
                    { x: 7, y: 8, group: 'B', marker: 'Triangle' },
                ],
                { color: 'group', shape: 'marker' },
                {
                    color: {
                        colors: { A: '#aa0000', B: '#0000aa' },
                        palette: ['#111111'],
                        order: ['A', 'B'],
                    },
                    shape: {
                        values: {
                            Circle: 'circle',
                            Triangle: 'triangle',
                            Square: 'rect',
                        },
                        order: ['Circle', 'Triangle', 'Square'],
                    },
                }
            )
        ).datasets;

        expect(datasets.map((dataset) => dataset.label)).toEqual([
            '"A" / "Circle"',
            '"A" / "Triangle"',
            '"B" / "Triangle"',
            '"B" / "Square"',
        ]);
        expect(datasets.map((dataset) => dataset.pointStyle)).toEqual([
            'circle',
            'triangle',
            'triangle',
            'rect',
        ]);
        expect(datasets.map((dataset) => dataset.backgroundColor)).toEqual([
            '#aa0000',
            '#aa0000',
            '#0000aa',
            '#0000aa',
        ]);
    });

    test('keeps a literal Missing shape separate from absent values', () => {
        const datasets = structureData(
            makeSpec(
                [
                    { x: 1, y: 2, marker: '(Missing)' },
                    { x: 3, y: 4, marker: null },
                ],
                { shape: 'marker' },
                {
                    shape: {
                        values: { '(Missing)': 'star' },
                        order: [],
                    },
                }
            )
        ).datasets;

        expect(datasets).toHaveLength(2);
        expect(datasets.map((dataset) => dataset.label)).toEqual([
            '"(Missing)"',
            '(Missing)',
        ]);
        expect(datasets[0].pointStyle).toBe('star');
        expect(datasets[1].pointStyle).toBe('cross');
    });

    test('does not reuse the missing style as a categorical fallback', () => {
        const datasets = structureData(
            makeSpec(
                [
                    { x: 1, y: 2, marker: 'Observed' },
                    { x: 3, y: 4, marker: null },
                ],
                { shape: 'marker' }
            )
        ).datasets;

        expect(datasets.map((dataset) => dataset.pointStyle)).toEqual([
            'circle',
            'cross',
        ]);
    });

    test('orders a literal Missing shape without converting it to absence', () => {
        const datasets = structureData(
            makeSpec(
                [
                    { x: 1, y: 2, marker: '(Missing)' },
                    { x: 3, y: 4, marker: null },
                ],
                { shape: 'marker' },
                {
                    shape: {
                        values: { '(Missing)': 'star' },
                        order: ['(Missing)'],
                    },
                }
            )
        ).datasets;

        expect(datasets).toHaveLength(2);
        expect(datasets.map((dataset) => dataset.label)).toEqual([
            '"(Missing)"',
            '(Missing)',
        ]);
        expect(datasets[0].pointStyle).toBe('star');
        expect(datasets[0].data.map((point) => point._key)).toEqual([0]);
        expect(datasets[1].pointStyle).toBe('cross');
        expect(datasets[1].data.map((point) => point._key)).toEqual([1]);
    });

    test('keeps an ordered literal Missing ghost stable after filtering', () => {
        const shape = {
            values: { '(Missing)': 'star' },
            order: ['(Missing)'],
        };
        const populated = structureData(
            makeSpec(
                [{ x: 1, y: 2, marker: '(Missing)' }],
                { shape: 'marker' },
                { shape }
            )
        ).datasets;
        const filtered = structureData(
            makeSpec(
                [{ x: 3, y: 4, marker: 'Other' }],
                { shape: 'marker' },
                { shape }
            )
        ).datasets;

        expect(populated[0]).toEqual(
            expect.objectContaining({
                label: '"(Missing)"',
                pointStyle: 'star',
                _shapeMissing: false,
            })
        );
        expect(filtered[0]).toEqual(
            expect.objectContaining({
                label: '"(Missing)"',
                pointStyle: 'star',
                _shapeMissing: false,
                data: [],
            })
        );
    });

    test('uses null to place the missing shape level explicitly', () => {
        const datasets = structureData(
            makeSpec(
                [
                    { x: 1, y: 2, marker: 'Observed' },
                    { x: 3, y: 4, marker: null },
                ],
                { shape: 'marker' },
                {
                    shape: {
                        values: {},
                        order: [null, 'Observed'],
                    },
                }
            )
        ).datasets;

        expect(
            datasets.map(({ label, _shapeMissing }) => ({
                label,
                missing: _shapeMissing,
            }))
        ).toEqual([
            { label: '(Missing)', missing: true },
            { label: 'Observed', missing: false },
        ]);
    });

    test('does not merge color-shape combinations with delimiter-like values', () => {
        const datasets = structureData(
            makeSpec(
                [
                    {
                        x: 1,
                        y: 2,
                        group: 'a|value:string:b',
                        marker: 'c',
                    },
                    {
                        x: 3,
                        y: 4,
                        group: 'a',
                        marker: 'b|value:string:c',
                    },
                ],
                { color: 'group', shape: 'marker' }
            )
        ).datasets;

        expect(datasets.map((dataset) => dataset.label)).toEqual([
            '"a|value:string:b" / "c"',
            '"a" / "b|value:string:c"',
        ]);
        expect(datasets.map((dataset) => dataset.data)).toEqual([
            [expect.objectContaining({ _key: 0 })],
            [expect.objectContaining({ _key: 1 })],
        ]);
    });
});
