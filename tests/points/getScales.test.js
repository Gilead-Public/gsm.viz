import getScales from '../../src/points/getScales.js';

const spec = {
    mapping: { x: 'xValue', y: 'yValue' },
    scales: {
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
    },
};

describe('points/getScales', () => {
    test('builds two linear scales with mapping names as labels', () => {
        expect(getScales(spec)).toEqual({
            x: {
                type: 'linear',
                title: { display: true, text: 'xValue' },
            },
            y: {
                type: 'linear',
                title: { display: true, text: 'yValue' },
            },
        });
    });

    test('uses explicit axis labels', () => {
        const result = getScales({
            ...spec,
            scales: {
                x: { type: 'linear', label: 'Horizontal' },
                y: { type: 'linear', label: 'Vertical' },
            },
        });

        expect(result.x.title).toEqual({
            display: true,
            text: 'Horizontal',
        });
        expect(result.y.title).toEqual({
            display: true,
            text: 'Vertical',
        });
    });

    test('hides an axis title for an empty label', () => {
        const result = getScales({
            ...spec,
            scales: {
                ...spec.scales,
                x: { type: 'linear', label: '' },
            },
        });

        expect(result.x.title).toEqual({ display: false, text: '' });
        expect(result.y.title.display).toBe(true);
    });

    test('normalizes log axes to the Chart.js logarithmic type', () => {
        const result = getScales({
            ...spec,
            scales: {
                ...spec.scales,
                x: { ...spec.scales.x, type: 'log' },
            },
        });

        expect(result.x.type).toBe('logarithmic');
        expect(result.y.type).toBe('linear');
    });

    test('uses fixed min and max instead of beginAtZero', () => {
        const result = getScales({
            ...spec,
            scales: {
                ...spec.scales,
                x: {
                    ...spec.scales.x,
                    range: [-10, 25],
                    beginAtZero: true,
                },
            },
        });

        expect(result.x.min).toBe(-10);
        expect(result.x.max).toBe(25);
        expect(result.x.beginAtZero).toBeUndefined();
    });

    test('applies beginAtZero only to automatic linear domains', () => {
        const result = getScales({
            ...spec,
            scales: {
                ...spec.scales,
                y: { ...spec.scales.y, beginAtZero: true },
            },
        });

        expect(result.y.beginAtZero).toBe(true);
        expect(result.y.min).toBeUndefined();
        expect(result.y.max).toBeUndefined();
    });

    test('replaces generated ticks with explicit breaks and labels', () => {
        const result = getScales({
            ...spec,
            scales: {
                ...spec.scales,
                x: {
                    ...spec.scales.x,
                    breaks: [1, 10, 100],
                    labels: ['One', 'Ten', 'One hundred'],
                },
            },
        });
        const chartScale = {
            ticks: [{ value: 0 }, { value: 50 }],
        };

        result.x.afterBuildTicks(chartScale);

        expect(chartScale.ticks).toEqual([
            { value: 1 },
            { value: 10 },
            { value: 100 },
        ]);
        expect(result.x.ticks.callback(1)).toBe('One');
        expect(result.x.ticks.callback('10')).toBe('Ten');
        expect(result.x.ticks.callback(50)).toBeNull();
    });
});
