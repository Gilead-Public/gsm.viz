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

        test('does not set stacked when position is layer', () => {
            const spec = {
                orientation: 'vertical',
                position: 'layer',
                scales: {
                    x: { type: 'category' },
                    y: { type: 'linear' },
                },
            };
            const scales = getScales(spec);
            expect(scales.x.stacked).toBeUndefined();
            expect(scales.y.stacked).toBeUndefined();
        });

        test('layer does not set stacked in horizontal orientation', () => {
            const spec = {
                orientation: 'horizontal',
                position: 'layer',
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

    describe("position='fill'", () => {
        const baseSpec = {
            orientation: 'vertical',
            position: 'fill',
            scales: {
                x: { type: 'category' },
                y: { type: 'linear' },
            },
        };

        test('sets stacked: true on both axes', () => {
            const scales = getScales(baseSpec);
            expect(scales.x.stacked).toBe(true);
            expect(scales.y.stacked).toBe(true);
        });

        test('sets max: 100 on value axis (y) for vertical orientation', () => {
            const scales = getScales(baseSpec);
            expect(scales.y.max).toBe(100);
        });

        test('does not set max on category axis (x) for vertical orientation', () => {
            const scales = getScales(baseSpec);
            expect(scales.x.max).toBeUndefined();
        });

        test('provides a ticks.callback that formats numbers as percentages', () => {
            const scales = getScales(baseSpec);
            const callback = scales.y.ticks?.callback;
            expect(typeof callback).toBe('function');
            expect(callback(50)).toBe('50%');
            expect(callback(0)).toBe('0%');
            expect(callback(100)).toBe('100%');
        });

        test('sets max: 100 on value axis (x) for horizontal orientation', () => {
            const horizontalSpec = { ...baseSpec, orientation: 'horizontal' };
            const scales = getScales(horizontalSpec);
            expect(scales.x.max).toBe(100);
            expect(scales.y.max).toBeUndefined();
        });

        test('provides ticks.callback on value axis (x) for horizontal orientation', () => {
            const horizontalSpec = { ...baseSpec, orientation: 'horizontal' };
            const scales = getScales(horizontalSpec);
            const callback = scales.x.ticks?.callback;
            expect(typeof callback).toBe('function');
            expect(callback(25)).toBe('25%');
        });

        test('non-fill positions do not set max on value axis', () => {
            for (const position of ['stack', 'dodge', 'identity']) {
                const spec = {
                    orientation: 'vertical',
                    position,
                    scales: {
                        x: { type: 'category' },
                        y: { type: 'linear' },
                    },
                };
                const scales = getScales(spec);
                expect(scales.y.max).toBeUndefined();
            }
        });
    });

    describe('categoryAxis grid lines', () => {
        test('disables grid on category axis (x) by default for vertical orientation', () => {
            const spec = {
                orientation: 'vertical',
                scales: { x: { type: 'category' }, y: { type: 'linear' } },
            };
            const scales = getScales(spec);
            expect(scales.x.grid?.display).toBe(false);
        });

        test('disables grid on category axis (y) by default for horizontal orientation', () => {
            const spec = {
                orientation: 'horizontal',
                scales: { x: { type: 'category' }, y: { type: 'linear' } },
            };
            const scales = getScales(spec);
            expect(scales.y.grid?.display).toBe(false);
        });

        test('enables grid on category axis (x) when scales.x.grid is true for vertical', () => {
            const spec = {
                orientation: 'vertical',
                scales: {
                    x: { type: 'category', grid: true },
                    y: { type: 'linear' },
                },
            };
            const scales = getScales(spec);
            expect(scales.x.grid?.display).toBe(true);
        });

        test('enables grid on category axis (y) when scales.x.grid is true for horizontal', () => {
            const spec = {
                orientation: 'horizontal',
                scales: {
                    x: { type: 'category', grid: true },
                    y: { type: 'linear' },
                },
            };
            const scales = getScales(spec);
            expect(scales.y.grid?.display).toBe(true);
        });

        test('does not affect the value axis grid', () => {
            const spec = {
                orientation: 'vertical',
                scales: {
                    x: { type: 'category', grid: true },
                    y: { type: 'linear' },
                },
            };
            const scales = getScales(spec);
            expect(scales.y.grid).toBeUndefined();
        });
    });

    describe('dynamicSizing / autoSkip', () => {
        test('sets autoSkip false on category (x) axis for vertical when dynamicSizing is true', () => {
            const spec = {
                orientation: 'vertical',
                scales: { x: { type: 'category' }, y: { type: 'linear' } },
                theme: { dynamicSizing: true },
            };
            const scales = getScales(spec);
            expect(scales.x.ticks?.autoSkip).toBe(false);
        });

        test('sets autoSkip false on category (y) axis for horizontal when dynamicSizing is true', () => {
            const spec = {
                orientation: 'horizontal',
                scales: { x: { type: 'category' }, y: { type: 'linear' } },
                theme: { dynamicSizing: true },
            };
            const scales = getScales(spec);
            expect(scales.y.ticks?.autoSkip).toBe(false);
        });

        test('does not set autoSkip when dynamicSizing is false', () => {
            const spec = {
                orientation: 'vertical',
                scales: { x: { type: 'category' }, y: { type: 'linear' } },
                theme: { dynamicSizing: false },
            };
            const scales = getScales(spec);
            expect(scales.x.ticks?.autoSkip).toBeUndefined();
        });

        test('does not set autoSkip when theme is absent', () => {
            const spec = {
                orientation: 'vertical',
                scales: { x: { type: 'category' }, y: { type: 'linear' } },
            };
            const scales = getScales(spec);
            expect(scales.x.ticks?.autoSkip).toBeUndefined();
        });
    });

    describe('tick truncation (maxLength)', () => {
        test('provides a ticks.callback when maxLength is set', () => {
            const spec = {
                orientation: 'vertical',
                scales: {
                    x: { type: 'category', ticks: { maxLength: 8 } },
                    y: { type: 'linear' },
                },
            };
            const scales = getScales(spec);
            expect(typeof scales.x.ticks?.callback).toBe('function');
        });

        test('ticks.callback truncates long labels', () => {
            const spec = {
                orientation: 'vertical',
                scales: {
                    x: { type: 'category', ticks: { maxLength: 5 } },
                    y: { type: 'linear' },
                },
            };
            const scales = getScales(spec);
            const ctx = { getLabelForValue: () => 'LongLabel' };
            const result = scales.x.ticks.callback.call(ctx, 0);
            expect(result).toBe('Long\u2026');
        });

        test('ticks.callback leaves short labels unchanged', () => {
            const spec = {
                orientation: 'vertical',
                scales: {
                    x: { type: 'category', ticks: { maxLength: 10 } },
                    y: { type: 'linear' },
                },
            };
            const scales = getScales(spec);
            const ctx = { getLabelForValue: () => 'Short' };
            const result = scales.x.ticks.callback.call(ctx, 0);
            expect(result).toBe('Short');
        });

        test('truncation callback works on category (y) axis for horizontal orientation', () => {
            const spec = {
                orientation: 'horizontal',
                scales: {
                    x: { type: 'category', ticks: { maxLength: 4 } },
                    y: { type: 'linear' },
                },
            };
            const scales = getScales(spec);
            const ctx = { getLabelForValue: () => 'VeryLongLabel' };
            const result = scales.y.ticks.callback.call(ctx, 0);
            expect(result).toBe('Ver\u2026');
        });

        test('does not add ticks.callback when maxLength is not set', () => {
            const spec = {
                orientation: 'vertical',
                scales: {
                    x: { type: 'category', ticks: {} },
                    y: { type: 'linear' },
                },
            };
            const scales = getScales(spec);
            expect(scales.x.ticks).toBeUndefined();
        });

        test('combines autoSkip and callback when dynamicSizing + maxLength', () => {
            const spec = {
                orientation: 'vertical',
                scales: {
                    x: { type: 'category', ticks: { maxLength: 6 } },
                    y: { type: 'linear' },
                },
                theme: { dynamicSizing: true },
            };
            const scales = getScales(spec);
            expect(scales.x.ticks.autoSkip).toBe(false);
            expect(typeof scales.x.ticks.callback).toBe('function');
        });
    });

    describe('tick rotation', () => {
        test('sets maxRotation and minRotation when rotation is specified', () => {
            const spec = {
                orientation: 'vertical',
                scales: {
                    x: { type: 'category', ticks: { rotation: 45 } },
                    y: { type: 'linear' },
                },
            };
            const scales = getScales(spec);
            expect(scales.x.ticks.maxRotation).toBe(45);
            expect(scales.x.ticks.minRotation).toBe(45);
        });

        test('sets rotation to 0 (horizontal labels)', () => {
            const spec = {
                orientation: 'vertical',
                scales: {
                    x: { type: 'category', ticks: { rotation: 0 } },
                    y: { type: 'linear' },
                },
            };
            const scales = getScales(spec);
            expect(scales.x.ticks.maxRotation).toBe(0);
            expect(scales.x.ticks.minRotation).toBe(0);
        });

        test('rotation applies to category (y) axis for horizontal orientation', () => {
            const spec = {
                orientation: 'horizontal',
                scales: {
                    x: { type: 'category', ticks: { rotation: 30 } },
                    y: { type: 'linear' },
                },
            };
            const scales = getScales(spec);
            expect(scales.y.ticks.maxRotation).toBe(30);
            expect(scales.y.ticks.minRotation).toBe(30);
        });

        test('does not set rotation when not specified', () => {
            const spec = {
                orientation: 'vertical',
                scales: {
                    x: { type: 'category', ticks: {} },
                    y: { type: 'linear' },
                },
            };
            const scales = getScales(spec);
            expect(scales.x.ticks?.maxRotation).toBeUndefined();
            expect(scales.x.ticks?.minRotation).toBeUndefined();
        });

        test('combines rotation and truncation', () => {
            const spec = {
                orientation: 'vertical',
                scales: {
                    x: {
                        type: 'category',
                        ticks: { maxLength: 10, rotation: 45 },
                    },
                    y: { type: 'linear' },
                },
            };
            const scales = getScales(spec);
            expect(scales.x.ticks.maxRotation).toBe(45);
            expect(scales.x.ticks.minRotation).toBe(45);
            expect(typeof scales.x.ticks.callback).toBe('function');
        });
    });
});

describe('bars/getScales – y min/max pass-through', () => {
    const baseSpec = {
        orientation: 'vertical',
        mapping: { x: 'category', y: 'value' },
        scales: {
            x: { type: 'category' },
            y: { type: 'linear' },
        },
    };

    test('passes scales.y.min to the value scale', () => {
        const spec = {
            ...baseSpec,
            scales: { ...baseSpec.scales, y: { type: 'linear', min: 10 } },
        };
        const result = getScales(spec);
        expect(result.y.min).toBe(10);
    });

    test('passes scales.y.max to the value scale', () => {
        const spec = {
            ...baseSpec,
            scales: { ...baseSpec.scales, y: { type: 'linear', max: 100 } },
        };
        const result = getScales(spec);
        expect(result.y.max).toBe(100);
    });

    test('passes both min and max together', () => {
        const spec = {
            ...baseSpec,
            scales: {
                ...baseSpec.scales,
                y: { type: 'linear', min: 5, max: 95 },
            },
        };
        const result = getScales(spec);
        expect(result.y.min).toBe(5);
        expect(result.y.max).toBe(95);
    });

    test('does not include min when scales.y.min is undefined', () => {
        const result = getScales(baseSpec);
        expect(result.y.min).toBeUndefined();
    });

    test('suppresses beginAtZero when scales.y.min is explicitly set', () => {
        const spec = {
            ...baseSpec,
            scales: { ...baseSpec.scales, y: { type: 'linear', min: 10 } },
        };
        const result = getScales(spec);
        expect(result.y.beginAtZero).toBeUndefined();
    });

    test('keeps beginAtZero: true when scales.y.min is not set', () => {
        const result = getScales(baseSpec);
        expect(result.y.beginAtZero).toBe(true);
    });

    test('passes min/max through to x axis when orientation is horizontal', () => {
        const spec = {
            orientation: 'horizontal',
            mapping: { x: 'category', y: 'value' },
            scales: {
                x: { type: 'category' },
                y: { type: 'linear', min: 0, max: 50 },
            },
        };
        const result = getScales(spec);
        // In horizontal mode, the value axis is x
        expect(result.x.min).toBe(0);
        expect(result.x.max).toBe(50);
    });

    describe("stat='percent'", () => {
        test('sets max: 100 and percentage ticks on value axis for dodge + percent', () => {
            const spec = {
                orientation: 'vertical',
                position: 'dodge',
                stat: 'percent',
                scales: {
                    x: { type: 'category' },
                    y: { type: 'linear' },
                },
            };
            const scales = getScales(spec);
            expect(scales.y.max).toBe(100);
            expect(scales.y.ticks.callback(50)).toBe('50%');
            expect(scales.x.stacked).toBeUndefined();
            expect(scales.y.stacked).toBeUndefined();
        });

        test('sets max: 100 on value axis (x) for horizontal dodge + percent', () => {
            const spec = {
                orientation: 'horizontal',
                position: 'dodge',
                stat: 'percent',
                scales: {
                    x: { type: 'category' },
                    y: { type: 'linear' },
                },
            };
            const scales = getScales(spec);
            expect(scales.x.max).toBe(100);
            expect(scales.x.ticks.callback(25)).toBe('25%');
        });

        test('sets max: 100 for stack + percent (former fill)', () => {
            const spec = {
                orientation: 'vertical',
                position: 'stack',
                stat: 'percent',
                scales: {
                    x: { type: 'category' },
                    y: { type: 'linear' },
                },
            };
            const scales = getScales(spec);
            expect(scales.y.max).toBe(100);
            expect(scales.x.stacked).toBe(true);
            expect(scales.y.stacked).toBe(true);
        });

        test('does not set max: 100 when stat is count', () => {
            const spec = {
                orientation: 'vertical',
                position: 'dodge',
                stat: 'count',
                scales: {
                    x: { type: 'category' },
                    y: { type: 'linear' },
                },
            };
            const scales = getScales(spec);
            expect(scales.y.max).toBeUndefined();
        });

        test('respects explicit y.max when stat is percent', () => {
            const spec = {
                orientation: 'vertical',
                position: 'dodge',
                stat: 'percent',
                scales: {
                    x: { type: 'category' },
                    y: { type: 'linear', max: 50 },
                },
            };
            const scales = getScales(spec);
            expect(scales.y.max).toBe(50);
        });
    });
});
