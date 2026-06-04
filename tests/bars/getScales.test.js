import getScales from '../../src/bars/getScales.js';

describe('bars/getScales', () => {
    describe('vertical orientation', () => {
        const spec = {
            orientation: 'vertical',
            mapping: { x: 'category', y: 'value' },
            scales: {
                x: { type: 'category', label: 'Site' },
                y: { type: 'linear', label: 'Score' },
            },
        };

        test('maps x to horizontal axis and y to vertical axis', () => {
            const scales = getScales(spec);
            expect(scales.x.type).toBe('category');
            expect(scales.y.type).toBe('linear');
        });

        test('applies axis labels', () => {
            const scales = getScales(spec);
            expect(scales.x.title.text).toBe('Site');
            expect(scales.y.title.text).toBe('Score');
        });

        test('displays axis titles when labels are provided', () => {
            const scales = getScales(spec);
            expect(scales.x.title.display).toBe(true);
            expect(scales.y.title.display).toBe(true);
        });
    });

    describe('horizontal orientation', () => {
        const spec = {
            orientation: 'horizontal',
            mapping: { x: 'category', y: 'value' },
            scales: {
                x: { type: 'category', label: 'Site' },
                y: { type: 'linear', label: 'Score' },
            },
        };

        test('flips axes: x mapping goes to y axis, y mapping goes to x axis', () => {
            const scales = getScales(spec);
            expect(scales.y.type).toBe('category');
            expect(scales.x.type).toBe('linear');
        });

        test('flips labels accordingly', () => {
            const scales = getScales(spec);
            expect(scales.y.title.text).toBe('Site');
            expect(scales.x.title.text).toBe('Score');
        });
    });

    describe('null labels', () => {
        test('does not display axis title when label is null', () => {
            const spec = {
                orientation: 'vertical',
                mapping: { x: 'category', y: 'value' },
                scales: {
                    x: { type: 'category', label: null },
                    y: { type: 'linear', label: null },
                },
            };
            const scales = getScales(spec);
            expect(scales.x.title.display).toBe(false);
            expect(scales.y.title.display).toBe(false);
        });

        test('does not display axis title when label is empty string', () => {
            const spec = {
                orientation: 'vertical',
                mapping: { x: 'category', y: 'value' },
                scales: {
                    x: { type: 'category', label: '' },
                    y: { type: 'linear', label: '' },
                },
            };
            const scales = getScales(spec);
            expect(scales.x.title.display).toBe(false);
            expect(scales.y.title.display).toBe(false);
        });
    });

    describe('default labels from mapping', () => {
        test('uses mapping.x as x-axis label when scales.x.label is undefined', () => {
            const spec = {
                orientation: 'vertical',
                mapping: { x: 'category', y: 'value' },
                scales: {
                    x: { type: 'category' },
                    y: { type: 'linear' },
                },
            };
            const scales = getScales(spec);
            expect(scales.x.title.text).toBe('category');
            expect(scales.x.title.display).toBe(true);
        });

        test('uses mapping.y as y-axis label when scales.y.label is undefined', () => {
            const spec = {
                orientation: 'vertical',
                mapping: { x: 'category', y: 'value' },
                scales: {
                    x: { type: 'category' },
                    y: { type: 'linear' },
                },
            };
            const scales = getScales(spec);
            expect(scales.y.title.text).toBe('value');
            expect(scales.y.title.display).toBe(true);
        });

        test('explicit label overrides mapping default', () => {
            const spec = {
                orientation: 'vertical',
                mapping: { x: 'category', y: 'value' },
                scales: {
                    x: { type: 'category', label: 'Site' },
                    y: { type: 'linear', label: 'Score' },
                },
            };
            const scales = getScales(spec);
            expect(scales.x.title.text).toBe('Site');
            expect(scales.y.title.text).toBe('Score');
        });

        test('no default label when mapping.y is absent (count mode)', () => {
            const spec = {
                orientation: 'vertical',
                mapping: { x: 'category' },
                scales: {
                    x: { type: 'category' },
                    y: { type: 'linear' },
                },
            };
            const scales = getScales(spec);
            expect(scales.y.title.display).toBe(false);
        });
    });

    describe('indexAxis', () => {
        test('returns indexAxis "x" for vertical', () => {
            const spec = {
                orientation: 'vertical',
                scales: {
                    x: { type: 'category' },
                    y: { type: 'linear' },
                },
            };
            const result = getScales(spec);
            expect(result._indexAxis).toBe('x');
        });

        test('returns indexAxis "y" for horizontal', () => {
            const spec = {
                orientation: 'horizontal',
                scales: {
                    x: { type: 'category' },
                    y: { type: 'linear' },
                },
            };
            const result = getScales(spec);
            expect(result._indexAxis).toBe('y');
        });
    });

    describe('position / stacking', () => {
        test('sets stacked: true on both axes when position is stack', () => {
            const spec = {
                orientation: 'vertical',
                position: 'stack',
                scales: {
                    x: { type: 'category' },
                    y: { type: 'linear' },
                },
            };
            const scales = getScales(spec);
            expect(scales.x.stacked).toBe(true);
            expect(scales.y.stacked).toBe(true);
        });

        test('does not set stacked when position is dodge', () => {
            const spec = {
                orientation: 'vertical',
                position: 'dodge',
                scales: {
                    x: { type: 'category' },
                    y: { type: 'linear' },
                },
            };
            const scales = getScales(spec);
            expect(scales.x.stacked).toBeUndefined();
            expect(scales.y.stacked).toBeUndefined();
        });

        test('does not set stacked when position is identity', () => {
            const spec = {
                orientation: 'vertical',
                position: 'identity',
                scales: {
                    x: { type: 'category' },
                    y: { type: 'linear' },
                },
            };
            const scales = getScales(spec);
            expect(scales.x.stacked).toBeUndefined();
            expect(scales.y.stacked).toBeUndefined();
        });

        test('stacking works with horizontal orientation', () => {
            const spec = {
                orientation: 'horizontal',
                position: 'stack',
                scales: {
                    x: { type: 'category' },
                    y: { type: 'linear' },
                },
            };
            const scales = getScales(spec);
            expect(scales.x.stacked).toBe(true);
            expect(scales.y.stacked).toBe(true);
        });
    });
});
