import validateSpec from '../../src/tiles/validateSpec.js';
import { makeData, makeSpec } from './fixtures.js';

describe('tiles/validateSpec', () => {
    test('accepts a valid spec', () => {
        expect(() => validateSpec(makeData(), makeSpec())).not.toThrow();
    });

    test.each([
        [null, {}, 'tiles: data must be an array'],
        [[], null, 'tiles: spec must be a plain object'],
        [[], [], 'tiles: spec must be a plain object'],
        [[], {}, 'tiles: spec.mapping is required'],
        [[], { mapping: { y: 'b' } }, 'tiles: spec.mapping.x is required'],
        [[], { mapping: { x: 'a' } }, 'tiles: spec.mapping.y is required'],
    ])('rejects invalid input %#', (data, spec, message) => {
        expect(() => validateSpec(data, spec)).toThrow(message);
    });

    test('rejects data rows missing mapped fields', () => {
        expect(() =>
            validateSpec([{ a: 1, b: 2 }, { a: 1 }], {
                mapping: { x: 'a', y: 'b' },
            })
        ).toThrow('tiles: data[1] is missing field "b"');
    });

    test('rejects non-array orders and non-object colors', () => {
        const base = { mapping: { x: 'a', y: 'b' } };
        expect(() =>
            validateSpec([], { ...base, scales: { y: { order: 'S1' } } })
        ).toThrow('tiles: spec.scales.y.order must be an array');
        expect(() =>
            validateSpec([], { ...base, scales: { fill: { colors: [] } } })
        ).toThrow('tiles: spec.scales.fill.colors must be an object');
    });

    test('rejects invalid tooltip, callbacks and pageSize', () => {
        const base = { mapping: { x: 'a', y: 'b' } };
        expect(() =>
            validateSpec([], { ...base, tooltip: { formatter: 'x' } })
        ).toThrow('tiles: spec.tooltip.formatter must be a function');
        expect(() =>
            validateSpec([], { ...base, callbacks: { onClick: 1 } })
        ).toThrow('tiles: spec.callbacks.onClick must be a function');
        expect(() =>
            validateSpec([], { ...base, rows: { pageSize: 0 } })
        ).toThrow('tiles: spec.rows.pageSize must be a positive integer');
    });

    test('validates expand data and mapping', () => {
        const spec = makeSpec();
        expect(() =>
            validateSpec(makeData(), {
                ...spec,
                expand: { ...spec.expand, mapping: {} },
            })
        ).toThrow('tiles: spec.expand.mapping.x is required');
        expect(() =>
            validateSpec(makeData(), {
                ...spec,
                expand: { ...spec.expand, data: null },
            })
        ).toThrow('tiles: spec.expand.data must be an array');
        expect(() =>
            validateSpec(makeData(), {
                ...spec,
                expand: { ...spec.expand, data: [{ vital: 'Weight', seq: 1 }] },
            })
        ).toThrow('tiles: spec.expand.data[0] is missing field "subjid"');
    });
});
