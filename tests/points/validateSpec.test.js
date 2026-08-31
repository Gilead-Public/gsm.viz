import validateSpec from '../../src/points/validateSpec.js';

const data = [{ xValue: 1, yValue: 2, id: 'A' }];
const minimalSpec = {
    mapping: { x: 'xValue', y: 'yValue' },
};

describe('points/validateSpec', () => {
    test('accepts a valid minimal spec with empty data', () => {
        expect(() => validateSpec([], minimalSpec)).not.toThrow();
    });

    test('accepts all fields implemented by the initial contract', () => {
        expect(() =>
            validateSpec(data, {
                mapping: { x: 'xValue', y: 'yValue', key: 'id' },
                scales: {
                    x: { type: 'linear', label: 'X axis' },
                    y: { type: 'linear', label: 'Y axis' },
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
                        scales: { [axis]: { type: 'log' } },
                    })
                ).toThrow(`spec.scales.${axis}.type must be 'linear'`);

                expect(() =>
                    validateSpec(data, {
                        ...minimalSpec,
                        scales: { [axis]: { label: 42 } },
                    })
                ).toThrow(`spec.scales.${axis}.label must be a string`);
            }
        );
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
            {
                mapping: {
                    ...minimalSpec.mapping,
                    color: 'group',
                },
            },
            'spec.mapping.color is not supported',
        ],
        [
            { ...minimalSpec, scales: { color: {} } },
            'spec.scales.color is not supported',
        ],
        [
            { ...minimalSpec, scales: { x: { range: [0, 1] } } },
            'spec.scales.x.range is not supported',
        ],
        [
            { ...minimalSpec, labels: { captions: [] } },
            'spec.labels.captions is not supported',
        ],
        [
            { ...minimalSpec, tooltip: { callbacks: {} } },
            'spec.tooltip.callbacks is not supported',
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
