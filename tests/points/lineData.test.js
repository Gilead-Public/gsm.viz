import structureLines from '../../src/points/structureLines.js';

const colorPalette = ['#111111', '#222222', '#333333'];

function makeSpec(lines, scales = {}) {
    return {
        annotations: { lines },
        scales: {
            x: { type: 'linear' },
            y: { type: 'linear' },
            color: { palette: colorPalette },
            ...scales,
        },
    };
}

function makeLine(overrides = {}) {
    return {
        data: [
            { xValue: 1, yValue: 2 },
            { xValue: 3, yValue: 4 },
        ],
        mapping: { x: 'xValue', y: 'yValue' },
        ...overrides,
    };
}

describe('points auxiliary line data', () => {
    test('creates a non-interactive ungrouped line dataset', () => {
        const rows = [
            { xValue: 1, yValue: 2, note: 'start' },
            { xValue: 3, yValue: 4, note: 'end' },
        ];
        const [dataset] = structureLines(
            makeSpec([
                makeLine({
                    data: rows,
                    label: 'Threshold',
                    color: '#abcdef',
                    width: 3,
                    dash: [4, 2],
                    tension: 0.2,
                    stepped: 'middle',
                    showInLegend: true,
                }),
            ])
        );

        expect(dataset).toEqual(
            expect.objectContaining({
                type: 'line',
                label: 'Threshold',
                borderColor: '#abcdef',
                backgroundColor: '#abcdef',
                borderWidth: 3,
                borderDash: [4, 2],
                tension: 0.2,
                stepped: 'middle',
                fill: false,
                pointRadius: 0,
                pointHoverRadius: 0,
                pointHitRadius: 0,
                order: 1,
                _annotation: true,
                _showInLegend: true,
            })
        );
        expect(dataset.data).toEqual([
            { x: 1, y: 2, _datum: rows[0] },
            { x: 3, y: 4, _datum: rows[1] },
        ]);
    });

    test('uses conservative defaults for an unlabeled line', () => {
        const [dataset] = structureLines(makeSpec([makeLine()]));

        expect(dataset).toEqual(
            expect.objectContaining({
                label: '',
                borderColor: '#666666',
                backgroundColor: '#666666',
                borderWidth: 2,
                borderDash: [],
                tension: 0,
                stepped: false,
                _showInLegend: false,
            })
        );
    });

    test('uses the first custom palette color for an ungrouped line', () => {
        const [dataset] = structureLines(
            makeSpec([
                makeLine({
                    palette: ['#abcdef', '#fedcba'],
                }),
            ])
        );

        expect(dataset.borderColor).toBe('#abcdef');
    });

    test('creates ordered grouped lines and stable empty groups', () => {
        const rows = [
            { x: 1, y: 2, threshold: 'Upper' },
            { x: 3, y: 4, threshold: 'Lower' },
            { x: 5, y: 6, threshold: 'Upper' },
        ];
        const datasets = structureLines(
            makeSpec([
                {
                    data: rows,
                    mapping: { x: 'x', y: 'y', group: 'threshold' },
                    order: ['Lower', 'Expected', 'Upper'],
                    label: 'Threshold',
                    colors: { Lower: '#aa0000' },
                    palette: ['#010101', '#020202', '#030303'],
                    showInLegend: true,
                },
            ])
        );

        expect(datasets.map((dataset) => dataset.label)).toEqual([
            'Threshold: Lower',
            'Threshold: Expected',
            'Threshold: Upper',
        ]);
        expect(datasets.map((dataset) => dataset.borderColor)).toEqual([
            '#aa0000',
            '#020202',
            '#030303',
        ]);
        expect(datasets[1].data).toEqual([]);
        expect(datasets[2].data.map((point) => point._datum)).toEqual([
            rows[0],
            rows[2],
        ]);
    });

    test('uses a shared color when one is supplied for grouped lines', () => {
        const datasets = structureLines(
            makeSpec([
                {
                    data: [
                        { x: 1, y: 2, group: 'A' },
                        { x: 3, y: 4, group: 'B' },
                    ],
                    mapping: { x: 'x', y: 'y', group: 'group' },
                    color: '#123456',
                },
            ])
        );

        expect(datasets.map((dataset) => dataset.borderColor)).toEqual([
            '#123456',
            '#123456',
        ]);
    });

    test('keeps missing and literal Missing groups distinct', () => {
        const datasets = structureLines(
            makeSpec([
                {
                    data: [
                        { x: 1, y: 2, group: '(Missing)' },
                        { x: 3, y: 4, group: null },
                    ],
                    mapping: { x: 'x', y: 'y', group: 'group' },
                    order: ['(Missing)', null],
                },
            ])
        );

        expect(datasets.map((dataset) => dataset.label)).toEqual([
            '"(Missing)"',
            '(Missing)',
        ]);
        expect(datasets).toHaveLength(2);
        expect(datasets[1].borderColor).toBe('#bdbdbd');
    });

    test('preserves the configured layer and row order', () => {
        const result = structureLines(
            makeSpec([
                makeLine({ label: 'First' }),
                makeLine({
                    data: [{ xValue: 9, yValue: 8 }],
                    label: 'Second',
                }),
            ])
        );

        expect(result.map((dataset) => dataset.label)).toEqual([
            'First',
            'Second',
        ]);
        expect(result[0].data.map(({ x }) => x)).toEqual([1, 3]);
    });

    test.each([
        [
            'x',
            [{ xValue: '1', yValue: 2 }],
            'spec.annotations.lines[0].data[0].xValue mapped by mapping.x must be a finite number',
        ],
        [
            'y',
            [{ xValue: 1, yValue: Infinity }],
            'spec.annotations.lines[0].data[0].yValue mapped by mapping.y must be a finite number',
        ],
    ])('rejects an invalid %s coordinate', (_case, data, message) => {
        expect(() => structureLines(makeSpec([makeLine({ data })]))).toThrow(
            message
        );
    });

    test('rejects non-positive log coordinates', () => {
        expect(() =>
            structureLines(
                makeSpec(
                    [
                        makeLine({
                            data: [{ xValue: 0, yValue: 2 }],
                        }),
                    ],
                    { x: { type: 'log' } }
                )
            )
        ).toThrow(
            'spec.annotations.lines[0].data[0].xValue mapped by mapping.x must be greater than zero for a log scale'
        );
    });

    test('rejects invalid grouped values', () => {
        expect(() =>
            structureLines(
                makeSpec([
                    {
                        data: [{ x: 1, y: 2, group: true }],
                        mapping: { x: 'x', y: 'y', group: 'group' },
                    },
                ])
            )
        ).toThrow(
            'spec.annotations.lines[0].data[0].group mapped by mapping.group must be a string, finite number, or missing'
        );
    });

    test('does not mutate frozen annotation data or styling arrays', () => {
        const row = Object.freeze({ x: 1, y: 2, group: 'A' });
        const data = Object.freeze([row]);
        const dash = Object.freeze([2, 1]);
        const order = Object.freeze(['A']);
        const line = Object.freeze({
            data,
            mapping: Object.freeze({ x: 'x', y: 'y', group: 'group' }),
            order,
            dash,
        });

        const [dataset] = structureLines(makeSpec([line]));

        expect(dataset.data[0]._datum).toBe(row);
        expect(dataset.borderDash).toEqual(dash);
        expect(dataset.borderDash).not.toBe(dash);
        expect(order).toEqual(['A']);
    });
});
