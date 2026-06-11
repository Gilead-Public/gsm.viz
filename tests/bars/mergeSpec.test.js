import mergeSpec from '../../src/bars/mergeSpec.js';

const data = [{ cat: 'A', val: 10 }];
const minimalSpec = { mapping: { x: 'cat', y: 'val' } };

describe('bars/mergeSpec', () => {
    test('applies default orientation when not specified', () => {
        const merged = mergeSpec(data, minimalSpec);
        expect(merged.orientation).toBe('vertical');
    });

    test('preserves user-supplied orientation', () => {
        const merged = mergeSpec(data, {
            ...minimalSpec,
            orientation: 'horizontal',
        });
        expect(merged.orientation).toBe('horizontal');
    });

    test('applies default scales', () => {
        const merged = mergeSpec(data, minimalSpec);
        expect(merged.scales.x.type).toBe('category');
        expect(merged.scales.y.type).toBe('linear');
    });

    test('merges user scales with defaults', () => {
        const merged = mergeSpec(data, {
            ...minimalSpec,
            scales: { x: { label: 'Category' } },
        });
        expect(merged.scales.x.label).toBe('Category');
        expect(merged.scales.x.type).toBe('category');
        expect(merged.scales.y.type).toBe('linear');
    });

    test('applies default theme', () => {
        const merged = mergeSpec(data, minimalSpec);
        expect(merged.theme.maintainAspectRatio).toBe(false);
        expect(merged.theme.animation).toBe(false);
    });

    test('merges user theme with defaults', () => {
        const merged = mergeSpec(data, {
            ...minimalSpec,
            theme: { maintainAspectRatio: true },
        });
        expect(merged.theme.maintainAspectRatio).toBe(true);
        expect(merged.theme.animation).toBe(false);
    });

    test('theme.dynamicSizing defaults to false', () => {
        const merged = mergeSpec(data, minimalSpec);
        expect(merged.theme.dynamicSizing).toBe(false);
    });

    test('preserves user-supplied theme.dynamicSizing true', () => {
        const merged = mergeSpec(data, {
            ...minimalSpec,
            theme: { dynamicSizing: true },
        });
        expect(merged.theme.dynamicSizing).toBe(true);
    });

    test('stores the data array on the merged spec', () => {
        const merged = mergeSpec(data, minimalSpec);
        expect(merged.data).toBe(data);
    });

    test('preserves mapping as-is', () => {
        const merged = mergeSpec(data, minimalSpec);
        expect(merged.mapping).toEqual(minimalSpec.mapping);
    });

    test('applies default labels as empty object', () => {
        const merged = mergeSpec(data, minimalSpec);
        expect(merged.labels).toEqual({});
    });

    test('preserves user labels', () => {
        const merged = mergeSpec(data, {
            ...minimalSpec,
            labels: { title: 'My Chart' },
        });
        expect(merged.labels.title).toBe('My Chart');
    });

    test('applies default position of stack', () => {
        const merged = mergeSpec(data, minimalSpec);
        expect(merged.position).toBe('stack');
    });

    test('preserves user-supplied position', () => {
        const merged = mergeSpec(data, { ...minimalSpec, position: 'dodge' });
        expect(merged.position).toBe('dodge');
    });

    test('merges scales.fill when provided', () => {
        const merged = mergeSpec(data, {
            ...minimalSpec,
            scales: { fill: { palette: ['#ff0000'] } },
        });
        expect(merged.scales.fill.palette).toEqual(['#ff0000']);
    });

    test('defaults scales.fill to include the default palette', () => {
        const merged = mergeSpec(data, minimalSpec);
        expect(Array.isArray(merged.scales.fill.palette)).toBe(true);
        expect(merged.scales.fill.palette.length).toBeGreaterThan(0);
    });

    test('passes scales.fill.colors through when provided', () => {
        const colors = { Red: '#ff0000', Green: '#00ff00' };
        const merged = mergeSpec(data, {
            ...minimalSpec,
            scales: { fill: { colors } },
        });
        expect(merged.scales.fill.colors).toEqual(colors);
    });

    test('scales.fill.colors is undefined by default', () => {
        const merged = mergeSpec(data, minimalSpec);
        expect(merged.scales.fill.colors).toBeUndefined();
    });

    describe('tooltip', () => {
        test('defaults tooltip to empty object when not specified', () => {
            const merged = mergeSpec(data, minimalSpec);
            expect(merged.tooltip).toEqual({});
        });

        test('passes through tooltip callbacks from spec', () => {
            const myCallback = () => [];
            const merged = mergeSpec(data, {
                ...minimalSpec,
                tooltip: { callbacks: { afterLabel: myCallback } },
            });
            expect(merged.tooltip.callbacks.afterLabel).toBe(myCallback);
        });

        test('preserves tooltip.callbacks when provided', () => {
            const callbacks = { label: jest.fn(), afterLabel: jest.fn() };
            const merged = mergeSpec(data, {
                ...minimalSpec,
                tooltip: { callbacks },
            });
            expect(merged.tooltip.callbacks).toBe(callbacks);
        });
    });

    describe('annotations', () => {
        test('defaults labels to disabled modes', () => {
            const merged = mergeSpec(data, minimalSpec);
            expect(merged.annotations.labels.segment.display).toBe(false);
            expect(merged.annotations.labels.segment.value).toBe('auto');
            expect(merged.annotations.labels.segment.minSize).toBe(16);
            expect(merged.annotations.labels.segment.placement).toBe('center');
            expect(merged.annotations.labels.total.display).toBe(false);
            expect(merged.annotations.labels.total.placement).toBe('outside');
        });

        test('deep merges user label modes with defaults', () => {
            const formatter = jest.fn();
            const merged = mergeSpec(data, {
                ...minimalSpec,
                annotations: {
                    labels: {
                        segment: {
                            display: true,
                            color: '#111111',
                            formatter,
                        },
                        total: {
                            display: true,
                            font: { weight: 'bold' },
                        },
                    },
                },
            });

            expect(merged.annotations.labels.segment.display).toBe(true);
            expect(merged.annotations.labels.segment.value).toBe('auto');
            expect(merged.annotations.labels.segment.color).toBe('#111111');
            expect(merged.annotations.labels.segment.formatter).toBe(formatter);
            expect(merged.annotations.labels.total.display).toBe(true);
            expect(merged.annotations.labels.total.font).toEqual({
                weight: 'bold',
            });
        });

        test('deep merges user total placement with defaults', () => {
            const merged = mergeSpec(data, {
                ...minimalSpec,
                annotations: {
                    labels: {
                        total: { display: true, placement: 'inside', color: '#ffffff' },
                    },
                },
            });

            expect(merged.annotations.labels.total.display).toBe(true);
            expect(merged.annotations.labels.total.placement).toBe('inside');
            expect(merged.annotations.labels.total.color).toBe('#ffffff');
            // other modes unaffected
            expect(merged.annotations.labels.segment.display).toBe(false);
        });
    });
});
