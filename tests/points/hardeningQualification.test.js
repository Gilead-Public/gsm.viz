/**
 * @jest-environment jsdom
 */

import points from '../../src/points.js';

global.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
};

function findDataset(chart, predicate) {
    return chart.data.datasets.findIndex(
        (dataset) => !dataset._annotation && predicate(dataset)
    );
}

describe('points combined edge-case qualification', () => {
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

    test('keeps duplicate coordinates and missing/literal groups stable across updates', () => {
        const data = [
            { id: 'missing', x: 1, y: 2, group: null },
            { id: 'literal', x: 1, y: 2, group: '(Missing)' },
        ];
        chart = points(container, data, {
            mapping: { x: 'x', y: 'y', key: 'id', color: 'group' },
            scales: { color: { order: [null, '(Missing)'] } },
            selection: { enabled: true },
        });
        const missingIndex = findDataset(
            chart,
            (dataset) => dataset._colorMissing
        );
        const literalIndex = findDataset(
            chart,
            (dataset) =>
                !dataset._colorMissing && dataset._color === '(Missing)'
        );

        expect(missingIndex).not.toBe(literalIndex);
        chart.helpers.selectPoint(chart, 'literal');
        expect(chart.tooltip.getActiveElements()).toEqual([
            expect.objectContaining({
                datasetIndex: literalIndex,
                index: 0,
            }),
        ]);

        chart.setDatasetVisibility(missingIndex, false);
        chart.update('none');
        chart.helpers.updateData(chart, [...data].reverse());
        chart.helpers.updateData(chart, data);

        expect(
            chart.isDatasetVisible(
                findDataset(chart, (dataset) => dataset._colorMissing)
            )
        ).toBe(false);
        expect(
            chart.isDatasetVisible(
                findDataset(
                    chart,
                    (dataset) =>
                        !dataset._colorMissing && dataset._color === '(Missing)'
                )
            )
        ).toBe(true);
        expect(container.querySelectorAll('canvas')).toHaveLength(1);
    });

    test('keeps an empty log chart intact when an invalid update is rejected', () => {
        chart = points(container, [], {
            mapping: { x: 'denominator', y: 'events' },
            scales: { x: { type: 'log' } },
        });
        const datasets = chart.data.datasets;
        const spec = chart.data._spec_;

        expect(chart.canvas.getAttribute('aria-label')).toContain(
            'No data available.'
        );
        expect(() =>
            chart.helpers.updateData(chart, [{ denominator: 0, events: 1 }])
        ).toThrow(
            'data[0].denominator mapped by spec.mapping.x must be greater than zero for a log scale'
        );
        expect(chart.data.datasets).toBe(datasets);
        expect(chart.data._spec_).toBe(spec);
        expect(container.querySelectorAll('canvas')).toHaveLength(1);
    });
});
