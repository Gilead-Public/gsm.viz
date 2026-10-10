import computeGlobalScales from '../../src/facetPoints/computeGlobalScales.js';
import mergeSpec from '../../src/facetPoints/mergeSpec.js';
import splitData from '../../src/facetPoints/splitData.js';

function prepare(data, overrides = {}) {
    const {
        facet: facetOverrides,
        mapping: mappingOverrides,
        ...rest
    } = overrides;
    const facet = {
        field: 'region',
        ...(facetOverrides || {}),
    };
    const spec = {
        ...rest,
        mapping: { x: 'x', y: 'y', ...(mappingOverrides || {}) },
        facet,
    };
    const merged = mergeSpec(data, spec);
    const facets = splitData(data, merged.facet.field, merged.facet.order);
    return { facets, merged };
}

function compute(data, overrides) {
    const { facets, merged } = prepare(data, overrides);
    return computeGlobalScales(facets, merged);
}

const data = [
    { x: 1, y: 9, region: 'North' },
    { x: 4, y: 3, region: 'North' },
    { x: -2, y: 12, region: 'South' },
    { x: 8, y: -5, region: 'South' },
];

describe('facetPoints/computeGlobalScales', () => {
    test('computes both numeric domains across rendered facets', () => {
        expect(compute(data)).toEqual({
            xMin: -2,
            xMax: 8,
            yMin: -5,
            yMax: 12,
        });
    });

    test('uses facet.order as an allowlist for global domains', () => {
        expect(compute(data, { facet: { order: ['North', 'Empty'] } })).toEqual(
            {
                xMin: 1,
                xMax: 4,
                yMin: 3,
                yMax: 9,
            }
        );
    });

    test('includes auxiliary line coordinates', () => {
        expect(
            compute(data, {
                annotations: {
                    lines: [
                        {
                            data: [
                                { lineX: -10, lineY: 2 },
                                { lineX: 20, lineY: 30 },
                            ],
                            mapping: { x: 'lineX', y: 'lineY' },
                        },
                    ],
                },
            })
        ).toEqual({
            xMin: -10,
            xMax: 20,
            yMin: -5,
            yMax: 30,
        });
    });

    test('includes reference-line values on their corresponding axes', () => {
        expect(
            compute(data, {
                annotations: {
                    referenceLines: [
                        { axis: 'x', value: 25 },
                        { axis: 'y', value: -20 },
                    ],
                },
            })
        ).toEqual({
            xMin: -2,
            xMax: 25,
            yMin: -20,
            yMax: 12,
        });
    });

    test('lets explicit point ranges remain authoritative', () => {
        const xRange = [-100, 100];
        const yRange = [0, 50];
        const { facets, merged } = prepare(data, {
            scales: {
                x: { range: xRange },
                y: { range: yRange },
            },
            annotations: {
                referenceLines: [{ axis: 'x', value: 500 }],
            },
        });

        expect(computeGlobalScales(facets, merged)).toEqual({
            xMin: -100,
            xMax: 100,
            yMin: 0,
            yMax: 50,
        });
        expect(merged.scales.x.range).not.toBe(xRange);
        expect(merged.scales.y.range).not.toBe(yRange);
        expect(xRange).toEqual([-100, 100]);
        expect(yRange).toEqual([0, 50]);
    });

    test.each([
        [
            { x: { free: true }, y: { free: false } },
            { yMin: -5, yMax: 12 },
        ],
        [
            { x: { free: false }, y: { free: true } },
            { xMin: -2, xMax: 8 },
        ],
        [{ x: { free: true }, y: { free: true } }, {}],
    ])('omits independently free domains %#', (scales, expected) => {
        expect(compute(data, { facet: { scales } })).toEqual(expected);
    });

    test('applies beginAtZero to shared automatic linear domains', () => {
        expect(
            compute(
                [
                    { x: 2, y: -8, region: 'A' },
                    { x: 5, y: -3, region: 'B' },
                ],
                {
                    scales: {
                        x: { beginAtZero: true },
                        y: { beginAtZero: true },
                    },
                }
            )
        ).toEqual({
            xMin: 0,
            xMax: 5,
            yMin: -8,
            yMax: 0,
        });
    });

    test('supports positive logarithmic point and line domains', () => {
        expect(
            compute(
                [
                    { x: 1, y: 10, region: 'A' },
                    { x: 100, y: 1000, region: 'B' },
                ],
                {
                    scales: {
                        x: { type: 'log' },
                        y: { type: 'log' },
                    },
                    annotations: {
                        lines: [
                            {
                                data: [
                                    { lx: 0.1, ly: 2 },
                                    { lx: 1000, ly: 2000 },
                                ],
                                mapping: { x: 'lx', y: 'ly' },
                            },
                        ],
                    },
                }
            )
        ).toEqual({
            xMin: 0.1,
            xMax: 1000,
            yMin: 2,
            yMax: 2000,
        });
    });

    test('surfaces invalid logarithmic point coordinates', () => {
        expect(() =>
            compute([{ x: 0, y: 1, region: 'A' }], {
                scales: { x: { type: 'log' } },
            })
        ).toThrow(
            'data[0].x mapped by spec.mapping.x must be greater than zero for a log scale'
        );
    });

    test('surfaces invalid logarithmic auxiliary coordinates', () => {
        expect(() =>
            compute([{ x: 1, y: 1, region: 'A' }], {
                scales: { x: { type: 'log' } },
                annotations: {
                    lines: [
                        {
                            data: [{ lx: 0, ly: 1 }],
                            mapping: { x: 'lx', y: 'ly' },
                        },
                    ],
                },
            })
        ).toThrow(
            'spec.annotations.lines[0].data[0].lx mapped by mapping.x must be greater than zero for a log scale'
        );
    });

    test('surfaces invalid logarithmic reference values', () => {
        expect(() =>
            compute([{ x: 1, y: 1, region: 'A' }], {
                scales: { x: { type: 'log' } },
                annotations: {
                    referenceLines: [{ axis: 'x', value: 0 }],
                },
            })
        ).toThrow(
            'spec.annotations.referenceLines[0].value must be greater than zero for a log scale'
        );
    });

    test('expands a degenerate linear domain without losing the value', () => {
        const result = compute([{ x: 5, y: 0, region: 'A' }]);

        expect(result.xMin).toBeLessThan(5);
        expect(result.xMax).toBeGreaterThan(5);
        expect(result.yMin).toBeLessThan(0);
        expect(result.yMax).toBeGreaterThan(0);
    });

    test.each([Number.MAX_VALUE, -Number.MAX_VALUE])(
        'keeps an extreme degenerate linear domain finite for %p',
        (value) => {
            const result = compute([{ x: value, y: 1, region: 'A' }]);

            expect(Number.isFinite(result.xMin)).toBe(true);
            expect(Number.isFinite(result.xMax)).toBe(true);
            expect(result.xMin).toBeLessThan(result.xMax);
            expect(result.xMin).toBeLessThanOrEqual(value);
            expect(result.xMax).toBeGreaterThanOrEqual(value);
        }
    );

    test.each([Number.MIN_VALUE, Number.MAX_VALUE])(
        'keeps an extreme degenerate log domain positive and finite for %p',
        (value) => {
            const result = compute([{ x: value, y: 1, region: 'A' }], {
                scales: { x: { type: 'log' } },
            });

            expect(Number.isFinite(result.xMin)).toBe(true);
            expect(Number.isFinite(result.xMax)).toBe(true);
            expect(result.xMin).toBeGreaterThan(0);
            expect(result.xMin).toBeLessThan(result.xMax);
            expect(result.xMin).toBeLessThanOrEqual(value);
            expect(result.xMax).toBeGreaterThanOrEqual(value);
        }
    );

    test('returns no automatic domains when nothing is rendered', () => {
        expect(
            compute([], { facet: { order: ['Requested empty facet'] } })
        ).toEqual({});
    });

    test('allows a mapped key to repeat across facets', () => {
        expect(() =>
            compute(
                [
                    { x: 1, y: 2, region: 'A', id: 'same' },
                    { x: 3, y: 4, region: 'B', id: 'same' },
                ],
                { mapping: { key: 'id' } }
            )
        ).not.toThrow();
    });

    test('still rejects duplicate keys within one facet', () => {
        expect(() =>
            compute(
                [
                    { x: 1, y: 2, region: 'A', id: 'same' },
                    { x: 3, y: 4, region: 'A', id: 'same' },
                ],
                { mapping: { key: 'id' } }
            )
        ).toThrow('must be unique; duplicate key "same"');
    });
});
