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
            "spec.position must be 'stack', 'dodge', 'identity', or 'fill'"
        );
    });

    test('does not throw with valid position values', () => {
        for (const position of ['stack', 'dodge', 'identity', 'fill']) {
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
});
