import mergeSpec from '../../src/points/mergeSpec.js';

const data = [{ xValue: 1, yValue: 2, id: 'A' }];
const minimalSpec = {
    mapping: { x: 'xValue', y: 'yValue' },
};

describe('points/mergeSpec', () => {
    test('applies the initial points defaults', () => {
        const merged = mergeSpec(data, minimalSpec);

        expect(merged.data).toBe(data);
        expect(merged.mapping).toEqual(minimalSpec.mapping);
        expect(merged.scales).toEqual({
            x: {
                type: 'linear',
                label: undefined,
                range: undefined,
                beginAtZero: false,
                breaks: [],
                labels: [],
            },
            y: {
                type: 'linear',
                label: undefined,
                range: undefined,
                beginAtZero: false,
                breaks: [],
                labels: [],
            },
            color: {
                colors: {},
                palette: expect.any(Array),
                order: [],
                label: undefined,
            },
            size: { range: [3, 12] },
            opacity: { range: [0.25, 1] },
            shape: {
                values: {},
                order: [],
                label: undefined,
            },
        });
        expect(merged.scales.color.palette.length).toBeGreaterThan(1);
        expect(merged.labels).toEqual({
            title: undefined,
            caption: undefined,
            description: undefined,
        });
        expect(merged.annotations).toEqual({
            referenceLines: [],
            lines: [],
            labels: { point: null },
        });
        expect(merged.tooltip).toEqual({
            format: undefined,
            formatter: undefined,
        });
        expect(merged.callbacks).toEqual({
            onClick: null,
            onHover: null,
            onSelect: null,
        });
        expect(merged.selection).toEqual({
            enabled: false,
            opacity: 0.2,
            multiple: false,
        });
        expect(merged.theme).toEqual({
            maintainAspectRatio: false,
            animation: false,
        });
    });

    test('deep merges supported user values with defaults', () => {
        const formatter = jest.fn();
        const onClick = jest.fn();
        const spec = {
            mapping: { x: 'xValue', y: 'yValue', key: 'id' },
            scales: {
                x: {
                    type: 'log',
                    label: 'Horizontal',
                    range: [1, 100],
                    breaks: [1, 10, 100],
                    labels: ['1', '10', '100'],
                },
                y: { label: 'Vertical', beginAtZero: true },
                color: {
                    colors: { Control: '#112233' },
                    palette: ['#445566'],
                    order: ['Control', 'Treatment'],
                    label: 'Arm',
                },
                size: { range: [2, 10] },
                opacity: { range: [0.1, 0.9] },
                shape: {
                    values: { Control: 'circle' },
                    order: ['Control', 'Treatment'],
                    label: 'Marker',
                },
            },
            labels: {
                title: 'Example',
                description: 'Description',
            },
            tooltip: { formatter },
            callbacks: { onClick },
            selection: { enabled: true, multiple: true },
            theme: { maintainAspectRatio: true },
        };

        const merged = mergeSpec(data, spec);

        expect(merged.mapping).toEqual(spec.mapping);
        expect(merged.scales.x).toEqual({
            type: 'log',
            label: 'Horizontal',
            range: [1, 100],
            beginAtZero: false,
            breaks: [1, 10, 100],
            labels: ['1', '10', '100'],
        });
        expect(merged.scales.y).toEqual({
            type: 'linear',
            label: 'Vertical',
            range: undefined,
            beginAtZero: true,
            breaks: [],
            labels: [],
        });
        expect(merged.scales.color).toEqual({
            colors: { Control: '#112233' },
            palette: ['#445566'],
            order: ['Control', 'Treatment'],
            label: 'Arm',
        });
        expect(merged.scales.size).toEqual({ range: [2, 10] });
        expect(merged.scales.opacity).toEqual({ range: [0.1, 0.9] });
        expect(merged.scales.shape).toEqual({
            values: { Control: 'circle' },
            order: ['Control', 'Treatment'],
            label: 'Marker',
        });
        expect(merged.labels).toEqual({
            title: 'Example',
            caption: undefined,
            description: 'Description',
        });
        expect(merged.tooltip.formatter).toBe(formatter);
        expect(merged.callbacks.onClick).toBe(onClick);
        expect(merged.callbacks.onHover).toBeNull();
        expect(merged.callbacks.onSelect).toBeNull();
        expect(merged.selection).toEqual({
            enabled: true,
            opacity: 0.2,
            multiple: true,
        });
        expect(merged.theme).toEqual({
            maintainAspectRatio: true,
            animation: false,
        });
    });

    test('explicit undefined values do not replace concrete defaults', () => {
        const merged = mergeSpec(data, {
            ...minimalSpec,
            scales: {
                x: { type: undefined },
                y: { type: undefined },
            },
            selection: {
                enabled: undefined,
                opacity: undefined,
                multiple: undefined,
            },
            theme: {
                maintainAspectRatio: undefined,
                animation: undefined,
            },
        });

        expect(merged.scales.x.type).toBe('linear');
        expect(merged.scales.y.type).toBe('linear');
        expect(merged.selection).toEqual({
            enabled: false,
            opacity: 0.2,
            multiple: false,
        });
        expect(merged.theme).toEqual({
            maintainAspectRatio: false,
            animation: false,
        });
    });

    test('does not mutate frozen caller input', () => {
        const frozenData = Object.freeze([
            Object.freeze({ xValue: 1, yValue: 2 }),
        ]);
        const frozenSpec = Object.freeze({
            mapping: Object.freeze({ x: 'xValue', y: 'yValue' }),
            scales: Object.freeze({
                x: Object.freeze({ label: 'X' }),
            }),
            labels: Object.freeze({ title: 'Frozen' }),
        });

        expect(() => mergeSpec(frozenData, frozenSpec)).not.toThrow();
        expect(frozenSpec.scales.x).toEqual({ label: 'X' });
        expect(frozenSpec.labels).toEqual({ title: 'Frozen' });
    });

    test('returns new mutable spec objects without cloning the data rows', () => {
        const spec = {
            ...minimalSpec,
            scales: { x: { label: 'X' } },
        };
        const merged = mergeSpec(data, spec);

        expect(merged).not.toBe(spec);
        expect(merged.mapping).not.toBe(spec.mapping);
        expect(merged.scales).not.toBe(spec.scales);
        expect(merged.scales.x).not.toBe(spec.scales.x);
        expect(merged.data).toBe(data);
    });

    test('does not share nested default state between calls', () => {
        const first = mergeSpec(data, minimalSpec);
        const second = mergeSpec(data, minimalSpec);

        first.scales.x.label = 'Changed';
        first.scales.x.breaks.push(42);
        first.scales.x.labels.push('Forty-two');
        first.scales.color.colors.Changed = '#000000';
        first.scales.color.palette.push('#000000');
        first.scales.color.order.push('Changed');
        first.scales.size.range.push(20);
        first.scales.opacity.range.push(0.5);
        first.scales.shape.values.Changed = 'star';
        first.scales.shape.order.push('Changed');
        first.annotations.referenceLines.push({ axis: 'x', value: 1 });
        first.annotations.lines.push({ data: [], mapping: {} });
        first.annotations.labels.point = { field: 'changed' };
        first.labels.title = 'Changed';
        first.selection.enabled = true;

        expect(second.scales.x.label).toBeUndefined();
        expect(second.scales.x.breaks).toEqual([]);
        expect(second.scales.x.labels).toEqual([]);
        expect(second.scales.color.colors).toEqual({});
        expect(second.scales.color.palette).not.toContain('#000000');
        expect(second.scales.color.order).toEqual([]);
        expect(second.scales.size.range).toEqual([3, 12]);
        expect(second.scales.opacity.range).toEqual([0.25, 1]);
        expect(second.scales.shape.values).toEqual({});
        expect(second.scales.shape.order).toEqual([]);
        expect(second.annotations.referenceLines).toEqual([]);
        expect(second.annotations.lines).toEqual([]);
        expect(second.annotations.labels.point).toBeNull();
        expect(second.labels.title).toBeUndefined();
        expect(second.selection.enabled).toBe(false);
    });

    test('copies caller-owned color scale arrays and objects', () => {
        const colors = Object.freeze({ A: '#112233' });
        const palette = Object.freeze(['#445566']);
        const order = Object.freeze(['A']);
        const spec = Object.freeze({
            ...minimalSpec,
            scales: Object.freeze({
                color: Object.freeze({ colors, palette, order }),
            }),
        });

        const merged = mergeSpec(data, spec);

        expect(merged.scales.color.colors).not.toBe(colors);
        expect(merged.scales.color.palette).not.toBe(palette);
        expect(merged.scales.color.order).not.toBe(order);
        expect(merged.scales.color.colors).toEqual(colors);
        expect(merged.scales.color.palette).toEqual(palette);
        expect(merged.scales.color.order).toEqual(order);
    });

    test('copies caller-owned axis arrays', () => {
        const range = Object.freeze([1, 100]);
        const breaks = Object.freeze([1, 10, 100]);
        const labels = Object.freeze(['1', '10', '100']);
        const spec = Object.freeze({
            ...minimalSpec,
            scales: Object.freeze({
                x: Object.freeze({ range, breaks, labels }),
            }),
        });

        const merged = mergeSpec(data, spec);

        expect(merged.scales.x.range).not.toBe(range);
        expect(merged.scales.x.breaks).not.toBe(breaks);
        expect(merged.scales.x.labels).not.toBe(labels);
        expect(merged.scales.x.range).toEqual(range);
        expect(merged.scales.x.breaks).toEqual(breaks);
        expect(merged.scales.x.labels).toEqual(labels);
    });

    test('preserves Chart.js tooltip options and copies callbacks', () => {
        const label = jest.fn();
        const callbacks = Object.freeze({ label });
        const spec = Object.freeze({
            ...minimalSpec,
            tooltip: Object.freeze({
                enabled: false,
                mode: 'nearest',
                callbacks,
            }),
        });

        const merged = mergeSpec(data, spec);

        expect(merged.tooltip.enabled).toBe(false);
        expect(merged.tooltip.mode).toBe('nearest');
        expect(merged.tooltip.callbacks).not.toBe(callbacks);
        expect(merged.tooltip.callbacks.label).toBe(label);
        expect(merged.tooltip.format).toBeUndefined();
        expect(merged.tooltip.formatter).toBeUndefined();
    });

    test('copies caller-owned aesthetic ranges', () => {
        const sizeRange = Object.freeze([2, 10]);
        const opacityRange = Object.freeze([0.2, 0.8]);
        const spec = Object.freeze({
            ...minimalSpec,
            scales: Object.freeze({
                size: Object.freeze({ range: sizeRange }),
                opacity: Object.freeze({ range: opacityRange }),
            }),
        });

        const merged = mergeSpec(data, spec);

        expect(merged.scales.size.range).not.toBe(sizeRange);
        expect(merged.scales.opacity.range).not.toBe(opacityRange);
        expect(merged.scales.size.range).toEqual(sizeRange);
        expect(merged.scales.opacity.range).toEqual(opacityRange);
    });

    test('deep copies annotation configuration without cloning source rows', () => {
        const annotationRow = Object.freeze({ x: 1, y: 2 });
        const annotationData = Object.freeze([annotationRow]);
        const referenceDash = Object.freeze([4, 2]);
        const lineDash = Object.freeze([2, 1]);
        const order = Object.freeze(['A', null]);
        const colors = Object.freeze({ A: '#123456' });
        const palette = Object.freeze(['#abcdef']);
        const spec = Object.freeze({
            ...minimalSpec,
            annotations: Object.freeze({
                referenceLines: Object.freeze([
                    Object.freeze({
                        axis: 'x',
                        value: 1,
                        dash: referenceDash,
                    }),
                ]),
                lines: Object.freeze([
                    Object.freeze({
                        data: annotationData,
                        mapping: Object.freeze({
                            x: 'x',
                            y: 'y',
                            group: 'group',
                        }),
                        order,
                        colors,
                        palette,
                        dash: lineDash,
                    }),
                ]),
                labels: Object.freeze({
                    point: Object.freeze({
                        field: 'id',
                        font: Object.freeze({ size: 12 }),
                    }),
                }),
            }),
        });

        const merged = mergeSpec(data, spec);
        const [reference] = merged.annotations.referenceLines;
        const [line] = merged.annotations.lines;
        const pointLabel = merged.annotations.labels.point;

        expect(merged.annotations).not.toBe(spec.annotations);
        expect(merged.annotations.referenceLines).not.toBe(
            spec.annotations.referenceLines
        );
        expect(reference).not.toBe(spec.annotations.referenceLines[0]);
        expect(reference.dash).not.toBe(referenceDash);
        expect(line).not.toBe(spec.annotations.lines[0]);
        expect(line.data).not.toBe(annotationData);
        expect(line.data[0]).toBe(annotationRow);
        expect(line.mapping).not.toBe(spec.annotations.lines[0].mapping);
        expect(line.order).not.toBe(order);
        expect(line.colors).not.toBe(colors);
        expect(line.palette).not.toBe(palette);
        expect(line.dash).not.toBe(lineDash);
        expect(pointLabel).not.toBe(spec.annotations.labels.point);
        expect(pointLabel.font).not.toBe(spec.annotations.labels.point.font);
        expect(pointLabel).toEqual({ field: 'id', font: { size: 12 } });
    });
});
