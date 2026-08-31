/**
 * @jest-environment jsdom
 */

import facetPoints from '../../src/facetPoints.js';
import points from '../../src/points.js';
import pointLabels from '../../src/points/pointLabels.js';
import {
    getPrematureDeathSpec,
    getStatusTrackerSpec,
    getVisualizeScatterSpec,
    prematureDeathData,
    prematureDeathOrder,
    statusTrackerData,
    visualizeScatterData,
} from './fixtures/downstreamUseCases.js';

global.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
};

function findPoint(chart, key) {
    for (
        let datasetIndex = 0;
        datasetIndex < chart.data.datasets.length;
        datasetIndex += 1
    ) {
        const dataset = chart.data.datasets[datasetIndex];
        const index = dataset.data.findIndex((point) => point._key === key);
        if (index !== -1) return { dataset, datasetIndex, index };
    }
    return undefined;
}

function getTooltipLabel(chart, location) {
    const point = location.dataset.data[location.index];
    return chart.options.plugins.tooltip.callbacks.label({
        raw: point,
        dataset: location.dataset,
        datasetIndex: location.datasetIndex,
        dataIndex: location.index,
    });
}

describe('points downstream use-case qualification', () => {
    let container;

    beforeEach(() => {
        container = document.createElement('div');
        document.body.appendChild(container);
    });

    afterEach(() => {
        container.querySelectorAll('canvas').forEach((canvas) => {
            canvas.chart?.destroy();
        });
        container.remove();
    });

    test('covers the Status Tracker palette, fixed markers, tooltip, and row callback', () => {
        const onClick = jest.fn();
        const chart = points(
            container,
            statusTrackerData,
            getStatusTrackerSpec({ onClick })
        );

        expect(chart.data.datasets.map(({ label }) => label)).toEqual([
            'Ongoing',
            'Completed Study',
            'Death',
            'Potential Lost to Follow-Up',
        ]);
        expect(
            chart.data.datasets.map(({ backgroundColor }) => backgroundColor)
        ).toEqual(['#1a9850', '#2166ac', '#000000', '#f28e2b']);
        expect(
            chart.data.datasets
                .flatMap(({ pointRadius }) => pointRadius)
                .every((radius) => radius === 4)
        ).toBe(true);

        const participant = findPoint(chart, 'P-002');
        expect(getTooltipLabel(chart, participant)).toBe(
            'Site 02 - P-002: Potential Lost to Follow-Up; Last Known Alive Day: 28; Reference to Last Known Alive Day: 64'
        );

        const event = { type: 'click' };
        chart.options.onClick(
            event,
            [
                {
                    datasetIndex: participant.datasetIndex,
                    index: participant.index,
                },
            ],
            chart
        );
        expect(onClick).toHaveBeenCalledWith(
            expect.objectContaining({ _datum: statusTrackerData[1] }),
            event
        );
    });

    test('covers Premature Deaths ordering, fixed-range filtering, and hidden state', () => {
        const chart = points(
            container,
            prematureDeathData,
            getPrematureDeathSpec()
        );
        const hiddenIndex = chart.data.datasets.findIndex(
            ({ _color }) => _color === 'Death within 31-90 days'
        );
        chart.setDatasetVisibility(hiddenIndex, false);
        chart.update('none');

        chart.helpers.updateData(
            chart,
            prematureDeathData.filter(({ country }) => country === 'USA')
        );

        expect(chart.data.datasets.map(({ label }) => label)).toEqual(
            prematureDeathOrder
        );
        expect(chart.options.scales.x.min).toBe(0);
        expect(chart.options.scales.x.max).toBe(95);
        expect(chart.options.scales.y.min).toBe(0);
        expect(chart.options.scales.y.max).toBe(210);
        expect(chart.isDatasetVisible(hiddenIndex)).toBe(false);
        expect(getTooltipLabel(chart, findPoint(chart, 'A'))).toContain(
            'Subject: A; Category: Death within 30 days'
        );
    });

    test('covers Visualize_Scatter log ticks, labels, threshold curves, and fixed facets', () => {
        const { charts } = facetPoints(
            container,
            visualizeScatterData,
            getVisualizeScatterSpec()
        );

        expect(charts).toHaveLength(2);
        charts.forEach((chart, index) => {
            expect(chart.options.scales.x.type).toBe('logarithmic');
            expect(chart.options.scales.x.min).toBe(5);
            expect(chart.options.scales.x.max).toBe(1000);
            expect(chart.options.scales.y.min).toBe(0);
            expect(chart.options.scales.y.max).toBe(38);
            expect(chart.options.plugins.legend.display).toBe(false);

            const scale = { ticks: [] };
            chart.options.scales.x.afterBuildTicks(scale);
            expect(scale.ticks.map(({ value }) => value)).toEqual([
                5, 10, 50, 100, 500, 1000,
            ]);
            expect(chart.options.scales.x.ticks.callback(1000)).toBe('1,000');

            const annotation = chart.data.datasets.find(
                (dataset) => dataset._annotation
            );
            expect(
                new Set(annotation.data.map(({ _datum }) => _datum.snapshot))
            ).toEqual(new Set([index === 0 ? '2025-01' : '2025-02']));

            const ordinary = findPoint(chart, 'A');
            const flagged = findPoint(chart, index === 0 ? 'B' : 'C');
            const display = pointLabels(chart.data._spec_).display;
            expect(
                display({
                    dataset: ordinary.dataset,
                    dataIndex: ordinary.index,
                })
            ).toBe(false);
            expect(
                display({
                    dataset: flagged.dataset,
                    dataIndex: flagged.index,
                })
            ).toBe(true);
        });
        expect(charts[0].options.scales.x.min).toBe(
            charts[1].options.scales.x.min
        );
        expect(charts[0].options.scales.y.max).toBe(
            charts[1].options.scales.y.max
        );
    });
});
