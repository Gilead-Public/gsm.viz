import structureData from '../../src/points/structureData.js';

function makeSpec(data, mapping = { x: 'xValue', y: 'yValue' }) {
    return { data, mapping };
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
});
