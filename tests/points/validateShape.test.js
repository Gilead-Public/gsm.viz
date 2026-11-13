import validateSpec from '../../src/points/validateSpec.js';

const data = [{ x: 1, y: 2, marker: 'Observed' }];
const mapping = { x: 'x', y: 'y', shape: 'marker' };

describe('points shape validation', () => {
    test('accepts named values, order, and a nullable label', () => {
        expect(() =>
            validateSpec(data, {
                mapping,
                scales: {
                    shape: {
                        values: {
                            Observed: 'circle',
                            Expected: 'triangle',
                        },
                        order: ['Expected', 'Observed', 3, null],
                        label: null,
                    },
                },
            })
        ).not.toThrow();
    });

    test.each([null, '', 42, true])(
        'rejects invalid mapping.shape value %p',
        (shape) => {
            expect(() =>
                validateSpec(data, {
                    mapping: { x: 'x', y: 'y', shape },
                })
            ).toThrow('spec.mapping.shape must be a non-empty string');
        }
    );

    test.each([
        [[], 'spec.scales.shape must be a plain object'],
        [{ unknown: true }, 'spec.scales.shape.unknown is not supported'],
        [{ values: [] }, 'spec.scales.shape.values must be a plain object'],
        [
            { values: { A: 'hexagon' } },
            'spec.scales.shape.values.A must be a supported point style',
        ],
        [{ order: 'A' }, 'spec.scales.shape.order must be an array'],
        [
            { order: ['A', {}] },
            'spec.scales.shape.order[1] must be a string, finite number, or null',
        ],
        [
            { order: ['A', 'A'] },
            'spec.scales.shape.order must contain unique values',
        ],
        [{ label: 42 }, 'spec.scales.shape.label must be a string or null'],
    ])('rejects invalid shape scale %#', (shape, message) => {
        expect(() =>
            validateSpec(data, {
                mapping,
                scales: { shape },
            })
        ).toThrow(message);
    });

    test.each([
        'circle',
        'cross',
        'crossRot',
        'dash',
        'line',
        'rect',
        'rectRounded',
        'rectRot',
        'star',
        'triangle',
    ])('accepts the supported %s point style', (pointStyle) => {
        expect(() =>
            validateSpec(data, {
                mapping,
                scales: {
                    shape: { values: { Observed: pointStyle } },
                },
            })
        ).not.toThrow();
    });
});
