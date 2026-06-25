import buildZoom from '../../src/bars/getPlugins/buildZoom.js';

describe('bars/getPlugins/buildZoom', () => {
    test('returns undefined when zoom is undefined', () => {
        expect(buildZoom(undefined)).toBeUndefined();
    });

    test('returns undefined when zoom is null', () => {
        expect(buildZoom(null)).toBeUndefined();
    });

    test('returns undefined when zoom.enabled is false', () => {
        expect(
            buildZoom({
                enabled: false,
                mode: 'x',
                pan: true,
                wheel: true,
                pinch: true,
            })
        ).toBeUndefined();
    });

    test('returns zoom config when enabled', () => {
        const result = buildZoom({
            enabled: true,
            mode: 'x',
            pan: true,
            wheel: true,
            pinch: true,
        });
        expect(result).toEqual({
            pan: { enabled: true, mode: 'x' },
            zoom: {
                wheel: { enabled: true },
                pinch: { enabled: true },
                mode: 'x',
            },
        });
    });

    test('respects mode "y"', () => {
        const result = buildZoom({
            enabled: true,
            mode: 'y',
            pan: true,
            wheel: true,
            pinch: true,
        });
        expect(result.zoom.mode).toBe('y');
        expect(result.pan.mode).toBe('y');
    });

    test('respects mode "xy"', () => {
        const result = buildZoom({
            enabled: true,
            mode: 'xy',
            pan: true,
            wheel: true,
            pinch: true,
        });
        expect(result.zoom.mode).toBe('xy');
        expect(result.pan.mode).toBe('xy');
    });

    test('disables pan when pan is false', () => {
        const result = buildZoom({
            enabled: true,
            mode: 'x',
            pan: false,
            wheel: true,
            pinch: true,
        });
        expect(result.pan.enabled).toBe(false);
    });

    test('disables wheel when wheel is false', () => {
        const result = buildZoom({
            enabled: true,
            mode: 'x',
            pan: true,
            wheel: false,
            pinch: true,
        });
        expect(result.zoom.wheel.enabled).toBe(false);
    });

    test('disables pinch when pinch is false', () => {
        const result = buildZoom({
            enabled: true,
            mode: 'x',
            pan: true,
            wheel: true,
            pinch: false,
        });
        expect(result.zoom.pinch.enabled).toBe(false);
    });
});
