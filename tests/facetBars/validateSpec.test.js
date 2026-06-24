import validateSpec from '../../src/facetBars/validateSpec.js';

describe('facetBars/validateSpec', () => {
    const minimalData = [{ site: 'A', value: 10 }];
    const minimalSpec = { mapping: { x: 'site' }, facet: { field: 'region' } };

    test('does not throw for valid data and spec', () => {
        expect(() => validateSpec(minimalData, minimalSpec)).not.toThrow();
    });

    describe('data validation', () => {
        test('throws when data is null', () => {
            expect(() => validateSpec(null, minimalSpec)).toThrow(
                'data is required'
            );
        });

        test('throws when data is undefined', () => {
            expect(() => validateSpec(undefined, minimalSpec)).toThrow(
                'data is required'
            );
        });

        test('throws when data is not an array', () => {
            expect(() => validateSpec({}, minimalSpec)).toThrow(
                'data must be an array'
            );
        });
    });

    describe('spec validation', () => {
        test('throws when spec is null', () => {
            expect(() => validateSpec(minimalData, null)).toThrow(
                'spec is required'
            );
        });

        test('throws when spec is undefined', () => {
            expect(() => validateSpec(minimalData, undefined)).toThrow(
                'spec is required'
            );
        });

        test('throws when spec is not a plain object', () => {
            expect(() => validateSpec(minimalData, 'bad')).toThrow(
                'spec must be a plain object'
            );
        });

        test('throws when spec.mapping is missing', () => {
            expect(() =>
                validateSpec(minimalData, { facet: { field: 'x' } })
            ).toThrow('spec.mapping is required');
        });

        test('throws when spec.mapping.x is missing', () => {
            expect(() =>
                validateSpec(minimalData, {
                    mapping: {},
                    facet: { field: 'x' },
                })
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
                validateSpec(minimalData, {
                    mapping: { x: 'site' },
                    facet: 'bad',
                })
            ).toThrow('spec.facet must be a plain object');
        });

        test('throws when spec.facet.field is missing', () => {
            expect(() =>
                validateSpec(minimalData, { mapping: { x: 'site' }, facet: {} })
            ).toThrow('spec.facet.field is required');
        });

        test('throws when spec.facet.field is not a string', () => {
            expect(() =>
                validateSpec(minimalData, {
                    mapping: { x: 'site' },
                    facet: { field: 123 },
                })
            ).toThrow('spec.facet.field must be a string');
        });

        test('throws when spec.facet.order is not an array', () => {
            expect(() =>
                validateSpec(minimalData, {
                    mapping: { x: 'site' },
                    facet: { field: 'r', order: 'US,EU' },
                })
            ).toThrow('spec.facet.order must be an array');
        });

        test('does not throw when spec.facet.order is a valid array', () => {
            expect(() =>
                validateSpec(minimalData, {
                    mapping: { x: 'site' },
                    facet: { field: 'r', order: ['US', 'EU'] },
                })
            ).not.toThrow();
        });

        test('throws when spec.facet.nCol is not a positive integer', () => {
            expect(() =>
                validateSpec(minimalData, {
                    mapping: { x: 'site' },
                    facet: { field: 'r', nCol: 0 },
                })
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

        test('throws when spec.facet.legend.sync is not a boolean', () => {
            expect(() =>
                validateSpec(minimalData, {
                    mapping: { x: 'site' },
                    facet: { field: 'r', legend: { sync: 'yes' } },
                })
            ).toThrow('spec.facet.legend.sync must be a boolean');
        });

        test('accepts spec.facet.legend.sync as a boolean', () => {
            expect(() =>
                validateSpec(minimalData, {
                    mapping: { x: 'site' },
                    facet: { field: 'r', legend: { sync: false } },
                })
            ).not.toThrow();
        });

        test('throws when spec.facet.legend.display is not a boolean', () => {
            expect(() =>
                validateSpec(minimalData, {
                    mapping: { x: 'site' },
                    facet: { field: 'r', legend: { display: 'yes' } },
                })
            ).toThrow('spec.facet.legend.display must be a boolean');
        });

        test('does not throw when spec.facet.legend.display is a boolean', () => {
            expect(() =>
                validateSpec(minimalData, {
                    mapping: { x: 'site' },
                    facet: { field: 'r', legend: { display: false } },
                })
            ).not.toThrow();
        });

        test('throws when spec.facet.label.position is an invalid value', () => {
            expect(() =>
                validateSpec(minimalData, {
                    mapping: { x: 'site' },
                    facet: { field: 'r', label: { position: 'left' } },
                })
            ).toThrow("spec.facet.label.position must be 'top' or 'bottom'");
        });

        test('does not throw when spec.facet.label.position is top or bottom', () => {
            expect(() =>
                validateSpec(minimalData, {
                    mapping: { x: 'site' },
                    facet: { field: 'r', label: { position: 'bottom' } },
                })
            ).not.toThrow();
        });

        test('throws when spec.facet.label.font is not a string', () => {
            expect(() =>
                validateSpec(minimalData, {
                    mapping: { x: 'site' },
                    facet: { field: 'r', label: { font: 14 } },
                })
            ).toThrow('spec.facet.label.font must be a string');
        });

        test('does not throw when spec.facet.label.font is a valid string', () => {
            expect(() =>
                validateSpec(minimalData, {
                    mapping: { x: 'site' },
                    facet: {
                        field: 'r',
                        label: { font: 'bold 13px sans-serif' },
                    },
                })
            ).not.toThrow();
        });

        test('throws when spec.facet.chartHeight is not a positive number', () => {
            expect(() =>
                validateSpec(minimalData, {
                    mapping: { x: 'site' },
                    facet: { field: 'r', chartHeight: -50 },
                })
            ).toThrow('spec.facet.chartHeight must be a positive number');
        });

        test('throws when spec.facet.chartHeight is a string', () => {
            expect(() =>
                validateSpec(minimalData, {
                    mapping: { x: 'site' },
                    facet: { field: 'r', chartHeight: '300px' },
                })
            ).toThrow('spec.facet.chartHeight must be a positive number');
        });

        test('does not throw when spec.facet.chartHeight is a positive number', () => {
            expect(() =>
                validateSpec(minimalData, {
                    mapping: { x: 'site' },
                    facet: { field: 'r', chartHeight: 300 },
                })
            ).not.toThrow();
        });
    });
});
