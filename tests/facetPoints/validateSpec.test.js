import validateSpec from '../../src/facetPoints/validateSpec.js';

const data = [{ x: 1, y: 2, region: 'North' }];
const spec = {
    mapping: { x: 'x', y: 'y' },
    facet: { field: 'region' },
};

describe('facetPoints/validateSpec', () => {
    test('accepts the minimal points and facet contract', () => {
        expect(() => validateSpec(data, spec)).not.toThrow();
    });

    test.each([
        [null, 'data is required'],
        [{}, 'data must be an array'],
    ])('delegates invalid data %p to points validation', (value, message) => {
        expect(() => validateSpec(value, spec)).toThrow(message);
    });

    test.each([
        [null, 'spec is required'],
        [[], 'spec must be a plain object'],
        ['bad', 'spec must be a plain object'],
    ])('rejects invalid spec %p', (value, message) => {
        expect(() => validateSpec(data, value)).toThrow(message);
    });

    test('delegates the underlying points spec validation', () => {
        expect(() =>
            validateSpec(data, {
                mapping: { x: 'x' },
                facet: { field: 'region' },
            })
        ).toThrow('spec.mapping.y is required');
    });

    test('rejects unsupported point-level fields', () => {
        expect(() => validateSpec(data, { ...spec, jitter: true })).toThrow(
            'spec.jitter is not supported'
        );
    });

    test('requires spec.facet', () => {
        expect(() =>
            validateSpec(data, { mapping: { x: 'x', y: 'y' } })
        ).toThrow('spec.facet is required');
    });

    test.each([null, [], 'region'])(
        'requires facet to be a plain object: %p',
        (facet) => {
            expect(() => validateSpec(data, { ...spec, facet })).toThrow(
                'spec.facet must be a plain object'
            );
        }
    );

    test.each([undefined, '', '   ', 1])(
        'requires a non-empty facet field: %p',
        (field) => {
            const message =
                field === undefined
                    ? 'spec.facet.field is required'
                    : 'spec.facet.field must be a non-empty string';
            expect(() =>
                validateSpec(data, { ...spec, facet: { field } })
            ).toThrow(message);
        }
    );

    test('rejects unsupported facet fields before they become no-ops', () => {
        expect(() =>
            validateSpec(data, {
                ...spec,
                facet: { field: 'region', spacing: 8 },
            })
        ).toThrow('spec.facet.spacing is not supported');
    });

    describe('order', () => {
        test('accepts strings, finite numbers, and one missing level', () => {
            expect(() =>
                validateSpec(
                    [
                        { x: 1, y: 2, region: 1 },
                        { x: 2, y: 3, region: '1' },
                        { x: 3, y: 4, region: null },
                    ],
                    {
                        ...spec,
                        facet: { field: 'region', order: [1, '1', null] },
                    }
                )
            ).not.toThrow();
        });

        test('accepts an empty allowlist', () => {
            expect(() =>
                validateSpec(data, {
                    ...spec,
                    facet: { field: 'region', order: [] },
                })
            ).not.toThrow();
        });

        test.each(['North', {}, true])(
            'requires order to be an array: %p',
            (order) => {
                expect(() =>
                    validateSpec(data, {
                        ...spec,
                        facet: { field: 'region', order },
                    })
                ).toThrow('spec.facet.order must be an array');
            }
        );

        test.each([undefined, true, Infinity, '', '   '])(
            'rejects unsupported order value %p',
            (value) => {
                expect(() =>
                    validateSpec(data, {
                        ...spec,
                        facet: { field: 'region', order: [value] },
                    })
                ).toThrow(
                    'spec.facet.order[0] must be a non-empty string, finite number, or null'
                );
            }
        );

        test('requires typed order values to be unique', () => {
            expect(() =>
                validateSpec(data, {
                    ...spec,
                    facet: {
                        field: 'region',
                        order: ['North', 'North'],
                    },
                })
            ).toThrow('spec.facet.order must contain unique values');
        });
    });

    describe('facet data', () => {
        test('accepts finite numeric, string, and missing facet values', () => {
            expect(() =>
                validateSpec(
                    [
                        { x: 1, y: 1, region: 1 },
                        { x: 2, y: 2, region: 'North' },
                        { x: 3, y: 3, region: null },
                        { x: 4, y: 4 },
                        { x: 5, y: 5, region: ' ' },
                        { x: 6, y: 6, region: NaN },
                    ],
                    spec
                )
            ).not.toThrow();
        });

        test.each([true, {}, Infinity])(
            'rejects unsupported source facet value %p',
            (region) => {
                expect(() =>
                    validateSpec([{ x: 1, y: 2, region }], spec)
                ).toThrow(
                    'data[0].region mapped by spec.facet.field must be a string, finite number, or missing'
                );
            }
        );
    });

    describe('layout', () => {
        test.each([0, -1, 1.5, Infinity, '2'])(
            'rejects invalid nCol %p',
            (nCol) => {
                expect(() =>
                    validateSpec(data, {
                        ...spec,
                        facet: { field: 'region', nCol },
                    })
                ).toThrow('spec.facet.nCol must be a positive integer');
            }
        );

        test.each([0, -1, NaN, Infinity, '300'])(
            'rejects invalid chartHeight %p',
            (chartHeight) => {
                expect(() =>
                    validateSpec(data, {
                        ...spec,
                        facet: { field: 'region', chartHeight },
                    })
                ).toThrow(
                    'spec.facet.chartHeight must be a positive finite number'
                );
            }
        );

        test('accepts positive layout dimensions', () => {
            expect(() =>
                validateSpec(data, {
                    ...spec,
                    facet: { field: 'region', nCol: 2, chartHeight: 300 },
                })
            ).not.toThrow();
        });
    });

    describe('labels', () => {
        test.each([null, [], 'top'])(
            'requires label to be a plain object: %p',
            (label) => {
                expect(() =>
                    validateSpec(data, {
                        ...spec,
                        facet: { field: 'region', label },
                    })
                ).toThrow('spec.facet.label must be a plain object');
            }
        );

        test('rejects unsupported label fields', () => {
            expect(() =>
                validateSpec(data, {
                    ...spec,
                    facet: { field: 'region', label: { color: 'red' } },
                })
            ).toThrow('spec.facet.label.color is not supported');
        });

        test.each(['left', '', null])(
            'rejects label position %p',
            (position) => {
                expect(() =>
                    validateSpec(data, {
                        ...spec,
                        facet: { field: 'region', label: { position } },
                    })
                ).toThrow(
                    "spec.facet.label.position must be 'top' or 'bottom'"
                );
            }
        );

        test.each(['top', 'bottom'])(
            'accepts label position %s',
            (position) => {
                expect(() =>
                    validateSpec(data, {
                        ...spec,
                        facet: { field: 'region', label: { position } },
                    })
                ).not.toThrow();
            }
        );

        test.each([null, 14, ''])('rejects label font %p', (font) => {
            expect(() =>
                validateSpec(data, {
                    ...spec,
                    facet: { field: 'region', label: { font } },
                })
            ).toThrow('spec.facet.label.font must be a non-empty string');
        });
    });

    describe('scales', () => {
        test.each([null, [], 'free'])(
            'requires scales to be a plain object: %p',
            (scales) => {
                expect(() =>
                    validateSpec(data, {
                        ...spec,
                        facet: { field: 'region', scales },
                    })
                ).toThrow('spec.facet.scales must be a plain object');
            }
        );

        test('rejects unsupported facet scales', () => {
            expect(() =>
                validateSpec(data, {
                    ...spec,
                    facet: {
                        field: 'region',
                        scales: { color: { free: true } },
                    },
                })
            ).toThrow('spec.facet.scales.color is not supported');
        });

        test.each(['x', 'y'])('validates the %s scale namespace', (axis) => {
            expect(() =>
                validateSpec(data, {
                    ...spec,
                    facet: {
                        field: 'region',
                        scales: { [axis]: null },
                    },
                })
            ).toThrow(`spec.facet.scales.${axis} must be a plain object`);
            expect(() =>
                validateSpec(data, {
                    ...spec,
                    facet: {
                        field: 'region',
                        scales: { [axis]: { shared: true } },
                    },
                })
            ).toThrow(`spec.facet.scales.${axis}.shared is not supported`);
            expect(() =>
                validateSpec(data, {
                    ...spec,
                    facet: {
                        field: 'region',
                        scales: { [axis]: { free: 'yes' } },
                    },
                })
            ).toThrow(`spec.facet.scales.${axis}.free must be a boolean`);
        });

        test('accepts independently free axes', () => {
            expect(() =>
                validateSpec(data, {
                    ...spec,
                    facet: {
                        field: 'region',
                        scales: {
                            x: { free: true },
                            y: { free: false },
                        },
                    },
                })
            ).not.toThrow();
        });
    });

    describe('legend', () => {
        test.each([null, [], 'yes'])(
            'requires legend to be a plain object: %p',
            (legend) => {
                expect(() =>
                    validateSpec(data, {
                        ...spec,
                        facet: { field: 'region', legend },
                    })
                ).toThrow('spec.facet.legend must be a plain object');
            }
        );

        test('rejects unsupported legend fields', () => {
            expect(() =>
                validateSpec(data, {
                    ...spec,
                    facet: {
                        field: 'region',
                        legend: { position: 'left' },
                    },
                })
            ).toThrow('spec.facet.legend.position is not supported');
        });

        test.each(['display', 'sync'])(
            'requires legend.%s to be boolean',
            (field) => {
                expect(() =>
                    validateSpec(data, {
                        ...spec,
                        facet: {
                            field: 'region',
                            legend: { [field]: 'yes' },
                        },
                    })
                ).toThrow(`spec.facet.legend.${field} must be a boolean`);
            }
        );

        test('accepts display and synchronization controls', () => {
            expect(() =>
                validateSpec(data, {
                    ...spec,
                    facet: {
                        field: 'region',
                        legend: { display: false, sync: false },
                    },
                })
            ).not.toThrow();
        });
    });
});
