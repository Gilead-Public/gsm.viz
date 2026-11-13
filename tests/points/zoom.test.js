/**
 * @jest-environment jsdom
 */

import points from '../../src/points.js';
import buildZoom from '../../src/points/buildZoom.js';
import mergeSpec from '../../src/points/mergeSpec.js';
import validateSpec from '../../src/points/validateSpec.js';
import updateData from '../../src/points/updateData.js';
import updateSpec from '../../src/points/updateSpec.js';
import exportImage from '../../src/points/exportImage.js';

global.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
};

const data = [
    { x: 1, y: 2, id: 'A' },
    { x: 9, y: 8, id: 'B' },
];
const spec = {
    mapping: { x: 'x', y: 'y', key: 'id' },
    scales: { x: { range: [0, 10] }, y: { range: [0, 10] } },
};

describe('points zoom configuration', () => {
    test('defaults to disabled xy zoom with conservative pan', () => {
        expect(mergeSpec(data, spec).zoom).toEqual({
            enabled: false,
            mode: 'xy',
            pan: false,
            wheel: true,
            pinch: true,
        });
    });

    test('merges zoom settings without sharing caller state', () => {
        const zoom = Object.freeze({ enabled: true, mode: 'x' });
        const merged = mergeSpec(data, { ...spec, zoom });

        expect(merged.zoom).toEqual({
            enabled: true,
            mode: 'x',
            pan: false,
            wheel: true,
            pinch: true,
        });
        expect(merged.zoom).not.toBe(zoom);
    });

    test('omits disabled zoom plugin configuration', () => {
        expect(buildZoom(undefined)).toBeUndefined();
        expect(
            buildZoom({
                enabled: false,
                mode: 'xy',
                pan: false,
                wheel: true,
                pinch: true,
            })
        ).toBeUndefined();
    });

    test.each(['x', 'y', 'xy'])(
        'builds %s zoom, pan, wheel, and pinch settings',
        (mode) => {
            expect(
                buildZoom({
                    enabled: true,
                    mode,
                    pan: true,
                    wheel: false,
                    pinch: true,
                })
            ).toEqual({
                pan: { enabled: true, mode },
                zoom: {
                    mode,
                    wheel: { enabled: false },
                    pinch: { enabled: true },
                },
            });
        }
    );

    test.each([
        ['namespace', null, 'spec.zoom must be a plain object'],
        ['namespace array', [], 'spec.zoom must be a plain object'],
        ['enabled', { enabled: 'yes' }, 'spec.zoom.enabled must be a boolean'],
        ['mode', { mode: 'z' }, "spec.zoom.mode must be 'x', 'y', or 'xy'"],
        ['pan', { pan: 1 }, 'spec.zoom.pan must be a boolean'],
        ['wheel', { wheel: null }, 'spec.zoom.wheel must be a boolean'],
        ['pinch', { pinch: 'yes' }, 'spec.zoom.pinch must be a boolean'],
        ['unknown field', { speed: 2 }, 'spec.zoom.speed is not supported'],
    ])('rejects invalid zoom %s', (_case, zoom, message) => {
        expect(() => validateSpec(data, { ...spec, zoom })).toThrow(message);
    });

    test('registers zoom behavior and the export helper', () => {
        const container = document.createElement('div');
        document.body.appendChild(container);
        const chart = points(container, data, {
            ...spec,
            zoom: {
                enabled: true,
                mode: 'x',
                pan: true,
                wheel: false,
                pinch: true,
            },
        });

        expect(chart.options.plugins.zoom.pan).toEqual({
            enabled: true,
            mode: 'x',
        });
        expect(chart.options.plugins.zoom.zoom.mode).toBe('x');
        expect(typeof chart.zoomScale).toBe('function');
        expect(chart.helpers.exportImage).toBe(exportImage);

        chart.destroy();
        container.remove();
    });

    test('partial and data updates preserve and rebuild zoom settings', () => {
        const container = document.createElement('div');
        document.body.appendChild(container);
        const chart = points(container, data, {
            ...spec,
            zoom: { enabled: true, mode: 'x', pan: true },
        });

        updateSpec(chart, { zoom: { mode: 'xy', wheel: false } });
        expect(chart.data._spec_.zoom).toEqual({
            enabled: true,
            mode: 'xy',
            pan: true,
            wheel: false,
            pinch: true,
        });
        expect(chart.options.plugins.zoom.zoom.mode).toBe('xy');

        updateData(chart, [...data].reverse());
        expect(chart.options.plugins.zoom.zoom.wheel.enabled).toBe(false);

        updateSpec(chart, { zoom: { enabled: false } });
        expect(
            Object.prototype.hasOwnProperty.call(
                chart.config.options.plugins,
                'zoom'
            )
        ).toBe(false);

        chart.destroy();
        container.remove();
    });

    test('zoom never mutates fixed spec ranges and updates restore them', () => {
        const container = document.createElement('div');
        document.body.appendChild(container);
        const chart = points(container, data, {
            ...spec,
            zoom: { enabled: true },
        });
        const xRange = chart.data._spec_.scales.x.range;

        chart.zoomScale('x', { min: 2, max: 8 }, 'none');

        expect(chart.data._spec_.scales.x.range).toBe(xRange);
        expect(xRange).toEqual([0, 10]);
        updateSpec(chart, { labels: { title: 'Restored range' } });
        expect(chart.options.scales.x.min).toBe(0);
        expect(chart.options.scales.x.max).toBe(10);

        chart.destroy();
        container.remove();
    });

    test('a new fixed range matching the active zoom becomes the reset range', () => {
        const container = document.createElement('div');
        document.body.appendChild(container);
        const chart = points(container, data, {
            ...spec,
            zoom: { enabled: true },
        });

        chart.zoomScale('x', { min: 2, max: 8 }, 'none');
        updateSpec(chart, { scales: { x: { range: [2, 8] } } });
        chart.resetZoom('none');

        expect(chart.data._spec_.scales.x.range).toEqual([2, 8]);
        expect(chart.scales.x.min).toBe(2);
        expect(chart.scales.x.max).toBe(8);

        chart.destroy();
        container.remove();
    });
});
