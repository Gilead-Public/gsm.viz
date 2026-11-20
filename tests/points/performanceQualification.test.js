/**
 * @jest-environment jsdom
 */

import { performance } from 'node:perf_hooks';
import points from '../../src/points.js';

global.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
};

const POINT_COUNT = 10000;

function makeData(offset = 0) {
    return Array.from({ length: POINT_COUNT }, (_value, index) => ({
        id: `P-${index}`,
        x: index + 1,
        y: ((index * 17 + offset) % 997) + 1,
        group: `Group ${index % 5}`,
    }));
}

describe('points large-data qualification', () => {
    let chart;
    let container;

    beforeEach(() => {
        container = document.createElement('div');
        document.body.appendChild(container);
    });

    afterEach(() => {
        chart?.destroy();
        container.remove();
    });

    test('renders and updates 10,000 points without per-point DOM', () => {
        const renderStart = performance.now();
        chart = points(container, makeData(), {
            mapping: {
                x: 'x',
                y: 'y',
                key: 'id',
                color: 'group',
            },
        });
        const renderMs = performance.now() - renderStart;

        const updateStart = performance.now();
        chart.helpers.updateData(chart, makeData(100));
        const updateMs = performance.now() - updateStart;

        expect(
            chart.data.datasets.reduce(
                (count, dataset) => count + dataset.data.length,
                0
            )
        ).toBe(POINT_COUNT);
        expect(container.querySelectorAll('canvas')).toHaveLength(1);
        expect(container.querySelectorAll('*')).toHaveLength(1);
        expect(Number.isFinite(renderMs)).toBe(true);
        expect(Number.isFinite(updateMs)).toBe(true);

        if (process.env.GSM_VIZ_BENCHMARK === '1') {
            console.info(
                `10,000 points: render ${renderMs.toFixed(
                    1
                )} ms; update ${updateMs.toFixed(1)} ms`
            );
        }
    });
});
