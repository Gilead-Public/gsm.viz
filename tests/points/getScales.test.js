import getScales from '../../src/points/getScales.js';

const spec = {
    mapping: { x: 'xValue', y: 'yValue' },
    scales: {
        x: { type: 'linear', label: undefined },
        y: { type: 'linear', label: undefined },
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
});
