import validateSpec from '../../src/bars/validateSpec.js';

const data = [{ a: 1, b: 2 }];
const spec = { mapping: { x: 'a', y: 'b' } };

describe('bars/validateSpec', () => {
    test('throws when data is not provided', () => {
        expect(() => validateSpec(undefined, spec)).toThrow('data is required');
    });

    test('throws when data is not an array', () => {
        expect(() => validateSpec('not-array', spec)).toThrow(
            'data must be an array'
        );
    });

    test('throws when spec is not provided', () => {
        expect(() => validateSpec(data, undefined)).toThrow('spec is required');
    });

    test('throws when spec is not an object', () => {
        expect(() => validateSpec(data, 'string')).toThrow(
            'spec must be a plain object'
        );
    });

    test('throws when mapping is missing', () => {
        expect(() => validateSpec(data, {})).toThrow(
            'spec.mapping is required'
        );
    });

    test('throws when mapping.x is missing', () => {
        expect(() => validateSpec(data, { mapping: { y: 'b' } })).toThrow(
            'spec.mapping.x is required'
        );
    });

    test('does not throw when mapping.y is omitted (count mode)', () => {
        expect(() => validateSpec([], { mapping: { x: 'a' } })).not.toThrow();
    });

    test('throws when orientation is invalid', () => {
        expect(() =>
            validateSpec(data, {
                mapping: { x: 'a', y: 'b' },
                orientation: 'diagonal',
            })
        ).toThrow("spec.orientation must be 'vertical' or 'horizontal'");
    });

    test('throws when position is invalid', () => {
        expect(() =>
            validateSpec(data, {
                mapping: { x: 'a', y: 'b' },
                position: 'overlay',
            })
        ).toThrow(
            "spec.position must be 'stack', 'dodge', 'identity', 'fill', or 'layer'"
        );
    });

    test('does not throw with valid position values', () => {
        for (const position of [
            'stack',
            'dodge',
            'identity',
            'fill',
            'layer',
        ]) {
            expect(() =>
                validateSpec(data, { mapping: { x: 'a', y: 'b' }, position })
            ).not.toThrow();
        }
    });

    test('error message for invalid position lists fill as a valid option', () => {
        expect(() =>
            validateSpec(data, {
                mapping: { x: 'a', y: 'b' },
                position: 'overlay',
            })
        ).toThrow('fill');
    });

    test('does not throw with a valid minimal spec', () => {
        expect(() =>
            validateSpec([], { mapping: { x: 'a', y: 'b' } })
        ).not.toThrow();
    });

    test('does not throw with a full valid spec', () => {
        expect(() =>
            validateSpec(data, {
                mapping: { x: 'a', y: 'b', fill: 'group' },
                orientation: 'horizontal',
                position: 'dodge',
                scales: { x: { label: 'X' } },
                labels: { title: 'Test' },
                theme: { maintainAspectRatio: false },
            })
        ).not.toThrow();
    });

    describe('scales.fill.colors validation', () => {
        test('does not throw when scales.fill.colors is a plain object', () => {
            expect(() =>
                validateSpec(data, {
                    mapping: { x: 'a', y: 'b', fill: 'group' },
                    scales: { fill: { colors: { Red: '#ff0000' } } },
                })
            ).not.toThrow();
        });

        test('throws when scales.fill.colors is an array', () => {
            expect(() =>
                validateSpec(data, {
                    mapping: { x: 'a', y: 'b', fill: 'group' },
                    scales: { fill: { colors: ['#ff0000'] } },
                })
            ).toThrow('scales.fill.colors must be a plain object');
        });

        test('throws when scales.fill.colors is a string', () => {
            expect(() =>
                validateSpec(data, {
                    mapping: { x: 'a', y: 'b', fill: 'group' },
                    scales: { fill: { colors: 'red' } },
                })
            ).toThrow('scales.fill.colors must be a plain object');
        });

        test('throws when scales.fill.colors is null', () => {
            expect(() =>
                validateSpec(data, {
                    mapping: { x: 'a', y: 'b', fill: 'group' },
                    scales: { fill: { colors: null } },
                })
            ).toThrow('scales.fill.colors must be a plain object');
        });

        test('does not throw when scales.fill.colors is absent', () => {
            expect(() =>
                validateSpec(data, {
                    mapping: { x: 'a', y: 'b' },
                    scales: { fill: {} },
                })
            ).not.toThrow();
        });

        test('throws when scales.fill.colors is a Map instance', () => {
            expect(() =>
                validateSpec(data, {
                    mapping: { x: 'a', y: 'b', fill: 'group' },
                    scales: { fill: { colors: new Map([['Red', '#ff0000']]) } },
                })
            ).toThrow('scales.fill.colors must be a plain object');
        });

        test('throws when scales.fill.colors is a class instance', () => {
            class MyColors {}
            const instance = new MyColors();
            instance.Red = '#ff0000';
            expect(() =>
                validateSpec(data, {
                    mapping: { x: 'a', y: 'b', fill: 'group' },
                    scales: { fill: { colors: instance } },
                })
            ).toThrow('scales.fill.colors must be a plain object');
        });

        test('does not throw for a null-prototype object', () => {
            const nullProto = Object.create(null);
            nullProto.Red = '#ff0000';
            expect(() =>
                validateSpec(data, {
                    mapping: { x: 'a', y: 'b', fill: 'group' },
                    scales: { fill: { colors: nullProto } },
                })
            ).not.toThrow();
        });
    });

    describe('spec.callbacks validation', () => {
        test('does not throw when callbacks is not provided', () => {
            expect(() =>
                validateSpec(data, { mapping: { x: 'a', y: 'b' } })
            ).not.toThrow();
        });

        test('does not throw with valid onClick and onHover functions', () => {
            expect(() =>
                validateSpec(data, {
                    mapping: { x: 'a', y: 'b' },
                    callbacks: { onClick: () => {}, onHover: () => {} },
                })
            ).not.toThrow();
        });

        test('does not throw with null callbacks', () => {
            expect(() =>
                validateSpec(data, {
                    mapping: { x: 'a', y: 'b' },
                    callbacks: { onClick: null, onHover: null },
                })
            ).not.toThrow();
        });

        test('throws when spec.callbacks is not a plain object', () => {
            expect(() =>
                validateSpec(data, {
                    mapping: { x: 'a', y: 'b' },
                    callbacks: 'not-an-object',
                })
            ).toThrow('spec.callbacks must be a plain object');
        });

        test('throws when spec.callbacks is an array', () => {
            expect(() =>
                validateSpec(data, {
                    mapping: { x: 'a', y: 'b' },
                    callbacks: [],
                })
            ).toThrow('spec.callbacks must be a plain object');
        });

        test('throws when callbacks.onClick is a non-function truthy value', () => {
            expect(() =>
                validateSpec(data, {
                    mapping: { x: 'a', y: 'b' },
                    callbacks: { onClick: {} },
                })
            ).toThrow('spec.callbacks.onClick must be a function or null');
        });

        test('throws when callbacks.onHover is a non-function truthy value', () => {
            expect(() =>
                validateSpec(data, {
                    mapping: { x: 'a', y: 'b' },
                    callbacks: { onHover: 42 },
                })
            ).toThrow('spec.callbacks.onHover must be a function or null');
        });
    });

    describe('spec.labels.captions validation', () => {
        test('does not throw when labels.captions is absent', () => {
            expect(() =>
                validateSpec(data, { mapping: { x: 'a', y: 'b' } })
            ).not.toThrow();
        });

        test('does not throw when labels.captions is undefined', () => {
            expect(() =>
                validateSpec(data, {
                    mapping: { x: 'a', y: 'b' },
                    labels: { captions: undefined },
                })
            ).not.toThrow();
        });

        test('does not throw when labels.captions is null', () => {
            expect(() =>
                validateSpec(data, {
                    mapping: { x: 'a', y: 'b' },
                    labels: { captions: null },
                })
            ).not.toThrow();
        });

        test('does not throw when labels.captions is a string', () => {
            expect(() =>
                validateSpec(data, {
                    mapping: { x: 'a', y: 'b' },
                    labels: { captions: 'Source: Study XYZ' },
                })
            ).not.toThrow();
        });

        test('does not throw when labels.captions is an empty string', () => {
            expect(() =>
                validateSpec(data, {
                    mapping: { x: 'a', y: 'b' },
                    labels: { captions: '' },
                })
            ).not.toThrow();
        });

        test('does not throw when labels.captions is an array of strings', () => {
            expect(() =>
                validateSpec(data, {
                    mapping: { x: 'a', y: 'b' },
                    labels: { captions: ['Caption one', 'Caption two'] },
                })
            ).not.toThrow();
        });

        test('does not throw when labels.captions is an empty array', () => {
            expect(() =>
                validateSpec(data, {
                    mapping: { x: 'a', y: 'b' },
                    labels: { captions: [] },
                })
            ).not.toThrow();
        });

        test('throws when labels.captions is a number', () => {
            expect(() =>
                validateSpec(data, {
                    mapping: { x: 'a', y: 'b' },
                    labels: { captions: 42 },
                })
            ).toThrow(
                'spec.labels.captions must be a string or an array of strings'
            );
        });

        test('throws when labels.captions is a plain object', () => {
            expect(() =>
                validateSpec(data, {
                    mapping: { x: 'a', y: 'b' },
                    labels: { captions: {} },
                })
            ).toThrow(
                'spec.labels.captions must be a string or an array of strings'
            );
        });

        test('throws when labels.captions is an array containing a non-string', () => {
            expect(() =>
                validateSpec(data, {
                    mapping: { x: 'a', y: 'b' },
                    labels: { captions: ['valid', 42] },
                })
            ).toThrow(
                'spec.labels.captions must be a string or an array of strings'
            );
        });

        test('throws when labels.captions is an array containing null', () => {
            expect(() =>
                validateSpec(data, {
                    mapping: { x: 'a', y: 'b' },
                    labels: { captions: ['valid', null] },
                })
            ).toThrow(
                'spec.labels.captions must be a string or an array of strings'
            );
        });
    });

    describe('spec.labels.captionsOptions validation', () => {
        test('does not throw when captionsOptions is absent', () => {
            expect(() =>
                validateSpec(data, { mapping: { x: 'a', y: 'b' } })
            ).not.toThrow();
        });

        test('does not throw when captionsOptions is a plain object', () => {
            expect(() =>
                validateSpec(data, {
                    mapping: { x: 'a', y: 'b' },
                    labels: {
                        captionsOptions: { position: 'top', align: 'end' },
                    },
                })
            ).not.toThrow();
        });

        test('does not throw when captionsOptions is an empty object', () => {
            expect(() =>
                validateSpec(data, {
                    mapping: { x: 'a', y: 'b' },
                    labels: { captionsOptions: {} },
                })
            ).not.toThrow();
        });

        test('throws when captionsOptions is a string', () => {
            expect(() =>
                validateSpec(data, {
                    mapping: { x: 'a', y: 'b' },
                    labels: { captionsOptions: 'bottom' },
                })
            ).toThrow('spec.labels.captionsOptions must be a plain object');
        });

        test('throws when captionsOptions is an array', () => {
            expect(() =>
                validateSpec(data, {
                    mapping: { x: 'a', y: 'b' },
                    labels: { captionsOptions: [] },
                })
            ).toThrow('spec.labels.captionsOptions must be a plain object');
        });

        test('throws when captionsOptions is null', () => {
            expect(() =>
                validateSpec(data, {
                    mapping: { x: 'a', y: 'b' },
                    labels: { captionsOptions: null },
                })
            ).toThrow('spec.labels.captionsOptions must be a plain object');
        });
    });

    describe('spec.legend validation', () => {
        test('does not throw when legend is absent', () => {
            expect(() =>
                validateSpec(data, { mapping: { x: 'a', y: 'b' } })
            ).not.toThrow();
        });

        test('does not throw when legend.dense is true', () => {
            expect(() =>
                validateSpec(data, {
                    mapping: { x: 'a', y: 'b' },
                    legend: { dense: true },
                })
            ).not.toThrow();
        });

        test('does not throw when legend.dense is false', () => {
            expect(() =>
                validateSpec(data, {
                    mapping: { x: 'a', y: 'b' },
                    legend: { dense: false },
                })
            ).not.toThrow();
        });

        test('throws when legend.dense is not a boolean', () => {
            expect(() =>
                validateSpec(data, {
                    mapping: { x: 'a', y: 'b' },
                    legend: { dense: 'yes' },
                })
            ).toThrow('spec.legend.dense must be a boolean');
        });

        test('throws when legend is not a plain object', () => {
            expect(() =>
                validateSpec(data, {
                    mapping: { x: 'a', y: 'b' },
                    legend: 'compact',
                })
            ).toThrow('spec.legend must be a plain object');
        });

        test('throws when legend is an array', () => {
            expect(() =>
                validateSpec(data, {
                    mapping: { x: 'a', y: 'b' },
                    legend: [],
                })
            ).toThrow('spec.legend must be a plain object');
        });
    });

    describe('spec.nCategories validation', () => {
        test('does not throw when nCategories is absent', () => {
            expect(() =>
                validateSpec(data, { mapping: { x: 'a', y: 'b' } })
            ).not.toThrow();
        });

        test('does not throw when nCategories is a positive integer', () => {
            expect(() =>
                validateSpec(data, {
                    mapping: { x: 'a', y: 'b' },
                    nCategories: 10,
                })
            ).not.toThrow();
        });

        test('throws when nCategories is not an integer', () => {
            expect(() =>
                validateSpec(data, {
                    mapping: { x: 'a', y: 'b' },
                    nCategories: 2.5,
                })
            ).toThrow('spec.nCategories must be a positive integer');
        });

        test('throws when nCategories is zero', () => {
            expect(() =>
                validateSpec(data, {
                    mapping: { x: 'a', y: 'b' },
                    nCategories: 0,
                })
            ).toThrow('spec.nCategories must be a positive integer');
        });

        test('throws when nCategories is negative', () => {
            expect(() =>
                validateSpec(data, {
                    mapping: { x: 'a', y: 'b' },
                    nCategories: -5,
                })
            ).toThrow('spec.nCategories must be a positive integer');
        });

        test('throws when nCategories is a string', () => {
            expect(() =>
                validateSpec(data, {
                    mapping: { x: 'a', y: 'b' },
                    nCategories: '10',
                })
            ).toThrow('spec.nCategories must be a positive integer');
        });
    });

    describe('spec.scales.x.sort validation', () => {
        test('does not throw when scales.x.sort is absent', () => {
            expect(() =>
                validateSpec(data, { mapping: { x: 'a', y: 'b' } })
            ).not.toThrow();
        });

        test('does not throw when scales.x.sort is total', () => {
            expect(() =>
                validateSpec(data, {
                    mapping: { x: 'a', y: 'b' },
                    scales: { x: { sort: 'total' } },
                })
            ).not.toThrow();
        });

        test('does not throw when scales.x.sort is alphanumeric', () => {
            expect(() =>
                validateSpec(data, {
                    mapping: { x: 'a', y: 'b' },
                    scales: { x: { sort: 'alphanumeric' } },
                })
            ).not.toThrow();
        });

        test('throws when scales.x.sort is an invalid value', () => {
            expect(() =>
                validateSpec(data, {
                    mapping: { x: 'a', y: 'b' },
                    scales: { x: { sort: 'random' } },
                })
            ).toThrow("spec.scales.x.sort must be 'total' or 'alphanumeric'");
        });
    });

    describe('spec.scales.x.sortDir validation', () => {
        test('does not throw when scales.x.sortDir is absent', () => {
            expect(() =>
                validateSpec(data, { mapping: { x: 'a', y: 'b' } })
            ).not.toThrow();
        });

        test('does not throw when scales.x.sortDir is asc', () => {
            expect(() =>
                validateSpec(data, {
                    mapping: { x: 'a', y: 'b' },
                    scales: { x: { sortDir: 'asc' } },
                })
            ).not.toThrow();
        });

        test('does not throw when scales.x.sortDir is desc', () => {
            expect(() =>
                validateSpec(data, {
                    mapping: { x: 'a', y: 'b' },
                    scales: { x: { sortDir: 'desc' } },
                })
            ).not.toThrow();
        });

        test('throws when scales.x.sortDir is an invalid value', () => {
            expect(() =>
                validateSpec(data, {
                    mapping: { x: 'a', y: 'b' },
                    scales: { x: { sortDir: 'random' } },
                })
            ).toThrow("spec.scales.x.sortDir must be 'asc' or 'desc'");
        });
    });

    describe('annotations.labels formatter validation', () => {
        test('does not throw when segment formatter is a function', () => {
            expect(() =>
                validateSpec(data, {
                    ...spec,
                    annotations: {
                        labels: { segment: { formatter: () => '' } },
                    },
                })
            ).not.toThrow();
        });

        test('does not throw when segment formatter is a string', () => {
            expect(() =>
                validateSpec(data, {
                    ...spec,
                    annotations: {
                        labels: { segment: { formatter: '{fill}: {value}' } },
                    },
                })
            ).not.toThrow();
        });

        test('does not throw when segment formatter is undefined', () => {
            expect(() =>
                validateSpec(data, {
                    ...spec,
                    annotations: {
                        labels: { segment: { formatter: undefined } },
                    },
                })
            ).not.toThrow();
        });

        test('throws when segment formatter is a number', () => {
            expect(() =>
                validateSpec(data, {
                    ...spec,
                    annotations: {
                        labels: { segment: { formatter: 42 } },
                    },
                })
            ).toThrow(
                'spec.annotations.labels.segment.formatter must be a string or function'
            );
        });

        test('throws when segment formatter is an array', () => {
            expect(() =>
                validateSpec(data, {
                    ...spec,
                    annotations: {
                        labels: { segment: { formatter: [] } },
                    },
                })
            ).toThrow(
                'spec.annotations.labels.segment.formatter must be a string or function'
            );
        });

        test('does not throw when total formatter is a function', () => {
            expect(() =>
                validateSpec(data, {
                    ...spec,
                    annotations: {
                        labels: { total: { formatter: () => '' } },
                    },
                })
            ).not.toThrow();
        });

        test('does not throw when total formatter is a string', () => {
            expect(() =>
                validateSpec(data, {
                    ...spec,
                    annotations: {
                        labels: { total: { formatter: '{value}' } },
                    },
                })
            ).not.toThrow();
        });

        test('throws when total formatter is a boolean', () => {
            expect(() =>
                validateSpec(data, {
                    ...spec,
                    annotations: {
                        labels: { total: { formatter: true } },
                    },
                })
            ).toThrow(
                'spec.annotations.labels.total.formatter must be a string or function'
            );
        });
    });

    describe('annotations.referenceLines', () => {
        test('does not throw when referenceLines is absent', () => {
            expect(() => validateSpec(data, spec)).not.toThrow();
        });

        test('does not throw when referenceLines is an empty array', () => {
            expect(() =>
                validateSpec(data, {
                    ...spec,
                    annotations: { referenceLines: [] },
                })
            ).not.toThrow();
        });

        test('throws when referenceLines is not an array', () => {
            expect(() =>
                validateSpec(data, {
                    ...spec,
                    annotations: { referenceLines: 'bad' },
                })
            ).toThrow('spec.annotations.referenceLines must be an array');
        });

        test('throws when a reference line entry is not a plain object', () => {
            expect(() =>
                validateSpec(data, {
                    ...spec,
                    annotations: { referenceLines: ['not-an-object'] },
                })
            ).toThrow(
                'spec.annotations.referenceLines[0] must be a plain object'
            );
        });

        test('throws when a reference line entry is missing value', () => {
            expect(() =>
                validateSpec(data, {
                    ...spec,
                    annotations: { referenceLines: [{ label: 'x' }] },
                })
            ).toThrow(
                'spec.annotations.referenceLines[0].value is required and must be a finite number'
            );
        });

        test('throws when value is not a finite number', () => {
            expect(() =>
                validateSpec(data, {
                    ...spec,
                    annotations: { referenceLines: [{ value: 'bad' }] },
                })
            ).toThrow(
                'spec.annotations.referenceLines[0].value is required and must be a finite number'
            );
        });

        test('throws when value is Infinity', () => {
            expect(() =>
                validateSpec(data, {
                    ...spec,
                    annotations: { referenceLines: [{ value: Infinity }] },
                })
            ).toThrow(
                'spec.annotations.referenceLines[0].value is required and must be a finite number'
            );
        });

        test('does not throw for a valid entry with only value', () => {
            expect(() =>
                validateSpec(data, {
                    ...spec,
                    annotations: { referenceLines: [{ value: 0.05 }] },
                })
            ).not.toThrow();
        });

        test('throws when label is not a string', () => {
            expect(() =>
                validateSpec(data, {
                    ...spec,
                    annotations: { referenceLines: [{ value: 1, label: 42 }] },
                })
            ).toThrow(
                'spec.annotations.referenceLines[0].label must be a string'
            );
        });

        test('does not throw when label is a string', () => {
            expect(() =>
                validateSpec(data, {
                    ...spec,
                    annotations: {
                        referenceLines: [{ value: 1, label: 'Threshold' }],
                    },
                })
            ).not.toThrow();
        });

        test('does not throw when label is null', () => {
            expect(() =>
                validateSpec(data, {
                    ...spec,
                    annotations: {
                        referenceLines: [{ value: 1, label: null }],
                    },
                })
            ).not.toThrow();
        });

        test('throws when color is not a string', () => {
            expect(() =>
                validateSpec(data, {
                    ...spec,
                    annotations: { referenceLines: [{ value: 1, color: 123 }] },
                })
            ).toThrow(
                'spec.annotations.referenceLines[0].color must be a string'
            );
        });

        test('throws when lineWidth is not a positive number', () => {
            expect(() =>
                validateSpec(data, {
                    ...spec,
                    annotations: {
                        referenceLines: [{ value: 1, lineWidth: 0 }],
                    },
                })
            ).toThrow(
                'spec.annotations.referenceLines[0].lineWidth must be a positive number'
            );
        });

        test('throws when lineDash is not an array', () => {
            expect(() =>
                validateSpec(data, {
                    ...spec,
                    annotations: {
                        referenceLines: [{ value: 1, lineDash: '4 4' }],
                    },
                })
            ).toThrow(
                'spec.annotations.referenceLines[0].lineDash must be an array of non-negative numbers'
            );
        });

        test('throws when lineDash contains non-finite values', () => {
            expect(() =>
                validateSpec(data, {
                    ...spec,
                    annotations: {
                        referenceLines: [{ value: 1, lineDash: [4, Infinity] }],
                    },
                })
            ).toThrow(
                'spec.annotations.referenceLines[0].lineDash must be an array of non-negative numbers'
            );
        });

        test('throws when lineDash contains negative values', () => {
            expect(() =>
                validateSpec(data, {
                    ...spec,
                    annotations: {
                        referenceLines: [{ value: 1, lineDash: [4, -1] }],
                    },
                })
            ).toThrow(
                'spec.annotations.referenceLines[0].lineDash must be an array of non-negative numbers'
            );
        });

        test('throws when lineWidth is NaN', () => {
            expect(() =>
                validateSpec(data, {
                    ...spec,
                    annotations: {
                        referenceLines: [{ value: 1, lineWidth: NaN }],
                    },
                })
            ).toThrow(
                'spec.annotations.referenceLines[0].lineWidth must be a positive number'
            );
        });

        test('throws when lineWidth is Infinity', () => {
            expect(() =>
                validateSpec(data, {
                    ...spec,
                    annotations: {
                        referenceLines: [{ value: 1, lineWidth: Infinity }],
                    },
                })
            ).toThrow(
                'spec.annotations.referenceLines[0].lineWidth must be a positive number'
            );
        });

        test('throws when labelPosition is not a valid value', () => {
            expect(() =>
                validateSpec(data, {
                    ...spec,
                    annotations: {
                        referenceLines: [
                            { value: 1, label: 'x', labelPosition: 'middle' },
                        ],
                    },
                })
            ).toThrow(
                "spec.annotations.referenceLines[0].labelPosition must be 'start', 'center', or 'end'"
            );
        });

        test('does not throw for all valid properties', () => {
            expect(() =>
                validateSpec(data, {
                    ...spec,
                    annotations: {
                        referenceLines: [
                            {
                                value: 0.05,
                                label: 'Upper',
                                color: '#e15759',
                                lineWidth: 2,
                                lineDash: [4, 4],
                                labelPosition: 'end',
                            },
                        ],
                    },
                })
            ).not.toThrow();
        });

        test('validates all entries in the array', () => {
            expect(() =>
                validateSpec(data, {
                    ...spec,
                    annotations: {
                        referenceLines: [{ value: 0.05 }, { value: 'bad' }],
                    },
                })
            ).toThrow(
                'spec.annotations.referenceLines[1].value is required and must be a finite number'
            );
        });
    });

    describe('scales.x.grid validation', () => {
        test('does not throw when scales.x.grid is true', () => {
            expect(() =>
                validateSpec(data, {
                    mapping: { x: 'a', y: 'b' },
                    scales: { x: { grid: true } },
                })
            ).not.toThrow();
        });

        test('does not throw when scales.x.grid is false', () => {
            expect(() =>
                validateSpec(data, {
                    mapping: { x: 'a', y: 'b' },
                    scales: { x: { grid: false } },
                })
            ).not.toThrow();
        });

        test('does not throw when scales.x.grid is absent', () => {
            expect(() =>
                validateSpec(data, { mapping: { x: 'a', y: 'b' } })
            ).not.toThrow();
        });

        test('throws when scales.x.grid is not a boolean', () => {
            expect(() =>
                validateSpec(data, {
                    mapping: { x: 'a', y: 'b' },
                    scales: { x: { grid: 'yes' } },
                })
            ).toThrow('spec.scales.x.grid must be a boolean');
        });

        test('throws when scales.x.grid is a number', () => {
            expect(() =>
                validateSpec(data, {
                    mapping: { x: 'a', y: 'b' },
                    scales: { x: { grid: 1 } },
                })
            ).toThrow('spec.scales.x.grid must be a boolean');
        });
    });

    describe('zoom', () => {
        test('passes when zoom is not specified', () => {
            expect(() => validateSpec(data, spec)).not.toThrow();
        });

        test('passes when zoom is a valid object', () => {
            expect(() =>
                validateSpec(data, {
                    ...spec,
                    zoom: { enabled: true, mode: 'x' },
                })
            ).not.toThrow();
        });

        test('throws when zoom is not an object', () => {
            expect(() => validateSpec(data, { ...spec, zoom: 'yes' })).toThrow(
                'spec.zoom must be a plain object'
            );
        });

        test('throws when zoom is an array', () => {
            expect(() => validateSpec(data, { ...spec, zoom: [true] })).toThrow(
                'spec.zoom must be a plain object'
            );
        });

        test('throws when zoom.mode is invalid', () => {
            expect(() =>
                validateSpec(data, {
                    ...spec,
                    zoom: { enabled: true, mode: 'z' },
                })
            ).toThrow("spec.zoom.mode must be 'x', 'y', or 'xy'");
        });

        test('passes when zoom.mode is "x"', () => {
            expect(() =>
                validateSpec(data, {
                    ...spec,
                    zoom: { enabled: true, mode: 'x' },
                })
            ).not.toThrow();
        });

        test('passes when zoom.mode is "y"', () => {
            expect(() =>
                validateSpec(data, {
                    ...spec,
                    zoom: { enabled: true, mode: 'y' },
                })
            ).not.toThrow();
        });

        test('passes when zoom.mode is "xy"', () => {
            expect(() =>
                validateSpec(data, {
                    ...spec,
                    zoom: { enabled: true, mode: 'xy' },
                })
            ).not.toThrow();
        });

        test('throws when zoom.enabled is not a boolean', () => {
            expect(() =>
                validateSpec(data, {
                    ...spec,
                    zoom: { enabled: 'true' },
                })
            ).toThrow('spec.zoom.enabled must be a boolean');
        });

        test('throws when zoom.pan is not a boolean', () => {
            expect(() =>
                validateSpec(data, {
                    ...spec,
                    zoom: { enabled: true, pan: 'yes' },
                })
            ).toThrow('spec.zoom.pan must be a boolean');
        });

        test('throws when zoom.wheel is not a boolean', () => {
            expect(() =>
                validateSpec(data, {
                    ...spec,
                    zoom: { enabled: true, wheel: 1 },
                })
            ).toThrow('spec.zoom.wheel must be a boolean');
        });

        test('throws when zoom.pinch is not a boolean', () => {
            expect(() =>
                validateSpec(data, {
                    ...spec,
                    zoom: { enabled: true, pinch: null },
                })
            ).toThrow('spec.zoom.pinch must be a boolean');
        });
    });

    describe('spec.stat validation', () => {
        test('does not throw when stat is not provided', () => {
            expect(() =>
                validateSpec(data, { mapping: { x: 'a', y: 'b' } })
            ).not.toThrow();
        });

        test('does not throw with valid stat values', () => {
            for (const stat of ['count', 'identity', 'percent']) {
                expect(() =>
                    validateSpec(data, {
                        mapping: { x: 'a', y: 'b' },
                        stat,
                    })
                ).not.toThrow();
            }
        });

        test('throws when stat is invalid', () => {
            expect(() =>
                validateSpec(data, {
                    mapping: { x: 'a', y: 'b' },
                    stat: 'average',
                })
            ).toThrow(
                "spec.stat must be 'count', 'identity', or 'percent'"
            );
        });

        test('does not throw when stat is combined with any position', () => {
            for (const position of ['stack', 'dodge', 'identity', 'layer']) {
                expect(() =>
                    validateSpec(data, {
                        mapping: { x: 'a', y: 'b' },
                        stat: 'percent',
                        position,
                    })
                ).not.toThrow();
            }
        });
    });
});
