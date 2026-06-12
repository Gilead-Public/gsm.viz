import referenceLines from '../../src/bars/getPlugins/referenceLines.js';

describe('bars/getPlugins/referenceLines', () => {
    describe('when referenceLines is absent or empty', () => {
        test('returns null when referenceLines is absent', () => {
            expect(referenceLines({ annotations: {} })).toBeNull();
        });

        test('returns null when referenceLines is an empty array', () => {
            expect(referenceLines({ annotations: { referenceLines: [] } })).toBeNull();
        });

        test('returns null when annotations is absent', () => {
            expect(referenceLines({})).toBeNull();
        });

        test('returns null when referenceLines is a non-array truthy value', () => {
            expect(referenceLines({ annotations: { referenceLines: {} } })).toBeNull();
        });
    });

    describe('vertical orientation (default)', () => {
        const spec = {
            orientation: 'vertical',
            annotations: {
                referenceLines: [{ value: 0.05 }],
            },
        };

        test('returns an array', () => {
            const result = referenceLines(spec);
            expect(Array.isArray(result)).toBe(true);
        });

        test('creates a horizontal line using yMin/yMax', () => {
            const [line] = referenceLines(spec);
            expect(line.yMin).toBe(0.05);
            expect(line.yMax).toBe(0.05);
        });

        test('does not set xMin/xMax for vertical orientation', () => {
            const [line] = referenceLines(spec);
            expect(line.xMin).toBeUndefined();
            expect(line.xMax).toBeUndefined();
        });

        test('sets type to line', () => {
            const [line] = referenceLines(spec);
            expect(line.type).toBe('line');
        });
    });

    describe('horizontal orientation', () => {
        const spec = {
            orientation: 'horizontal',
            annotations: {
                referenceLines: [{ value: 10 }],
            },
        };

        test('creates a vertical line using xMin/xMax', () => {
            const [line] = referenceLines(spec);
            expect(line.xMin).toBe(10);
            expect(line.xMax).toBe(10);
        });

        test('does not set yMin/yMax for horizontal orientation', () => {
            const [line] = referenceLines(spec);
            expect(line.yMin).toBeUndefined();
            expect(line.yMax).toBeUndefined();
        });
    });

    describe('defaults', () => {
        const spec = {
            annotations: {
                referenceLines: [{ value: 1 }],
            },
        };

        test('defaults color to #666666', () => {
            const [line] = referenceLines(spec);
            expect(line.borderColor).toBe('#666666');
        });

        test('defaults lineWidth to 1', () => {
            const [line] = referenceLines(spec);
            expect(line.borderWidth).toBe(1);
        });

        test('defaults lineDash to solid (empty array)', () => {
            const [line] = referenceLines(spec);
            expect(line.borderDash).toEqual([]);
        });

        test('sets adjustScaleRange to false', () => {
            const [line] = referenceLines(spec);
            expect(line.adjustScaleRange).toBe(false);
        });

        test('does not include a label when label is absent', () => {
            const [line] = referenceLines(spec);
            expect(line.label).toBeUndefined();
        });
    });

    describe('custom line properties', () => {
        test('uses provided color', () => {
            const spec = {
                annotations: {
                    referenceLines: [{ value: 1, color: '#e15759' }],
                },
            };
            const [line] = referenceLines(spec);
            expect(line.borderColor).toBe('#e15759');
        });

        test('uses provided lineWidth', () => {
            const spec = {
                annotations: {
                    referenceLines: [{ value: 1, lineWidth: 3 }],
                },
            };
            const [line] = referenceLines(spec);
            expect(line.borderWidth).toBe(3);
        });

        test('uses provided lineDash', () => {
            const spec = {
                annotations: {
                    referenceLines: [{ value: 1, lineDash: [4, 4] }],
                },
            };
            const [line] = referenceLines(spec);
            expect(line.borderDash).toEqual([4, 4]);
        });
    });

    describe('label', () => {
        test('includes a label when label string is provided', () => {
            const spec = {
                annotations: {
                    referenceLines: [{ value: 0.05, label: 'Threshold' }],
                },
            };
            const [line] = referenceLines(spec);
            expect(line.label).toBeDefined();
            expect(line.label.display).toBe(true);
            expect(line.label.content).toBe('Threshold');
        });

        test('label color matches line color', () => {
            const spec = {
                annotations: {
                    referenceLines: [{ value: 1, label: 'Ref', color: '#4e79a7' }],
                },
            };
            const [line] = referenceLines(spec);
            expect(line.label.color).toBe('#4e79a7');
        });

        test('label defaults to position end', () => {
            const spec = {
                annotations: {
                    referenceLines: [{ value: 1, label: 'Ref' }],
                },
            };
            const [line] = referenceLines(spec);
            expect(line.label.position).toBe('end');
        });

        test('uses provided labelPosition', () => {
            const spec = {
                annotations: {
                    referenceLines: [{ value: 1, label: 'Ref', labelPosition: 'start' }],
                },
            };
            const [line] = referenceLines(spec);
            expect(line.label.position).toBe('start');
        });

        test('does not include label when label is null', () => {
            const spec = {
                annotations: {
                    referenceLines: [{ value: 1, label: null }],
                },
            };
            const [line] = referenceLines(spec);
            expect(line.label).toBeUndefined();
        });
    });

    describe('multiple reference lines', () => {
        test('returns one annotation per reference line', () => {
            const spec = {
                annotations: {
                    referenceLines: [
                        { value: 0.05, label: 'Upper', color: '#e15759' },
                        { value: -0.05, label: 'Lower', color: '#e15759' },
                        { value: 0.1, color: '#59a14f' },
                    ],
                },
            };
            const result = referenceLines(spec);
            expect(result).toHaveLength(3);
        });

        test('each line is independent', () => {
            const spec = {
                annotations: {
                    referenceLines: [
                        { value: 0.05, color: '#e15759' },
                        { value: -0.05, color: '#4e79a7' },
                    ],
                },
            };
            const [first, second] = referenceLines(spec);
            expect(first.yMin).toBe(0.05);
            expect(first.borderColor).toBe('#e15759');
            expect(second.yMin).toBe(-0.05);
            expect(second.borderColor).toBe('#4e79a7');
        });
    });

    describe('reproduces barChart threshold pattern', () => {
        test('can produce dashed amber/red threshold lines with labels', () => {
            const spec = {
                orientation: 'vertical',
                annotations: {
                    referenceLines: [
                        { value: 0.05, label: 'Amber ↑', color: '#e5a919', lineDash: [2] },
                        { value: -0.05, label: '↓ Amber', color: '#e5a919', lineDash: [2], labelPosition: 'start' },
                        { value: 0.1, label: 'Red ↑', color: '#e15759', lineDash: [2] },
                        { value: -0.1, label: '↓ Red', color: '#e15759', lineDash: [2], labelPosition: 'start' },
                    ],
                },
            };
            const result = referenceLines(spec);
            expect(result).toHaveLength(4);
            expect(result[0].yMin).toBe(0.05);
            expect(result[0].borderDash).toEqual([2]);
            expect(result[0].label.content).toBe('Amber ↑');
            expect(result[1].label.position).toBe('start');
        });
    });
});
