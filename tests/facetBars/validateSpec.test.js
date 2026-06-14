import validateSpec from '../../src/facetBars/validateSpec.js';

describe('facetBars/validateSpec', () => {
    const minimalData = [{ site: 'A', value: 10 }];
    const minimalSpec = { mapping: { x: 'site' }, facet: { field: 'region' } };

    test('does not throw for valid data and spec', () => {
        expect(() => validateSpec(minimalData, minimalSpec)).not.toThrow();
    });

    describe('data validation', () => {
        test('throws when data is null', () => {
            expect(() => validateSpec(null, minimalSpec)).toThrow('data is required');
        });

        test('throws when data is undefined', () => {
            expect(() => validateSpec(undefined, minimalSpec)).toThrow('data is required');
        });

        test('throws when data is not an array', () => {
            expect(() => validateSpec({}, minimalSpec)).toThrow('data must be an array');
        });
    });

    describe('spec validation', () => {
        test('throws when spec is null', () => {
            expect(() => validateSpec(minimalData, null)).toThrow('spec is required');
        });

        test('throws when spec is undefined', () => {
            expect(() => validateSpec(minimalData, undefined)).toThrow('spec is required');
        });

        test('throws when spec is not a plain object', () => {
            expect(() => validateSpec(minimalData, 'bad')).toThrow('spec must be a plain object');
        });

        test('throws when spec.mapping is missing', () => {
            expect(() => validateSpec(minimalData, { facet: { field: 'x' } })).toThrow(
                'spec.mapping is required'
            );
        });

        test('throws when spec.mapping.x is missing', () => {
            expect(() =>
                validateSpec(minimalData, { mapping: {}, facet: { field: 'x' } })
            ).toThrow('spec.mapping.x is required');
        });
    });

    describe('facet validation', () => {
        test('throws when spec.facet is missing', () => {
            expect(() =>
                validateSpec(minimalData, { mapping: { x: 'site' } })
            ).toThrow('spec.facet is required');
        });

        test('throws when spec.facet is not a plain object', () => {
            expect(() =>
                validateSpec(minimalData, { mapping: { x: 'site' }, facet: 'bad' })
            ).toThrow('spec.facet must be a plain object');
        });

        test('throws when spec.facet.field is missing', () => {
            expect(() =>
                validateSpec(minimalData, { mapping: { x: 'site' }, facet: {} })
            ).toThrow('spec.facet.field is required');
        });

        test('throws when spec.facet.field is not a string', () => {
            expect(() =>
                validateSpec(minimalData, { mapping: { x: 'site' }, facet: { field: 123 } })
            ).toThrow('spec.facet.field must be a string');
        });

        test('throws when spec.facet.nCol is not a positive integer', () => {
            expect(() =>
                validateSpec(minimalData, { mapping: { x: 'site' }, facet: { field: 'r', nCol: 0 } })
            ).toThrow('spec.facet.nCol must be a positive integer');
        });

        test('throws when spec.facet.scales.y.free is not a boolean', () => {
            expect(() =>
                validateSpec(minimalData, {
                    mapping: { x: 'site' },
                    facet: { field: 'r', scales: { y: { free: 'yes' } } },
                })
            ).toThrow('spec.facet.scales.y.free must be a boolean');
        });

        test('throws when spec.facet.scales.x.free is not a boolean', () => {
            expect(() =>
                validateSpec(minimalData, {
                    mapping: { x: 'site' },
                    facet: { field: 'r', scales: { x: { free: 'yes' } } },
                })
            ).toThrow('spec.facet.scales.x.free must be a boolean');
        });

        test('throws when spec.facet.legend.chart is an invalid string', () => {
            expect(() =>
                validateSpec(minimalData, {
                    mapping: { x: 'site' },
                    facet: { field: 'r', legend: { chart: 123 } },
                })
            ).toThrow("spec.facet.legend.chart must be 'first', 'last', or a string facet value");
        });

        test('accepts spec.facet.legend.chart as a non-reserved string (facet value)', () => {
            expect(() =>
                validateSpec(minimalData, {
                    mapping: { x: 'site' },
                    facet: { field: 'r', legend: { chart: 'US' } },
                })
            ).not.toThrow();
        });
    });
});
