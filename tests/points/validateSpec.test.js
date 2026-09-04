import validateSpec from '../../src/points/validateSpec.js';

const data = [{ xValue: 1, yValue: 2, id: 'A' }];
const minimalSpec = {
    mapping: { x: 'xValue', y: 'yValue' },
};

describe('points/validateSpec', () => {
    test('accepts a valid minimal spec with empty data', () => {
        expect(() => validateSpec([], minimalSpec)).not.toThrow();
    });

    test('accepts all implemented fields', () => {
        expect(() =>
            validateSpec(data, {
                mapping: {
                    x: 'xValue',
                    y: 'yValue',
                    key: 'id',
                    color: 'group',
                    size: 'participants',
                    opacity: 'intensity',
                },
                scales: {
                    x: { type: 'linear', label: 'X axis' },
                    y: { type: 'linear', label: 'Y axis' },
                    color: {
                        colors: { Control: '#4e79a7' },
                        palette: ['#4e79a7', '#f28e2b'],
                        order: ['Control', 'Treatment'],
                        label: 'Arm',
                    },
                    size: { range: [3, 12] },
                    opacity: { range: [0.25, 1] },
                },
                labels: {
                    title: 'Example',
                    caption: 'Source',
                    description: 'A point chart',
                },
                tooltip: {
                    format: '{id}',
                    formatter: () => 'A',
                },
                callbacks: {
                    onClick: () => {},
                    onHover: null,
                    onSelect: () => {},
                },
                selection: {
                    enabled: true,
                    opacity: 0.4,
                    multiple: false,
                },
                theme: {
                    maintainAspectRatio: true,
                    animation: false,
                },
            })
        ).not.toThrow();
    });

    test.each([
        [undefined, 'data is required'],
        [null, 'data is required'],
        ['not-an-array', 'data must be an array'],
        [{}, 'data must be an array'],
    ])('rejects invalid data %#', (value, message) => {
        expect(() => validateSpec(value, minimalSpec)).toThrow(message);
    });

    test.each([
        [undefined, 'spec is required'],
        [null, 'spec is required'],
        [[], 'spec must be a plain object'],
        ['invalid', 'spec must be a plain object'],
        [new Date(), 'spec must be a plain object'],
    ])('rejects invalid spec %#', (value, message) => {
        expect(() => validateSpec(data, value)).toThrow(message);
    });

    test('accepts null-prototype plain objects', () => {
        const mapping = Object.assign(Object.create(null), {
            x: 'xValue',
            y: 'yValue',
        });
        const spec = Object.assign(Object.create(null), { mapping });

        expect(() => validateSpec(data, spec)).not.toThrow();
    });

    describe('mapping', () => {
        test.each([
            [{}, 'spec.mapping is required'],
            [{ mapping: null }, 'spec.mapping is required'],
            [{ mapping: [] }, 'spec.mapping must be a plain object'],
            [
                { mapping: new (class Mapping {})() },
                'spec.mapping must be a plain object',
            ],
        ])('rejects invalid mapping %#', (spec, message) => {
            expect(() => validateSpec(data, spec)).toThrow(message);
        });

        test.each([
            [{ mapping: { y: 'yValue' } }, 'spec.mapping.x is required'],
            [{ mapping: { x: 'xValue' } }, 'spec.mapping.y is required'],
            [
                { mapping: { x: '', y: 'yValue' } },
                'spec.mapping.x must be a non-empty string',
            ],
            [
                { mapping: { x: 'xValue', y: '   ' } },
                'spec.mapping.y must be a non-empty string',
            ],
            [
                { mapping: { x: 1, y: 'yValue' } },
                'spec.mapping.x must be a non-empty string',
            ],
            [
                { mapping: { x: 'xValue', y: 'yValue', key: null } },
                'spec.mapping.key must be a non-empty string',
            ],
            [
                { mapping: { x: 'xValue', y: 'yValue', key: '' } },
                'spec.mapping.key must be a non-empty string',
            ],
        ])('rejects invalid field mappings %#', (spec, message) => {
            expect(() => validateSpec(data, spec)).toThrow(message);
        });
    });

    describe('scales', () => {
        test.each([
            [null, 'spec.scales must be a plain object'],
            [[], 'spec.scales must be a plain object'],
            ['linear', 'spec.scales must be a plain object'],
        ])('rejects an invalid scales namespace %#', (scales, message) => {
            expect(() =>
                validateSpec(data, { ...minimalSpec, scales })
            ).toThrow(message);
        });

        test.each(['x', 'y'])(
            'validates the %s scale independently',
            (axis) => {
                expect(() =>
                    validateSpec(data, {
                        ...minimalSpec,
                        scales: { [axis]: [] },
                    })
                ).toThrow(`spec.scales.${axis} must be a plain object`);

                expect(() =>
                    validateSpec(data, {
                        ...minimalSpec,
                        scales: { [axis]: { type: 'category' } },
                    })
                ).toThrow(`spec.scales.${axis}.type must be 'linear' or 'log'`);

                expect(() =>
                    validateSpec(data, {
                        ...minimalSpec,
                        scales: { [axis]: { label: 42 } },
                    })
                ).toThrow(`spec.scales.${axis}.label must be a string`);
            }
        );

        test.each(['x', 'y'])(
            'accepts complete numeric options for the %s scale',
            (axis) => {
                expect(() =>
                    validateSpec(data, {
                        ...minimalSpec,
                        scales: {
                            [axis]: {
                                type: 'log',
                                label: 'Axis',
                                range: [1, 100],
                                beginAtZero: false,
                                breaks: [1, 10, 100],
                                labels: ['One', 'Ten', 'One hundred'],
                            },
                        },
                    })
                ).not.toThrow();
            }
        );

        test.each([
            [{ range: [] }, 'range must contain two finite numbers'],
            [{ range: [0] }, 'range must contain two finite numbers'],
            [{ range: [0, Infinity] }, 'range must contain two finite numbers'],
            [{ range: [2, 1] }, 'range values must be strictly increasing'],
            [{ beginAtZero: 'yes' }, 'beginAtZero must be a boolean'],
            [{ breaks: '1,2' }, 'breaks must be an array'],
            [{ labels: 'One,Two' }, 'labels must be an array'],
            [
                { breaks: [1, Infinity], labels: ['One', 'Infinity'] },
                'breaks[1] must be a finite number',
            ],
            [
                { breaks: [2, 1], labels: ['Two', 'One'] },
                'breaks must be strictly increasing',
            ],
            [
                { breaks: [1, 1], labels: ['One', 'One again'] },
                'breaks must be strictly increasing',
            ],
            [
                { breaks: [1], labels: [null] },
                'labels[0] must be a string or finite number',
            ],
            [
                { breaks: [1], labels: [] },
                'breaks and labels must have the same length',
            ],
        ])('rejects invalid numeric axis option %#', (axisSpec, suffix) => {
            expect(() =>
                validateSpec(data, {
                    ...minimalSpec,
                    scales: { x: axisSpec },
                })
            ).toThrow(`spec.scales.x.${suffix}`);
        });

        test.each([
            [
                { type: 'log', beginAtZero: true },
                'beginAtZero cannot be true for a log scale',
            ],
            [
                { type: 'log', range: [0, 100] },
                'range values must be greater than zero for a log scale',
            ],
            [
                {
                    type: 'log',
                    breaks: [0, 1],
                    labels: ['Zero', 'One'],
                },
                'breaks[0] must be greater than zero for a log scale',
            ],
        ])('rejects incompatible log option %#', (axisSpec, suffix) => {
            expect(() =>
                validateSpec(data, {
                    ...minimalSpec,
                    scales: { x: axisSpec },
                })
            ).toThrow(`spec.scales.x.${suffix}`);
        });
    });

    describe('categorical color', () => {
        test('accepts null labels and missing or finite order values', () => {
            const colors = Object.assign(Object.create(null), {
                1: '#4e79a7',
            });

            expect(() =>
                validateSpec(data, {
                    mapping: {
                        x: 'xValue',
                        y: 'yValue',
                        color: 'group',
                    },
                    scales: {
                        color: {
                            colors,
                            palette: ['#f28e2b'],
                            order: [1, 'Other', null],
                            label: null,
                        },
                    },
                })
            ).not.toThrow();
        });

        test.each([null, '', 42, true])(
            'rejects invalid mapping.color value %p',
            (color) => {
                expect(() =>
                    validateSpec(data, {
                        mapping: { x: 'xValue', y: 'yValue', color },
                    })
                ).toThrow('spec.mapping.color must be a non-empty string');
            }
        );

        test.each([
            [
                'non-object scale',
                [],
                'spec.scales.color must be a plain object',
            ],
            [
                'unsupported field',
                { unknown: true },
                'spec.scales.color.unknown is not supported',
            ],
            [
                'non-object colors',
                { colors: [] },
                'spec.scales.color.colors must be a plain object',
            ],
            [
                'invalid named color',
                { colors: { A: '' } },
                'spec.scales.color.colors.A must be a non-empty string',
            ],
            [
                'non-array palette',
                { palette: '#4e79a7' },
                'spec.scales.color.palette must be a non-empty array',
            ],
            [
                'empty palette',
                { palette: [] },
                'spec.scales.color.palette must be a non-empty array',
            ],
            [
                'invalid palette color',
                { palette: ['#4e79a7', null] },
                'spec.scales.color.palette[1] must be a non-empty string',
            ],
            [
                'non-array order',
                { order: 'A' },
                'spec.scales.color.order must be an array',
            ],
            [
                'invalid order value',
                { order: ['A', Infinity] },
                'spec.scales.color.order[1] must be a string, finite number, or null',
            ],
            [
                'duplicate order value',
                { order: ['A', 'A'] },
                'spec.scales.color.order must contain unique values',
            ],
            [
                'invalid label',
                { label: 42 },
                'spec.scales.color.label must be a string or null',
            ],
        ])('rejects %s', (_case, colorScale, message) => {
            expect(() =>
                validateSpec(data, {
                    mapping: {
                        x: 'xValue',
                        y: 'yValue',
                        color: 'group',
                    },
                    scales: { color: colorScale },
                })
            ).toThrow(message);
        });
    });

    describe('labels and tooltip', () => {
        test.each([
            ['labels', null],
            ['labels', []],
            ['tooltip', null],
            ['tooltip', []],
        ])('requires spec.%s to be a plain object', (field, value) => {
            expect(() =>
                validateSpec(data, { ...minimalSpec, [field]: value })
            ).toThrow(`spec.${field} must be a plain object`);
        });

        test.each(['title', 'caption', 'description'])(
            'requires labels.%s to be a string',
            (field) => {
                expect(() =>
                    validateSpec(data, {
                        ...minimalSpec,
                        labels: { [field]: 42 },
                    })
                ).toThrow(`spec.labels.${field} must be a string`);
            }
        );

        test('validates tooltip format and formatter', () => {
            expect(() =>
                validateSpec(data, {
                    ...minimalSpec,
                    tooltip: { format: 42 },
                })
            ).toThrow('spec.tooltip.format must be a string');

            expect(() =>
                validateSpec(data, {
                    ...minimalSpec,
                    tooltip: { formatter: 'not-a-function' },
                })
            ).toThrow('spec.tooltip.formatter must be a function or null');

            expect(() =>
                validateSpec(data, {
                    ...minimalSpec,
                    tooltip: { formatter: null },
                })
            ).not.toThrow();
        });

        test('accepts supported Chart.js tooltip options and callbacks', () => {
            expect(() =>
                validateSpec(data, {
                    ...minimalSpec,
                    tooltip: {
                        enabled: false,
                        mode: 'nearest',
                        intersect: false,
                        position: 'average',
                        backgroundColor: '#112233',
                        callbacks: {
                            title: () => 'Title',
                            label: () => 'Label',
                        },
                    },
                })
            ).not.toThrow();
        });

        test.each([null, [], 'invalid'])(
            'rejects invalid tooltip callbacks %p',
            (callbacks) => {
                expect(() =>
                    validateSpec(data, {
                        ...minimalSpec,
                        tooltip: { callbacks },
                    })
                ).toThrow('spec.tooltip.callbacks must be a plain object');
            }
        );

        test('rejects a non-function tooltip callback', () => {
            expect(() =>
                validateSpec(data, {
                    ...minimalSpec,
                    tooltip: {
                        callbacks: { label: 'invalid' },
                    },
                })
            ).toThrow(
                'spec.tooltip.callbacks.label must be a function or null'
            );
        });

        test('rejects an unknown tooltip format placeholder before rendering', () => {
            expect(() =>
                validateSpec(data, {
                    ...minimalSpec,
                    tooltip: { format: '{unknown}' },
                })
            ).toThrow(
                'spec.tooltip.format placeholder "{unknown}" is not available in data[0]'
            );
        });

        test('accepts structured, qualified, and source-row placeholders', () => {
            expect(() =>
                validateSpec(data, {
                    mapping: {
                        ...minimalSpec.mapping,
                        color: 'group',
                    },
                    tooltip: {
                        format: '{x}, {y}, {key}, {color}, {id}, {datum.id}, {_datum.id}',
                    },
                })
            ).not.toThrow();
        });

        test.each(['color', '_color'])(
            'rejects {%s} without a color mapping',
            (field) => {
                expect(() =>
                    validateSpec(data, {
                        ...minimalSpec,
                        tooltip: { format: `{${field}}` },
                    })
                ).toThrow(
                    `spec.tooltip.format placeholder "{${field}}" requires spec.mapping.color`
                );
            }
        );
    });

    describe('callbacks', () => {
        test.each([null, [], 'invalid'])(
            'rejects a non-object callbacks namespace %#',
            (callbacks) => {
                expect(() =>
                    validateSpec(data, { ...minimalSpec, callbacks })
                ).toThrow('spec.callbacks must be a plain object');
            }
        );

        test.each(['onClick', 'onHover', 'onSelect'])(
            'requires callbacks.%s to be a function or null',
            (field) => {
                expect(() =>
                    validateSpec(data, {
                        ...minimalSpec,
                        callbacks: { [field]: true },
                    })
                ).toThrow(`spec.callbacks.${field} must be a function or null`);

                expect(() =>
                    validateSpec(data, {
                        ...minimalSpec,
                        callbacks: { [field]: null },
                    })
                ).not.toThrow();
            }
        );
    });

    describe('selection', () => {
        test.each([null, [], 'invalid'])(
            'rejects a non-object selection namespace %#',
            (selection) => {
                expect(() =>
                    validateSpec(data, { ...minimalSpec, selection })
                ).toThrow('spec.selection must be a plain object');
            }
        );

        test.each(['enabled', 'multiple'])(
            'requires selection.%s to be a boolean',
            (field) => {
                expect(() =>
                    validateSpec(data, {
                        ...minimalSpec,
                        selection: { [field]: 1 },
                    })
                ).toThrow(`spec.selection.${field} must be a boolean`);
            }
        );

        test.each([-0.1, 1.1, Infinity, '0.5'])(
            'rejects invalid selection opacity %#',
            (opacity) => {
                expect(() =>
                    validateSpec(data, {
                        ...minimalSpec,
                        selection: { opacity },
                    })
                ).toThrow(
                    'spec.selection.opacity must be a finite number between 0 and 1'
                );
            }
        );
    });

    describe('theme', () => {
        test.each([null, [], 'invalid'])(
            'rejects a non-object theme namespace %#',
            (theme) => {
                expect(() =>
                    validateSpec(data, { ...minimalSpec, theme })
                ).toThrow('spec.theme must be a plain object');
            }
        );

        test.each(['maintainAspectRatio', 'animation'])(
            'requires theme.%s to be a boolean',
            (field) => {
                expect(() =>
                    validateSpec(data, {
                        ...minimalSpec,
                        theme: { [field]: 1 },
                    })
                ).toThrow(`spec.theme.${field} must be a boolean`);
            }
        );
    });

    test.each([
        [
            { ...minimalSpec, unsupported: true },
            'spec.unsupported is not supported',
        ],
        [
            { ...minimalSpec, labels: { captions: [] } },
            'spec.labels.captions is not supported',
        ],
        [
            {
                ...minimalSpec,
                tooltip: { callbacks: { unknown: () => {} } },
            },
            'spec.tooltip.callbacks.unknown is not supported',
        ],
        [
            { ...minimalSpec, callbacks: { afterClick: () => {} } },
            'spec.callbacks.afterClick is not supported',
        ],
        [
            { ...minimalSpec, selection: { toggle: true } },
            'spec.selection.toggle is not supported',
        ],
        [
            { ...minimalSpec, theme: { responsive: true } },
            'spec.theme.responsive is not supported',
        ],
    ])('rejects unsupported fields %#', (spec, message) => {
        expect(() => validateSpec(data, spec)).toThrow(message);
    });
});
