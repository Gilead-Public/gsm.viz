import structureData from '../../src/points/structureData.js';

function makeSpec(data, mapping = { x: 'xValue', y: 'yValue' }) {
    return {
        data,
        mapping,
        scales: {
            color: {
                colors: {},
                palette: ['#4e79a7', '#f28e2b', '#e15759'],
                order: [],
            },
        },
    };
}

describe('points/structureData', () => {
    test('maps source rows to one ordered Chart.js dataset', () => {
        const first = { xValue: 2, yValue: 20, label: 'first' };
        const second = { xValue: 1, yValue: 10, label: 'second' };

        const result = structureData(makeSpec([first, second]));

        expect(result).toEqual({
            datasets: [
                {
                    data: [
                        { x: 2, y: 20, _key: 0, _datum: first },
                        { x: 1, y: 10, _key: 1, _datum: second },
                    ],
                },
            ],
        });
        expect(result.datasets[0].data[0]._datum).toBe(first);
        expect(result.datasets[0].data[1]._datum).toBe(second);
    });

    test('uses a mapped string or finite number as the point key', () => {
        const data = [
            { xValue: 1, yValue: 2, id: 'subject-1' },
            { xValue: 3, yValue: 4, id: 42 },
        ];

        const result = structureData(
            makeSpec(data, { x: 'xValue', y: 'yValue', key: 'id' })
        );

        expect(result.datasets[0].data.map((point) => point._key)).toEqual([
            'subject-1',
            42,
        ]);
    });

    test('keeps duplicate coordinates as independently keyed points', () => {
        const first = { xValue: 1, yValue: 2 };
        const second = { xValue: 1, yValue: 2 };

        const points = structureData(makeSpec([first, second])).datasets[0]
            .data;

        expect(points).toHaveLength(2);
        expect(points.map((point) => point._key)).toEqual([0, 1]);
        expect(points.map((point) => point._datum)).toEqual([first, second]);
    });

    test.each([
        ['missing', {}, 'xValue', 'spec.mapping.x'],
        ['null', { xValue: null, yValue: 1 }, 'xValue', 'spec.mapping.x'],
        [
            'numeric string',
            { xValue: '1', yValue: 1 },
            'xValue',
            'spec.mapping.x',
        ],
        ['NaN', { xValue: NaN, yValue: 1 }, 'xValue', 'spec.mapping.x'],
        [
            'Infinity',
            { xValue: Infinity, yValue: 1 },
            'xValue',
            'spec.mapping.x',
        ],
        [
            'negative Infinity',
            { xValue: 1, yValue: -Infinity },
            'yValue',
            'spec.mapping.y',
        ],
        [
            'undefined',
            { xValue: 1, yValue: undefined },
            'yValue',
            'spec.mapping.y',
        ],
        [
            'numeric y string',
            { xValue: 1, yValue: '2' },
            'yValue',
            'spec.mapping.y',
        ],
    ])(
        'rejects a %s coordinate with row, field, and mapping context',
        (_case, row, field, mapping) => {
            expect(() => structureData(makeSpec([row]))).toThrow(
                `data[0].${field} mapped by ${mapping} must be a finite number`
            );
        }
    );

    test('reports the original index of an invalid row', () => {
        const data = [
            { xValue: 1, yValue: 2 },
            { xValue: 3, yValue: null },
        ];

        expect(() => structureData(makeSpec(data))).toThrow(
            'data[1].yValue mapped by spec.mapping.y must be a finite number'
        );
    });

    test.each([
        ['missing', undefined],
        ['null', null],
        ['NaN', NaN],
        ['Infinity', Infinity],
        ['boolean', true],
        ['object', {}],
    ])('rejects an invalid mapped key: %s', (_case, key) => {
        const row = { xValue: 1, yValue: 2 };
        if (_case !== 'missing') row.id = key;

        expect(() =>
            structureData(
                makeSpec([row], {
                    x: 'xValue',
                    y: 'yValue',
                    key: 'id',
                })
            )
        ).toThrow(
            'data[0].id mapped by spec.mapping.key must be a string or finite number'
        );
    });

    test('rejects duplicate mapped keys at the duplicate row', () => {
        const data = [
            { xValue: 1, yValue: 2, id: 'duplicate' },
            { xValue: 3, yValue: 4, id: 'duplicate' },
        ];

        expect(() =>
            structureData(
                makeSpec(data, {
                    x: 'xValue',
                    y: 'yValue',
                    key: 'id',
                })
            )
        ).toThrow(
            'data[1].id mapped by spec.mapping.key must be unique; duplicate key "duplicate"'
        );
    });

    test('treats numeric and string keys as distinct values', () => {
        const data = [
            { xValue: 1, yValue: 2, id: 1 },
            { xValue: 3, yValue: 4, id: '1' },
        ];

        const result = structureData(
            makeSpec(data, { x: 'xValue', y: 'yValue', key: 'id' })
        );

        expect(result.datasets[0].data.map((point) => point._key)).toEqual([
            1,
            '1',
        ]);
    });

    test('accepts zero and negative finite coordinates', () => {
        const result = structureData(
            makeSpec([
                { xValue: 0, yValue: -1 },
                { xValue: -2, yValue: 0 },
            ])
        );

        expect(result.datasets[0].data.map(({ x, y }) => ({ x, y }))).toEqual([
            { x: 0, y: -1 },
            { x: -2, y: 0 },
        ]);
    });

    test.each([
        ['x', { xValue: 0, yValue: 1 }],
        ['x', { xValue: -1, yValue: 1 }],
        ['y', { xValue: 1, yValue: 0 }],
        ['y', { xValue: 1, yValue: -1 }],
    ])('rejects non-positive %s coordinates on a log scale', (axis, row) => {
        const spec = makeSpec([row]);
        spec.scales[axis] = { type: 'log' };

        expect(() => structureData(spec)).toThrow(
            `data[0].${axis}Value mapped by spec.mapping.${axis} must be greater than zero for a log scale`
        );
    });

    test('returns one empty dataset for empty source data', () => {
        expect(structureData(makeSpec([]))).toEqual({
            datasets: [{ data: [] }],
        });
    });

    test('does not mutate frozen source data or mapping', () => {
        const row = Object.freeze({ xValue: 1, yValue: 2, id: 'A' });
        const data = Object.freeze([row]);
        const mapping = Object.freeze({
            x: 'xValue',
            y: 'yValue',
            key: 'id',
        });

        expect(() => structureData(makeSpec(data, mapping))).not.toThrow();
        expect(row).toEqual({ xValue: 1, yValue: 2, id: 'A' });
        expect(mapping).toEqual({
            x: 'xValue',
            y: 'yValue',
            key: 'id',
        });
    });

    describe('categorical color', () => {
        const colorData = [
            { xValue: 1, yValue: 2, id: 'A', group: 'Treatment' },
            { xValue: 3, yValue: 4, id: 'B', group: 'Control' },
            { xValue: 5, yValue: 6, id: 'C', group: 'Treatment' },
        ];

        function makeColorSpec(data = colorData, colorScale = {}) {
            const spec = makeSpec(data, {
                x: 'xValue',
                y: 'yValue',
                key: 'id',
                color: 'group',
            });
            spec.scales.color = {
                ...spec.scales.color,
                ...colorScale,
            };
            return spec;
        }

        test('creates one dataset per first-seen color level', () => {
            const result = structureData(makeColorSpec());

            expect(result.datasets.map((dataset) => dataset.label)).toEqual([
                'Treatment',
                'Control',
            ]);
            expect(result.datasets[0].data.map((point) => point._key)).toEqual([
                'A',
                'C',
            ]);
            expect(result.datasets[1].data.map((point) => point._key)).toEqual([
                'B',
            ]);
            expect(result.datasets[0].data[0]._datum).toBe(colorData[0]);
            expect(result.datasets[0].data[0]._color).toBe('Treatment');
        });

        test('uses named colors before deterministic palette fallbacks', () => {
            const result = structureData(
                makeColorSpec(colorData, {
                    colors: { Treatment: '#123456' },
                    palette: ['#abcdef', '#fedcba'],
                })
            );

            expect(
                result.datasets.map((dataset) => dataset.backgroundColor)
            ).toEqual(['#123456', '#fedcba']);
            expect(
                result.datasets.map((dataset) => dataset.borderColor)
            ).toEqual(['#123456', '#fedcba']);
        });

        test('honors explicit order, appends new levels, and retains absent groups', () => {
            const scale = {
                order: ['Control', 'Placebo', 'Treatment'],
                palette: ['#111111', '#222222', '#333333', '#444444'],
            };
            const withExtra = [
                ...colorData,
                { xValue: 7, yValue: 8, id: 'D', group: 'Other' },
            ];
            const datasets = structureData(
                makeColorSpec(withExtra, scale)
            ).datasets;

            expect(datasets.map((dataset) => dataset.label)).toEqual([
                'Control',
                'Placebo',
                'Treatment',
                'Other',
            ]);
            expect(datasets[1].data).toEqual([]);
            expect(datasets.map((dataset) => dataset.backgroundColor)).toEqual([
                '#111111',
                '#222222',
                '#333333',
                '#444444',
            ]);
        });

        test('keeps ordered group colors stable when a group is absent', () => {
            const scale = {
                order: ['Control', 'Treatment'],
                palette: ['#111111', '#222222'],
            };
            const complete = structureData(
                makeColorSpec(colorData, scale)
            ).datasets;
            const controlOnly = structureData(
                makeColorSpec([colorData[1]], scale)
            ).datasets;

            expect(
                complete.map(({ label, backgroundColor }) => ({
                    label,
                    backgroundColor,
                }))
            ).toEqual(
                controlOnly.map(({ label, backgroundColor }) => ({
                    label,
                    backgroundColor,
                }))
            );
            expect(controlOnly[1].data).toEqual([]);
        });

        test.each([
            ['missing field', {}],
            ['undefined', { group: undefined }],
            ['null', { group: null }],
            ['empty string', { group: '' }],
            ['NaN', { group: NaN }],
        ])('uses a neutral Missing level for %s', (_case, colorValue) => {
            const row = { xValue: 1, yValue: 2, id: 'A', ...colorValue };
            const [dataset] = structureData(makeColorSpec([row])).datasets;

            expect(dataset.label).toBe('(Missing)');
            expect(dataset.backgroundColor).toBe('#bdbdbd');
            expect(dataset.data[0]._color).toBe('(Missing)');
        });

        test('keeps a literal Missing category separate from absent values', () => {
            const rows = [
                {
                    xValue: 1,
                    yValue: 2,
                    id: 'literal',
                    group: '(Missing)',
                },
                { xValue: 3, yValue: 4, id: 'absent', group: null },
            ];
            const datasets = structureData(
                makeColorSpec(rows, {
                    colors: { '(Missing)': '#ff0000' },
                })
            ).datasets;

            expect(datasets).toHaveLength(2);
            expect(datasets[0].backgroundColor).toBe('#ff0000');
            expect(datasets[0].data.map((point) => point._key)).toEqual([
                'literal',
            ]);
            expect(datasets[1].backgroundColor).toBe('#bdbdbd');
            expect(datasets[1].data.map((point) => point._key)).toEqual([
                'absent',
            ]);
        });

        test.each([
            ['boolean', true],
            ['infinite number', Infinity],
            ['object', {}],
        ])('rejects an invalid %s mapped color value', (_case, group) => {
            expect(() =>
                structureData(
                    makeColorSpec([{ xValue: 1, yValue: 2, id: 'A', group }])
                )
            ).toThrow(
                'data[0].group mapped by spec.mapping.color must be a string, finite number, or missing'
            );
        });

        test('does not mutate frozen color data or scale configuration', () => {
            const row = Object.freeze({
                xValue: 1,
                yValue: 2,
                group: 'A',
            });
            const data = Object.freeze([row]);
            const color = Object.freeze({
                colors: Object.freeze({ A: '#112233' }),
                palette: Object.freeze(['#445566']),
                order: Object.freeze(['A']),
            });
            const spec = Object.freeze({
                data,
                mapping: Object.freeze({
                    x: 'xValue',
                    y: 'yValue',
                    color: 'group',
                }),
                scales: Object.freeze({ color }),
            });

            expect(() => structureData(spec)).not.toThrow();
            expect(row).toEqual({ xValue: 1, yValue: 2, group: 'A' });
            expect(color).toEqual({
                colors: { A: '#112233' },
                palette: ['#445566'],
                order: ['A'],
            });
        });
    });

    describe('continuous size and opacity', () => {
        function makeAestheticSpec(data, mapping, scales = {}) {
            const spec = makeSpec(data, {
                x: 'xValue',
                y: 'yValue',
                ...mapping,
            });
            spec.scales = {
                ...spec.scales,
                size: { range: [2, 10] },
                opacity: { range: [0.2, 0.8] },
                ...scales,
            };
            return spec;
        }

        test('adds per-point radius and visible hover radius arrays', () => {
            const datasets = structureData(
                makeAestheticSpec(
                    [
                        { xValue: 1, yValue: 2, magnitude: 0 },
                        { xValue: 3, yValue: 4, magnitude: 50 },
                        { xValue: 5, yValue: 6, magnitude: 100 },
                    ],
                    { size: 'magnitude' }
                )
            ).datasets;
            const [dataset] = datasets;

            expect(dataset.pointRadius[0]).toBe(2);
            expect(dataset.pointRadius[1]).toBeCloseTo(Math.sqrt(52));
            expect(dataset.pointRadius[2]).toBe(10);
            expect(dataset.pointHoverRadius).toEqual(
                dataset.pointRadius.map((radius) => radius + 2)
            );
            expect(dataset.data.map((point) => point._size)).toEqual([
                0, 50, 100,
            ]);
        });

        test('uses stable midpoint styling for equal domains', () => {
            const [dataset] = structureData(
                makeAestheticSpec(
                    [
                        { xValue: 1, yValue: 2, size: 5, alpha: 7 },
                        { xValue: 3, yValue: 4, size: 5, alpha: 7 },
                    ],
                    { size: 'size', opacity: 'alpha' }
                )
            ).datasets;

            expect(dataset.pointRadius).toEqual([6, 6]);
            expect(dataset.data.map((point) => point._opacity)).toEqual([7, 7]);
            expect(dataset.backgroundColor).toEqual([
                'rgba(78, 121, 167, 0.5)',
                'rgba(78, 121, 167, 0.5)',
            ]);
        });

        test('aligns opacity styles with points across color datasets', () => {
            const datasets = structureData(
                makeAestheticSpec(
                    [
                        {
                            xValue: 1,
                            yValue: 2,
                            group: 'A',
                            alpha: 0,
                        },
                        {
                            xValue: 3,
                            yValue: 4,
                            group: 'B',
                            alpha: 5,
                        },
                        {
                            xValue: 5,
                            yValue: 6,
                            group: 'A',
                            alpha: 10,
                        },
                    ],
                    { color: 'group', opacity: 'alpha' },
                    {
                        color: {
                            colors: { A: '#ff0000', B: '#0000ff' },
                            palette: ['#111111'],
                            order: ['A', 'B'],
                        },
                        size: { range: [2, 10] },
                        opacity: { range: [0.2, 0.8] },
                    }
                )
            ).datasets;

            expect(datasets[0].data.map((point) => point._opacity)).toEqual([
                0, 10,
            ]);
            expect(datasets[0].backgroundColor).toEqual([
                'rgba(255, 0, 0, 0.2)',
                'rgba(255, 0, 0, 0.8)',
            ]);
            expect(datasets[1].backgroundColor).toEqual([
                'rgba(0, 0, 255, 0.5)',
            ]);
        });

        test.each([
            ['size', 'size', -1, 'a finite non-negative number'],
            ['size', 'size', '5', 'a finite non-negative number'],
            ['size', 'size', Infinity, 'a finite non-negative number'],
            ['opacity', 'opacity', NaN, 'a finite number'],
            ['opacity', 'opacity', '0.5', 'a finite number'],
            ['opacity', 'opacity', Infinity, 'a finite number'],
        ])(
            'rejects invalid mapped %s value %#',
            (aesthetic, field, value, requirement) => {
                expect(() =>
                    structureData(
                        makeAestheticSpec(
                            [{ xValue: 1, yValue: 2, [field]: value }],
                            { [aesthetic]: field }
                        )
                    )
                ).toThrow(
                    `data[0].${field} mapped by spec.mapping.${aesthetic} must be ${requirement}`
                );
            }
        );

        test('does not mutate source rows or aesthetic ranges', () => {
            const row = Object.freeze({
                xValue: 1,
                yValue: 2,
                size: 5,
                opacity: 0.5,
            });
            const size = Object.freeze({
                range: Object.freeze([2, 10]),
            });
            const opacity = Object.freeze({
                range: Object.freeze([0.2, 0.8]),
            });
            const spec = Object.freeze({
                data: Object.freeze([row]),
                mapping: Object.freeze({
                    x: 'xValue',
                    y: 'yValue',
                    size: 'size',
                    opacity: 'opacity',
                }),
                scales: Object.freeze({
                    color: Object.freeze({
                        colors: Object.freeze({}),
                        palette: Object.freeze(['#4e79a7']),
                        order: Object.freeze([]),
                    }),
                    size,
                    opacity,
                }),
            });

            expect(() => structureData(spec)).not.toThrow();
            expect(row).toEqual({
                xValue: 1,
                yValue: 2,
                size: 5,
                opacity: 0.5,
            });
            expect(size.range).toEqual([2, 10]);
            expect(opacity.range).toEqual([0.2, 0.8]);
        });
    });
});
