import syncSelection from '../../src/facetBars/syncSelection.js';
import { getSelection } from '../../src/bars/selection.js';

function makeChart(labels, datasets) {
    const chartDatasets = datasets.map((d, i) => ({
        label: `ds${i}`,
        data: d,
        backgroundColor: '#4e79a7',
        borderColor: '#3d6089',
    }));
    return {
        data: {
            labels,
            datasets: chartDatasets,
            _spec_: {
                orientation: 'vertical',
                selection: { enabled: false, opacity: 0.2, multiple: false },
                callbacks: {},
            },
        },
        options: {
            indexAxis: 'x',
            onClick: null,
        },
        update: jest.fn(),
        helpers: {
            selectCategory: jest.fn((chart, values) => {
                const {
                    selectCategory,
                } = require('../../src/bars/selection.js');
                selectCategory(chart, values);
            }),
            selectSegment: jest.fn((chart, values) => {
                const {
                    selectSegment,
                } = require('../../src/bars/selection.js');
                selectSegment(chart, values);
            }),
            clearSelection: jest.fn((chart) => {
                const {
                    clearSelection,
                } = require('../../src/bars/selection.js');
                clearSelection(chart);
            }),
        },
    };
}

describe('facetBars/syncSelection', () => {
    test('selectCategory on one chart propagates to siblings', () => {
        const chart1 = makeChart(
            ['A', 'B'],
            [
                [
                    { x: 'A', y: 10 },
                    { x: 'B', y: 20 },
                ],
            ]
        );
        const chart2 = makeChart(
            ['A', 'B'],
            [
                [
                    { x: 'A', y: 15 },
                    { x: 'B', y: 25 },
                ],
            ]
        );
        syncSelection([chart1, chart2]);

        chart1.helpers.selectCategory(chart1, 'A');

        const sel2 = getSelection(chart2);
        expect(sel2.type).toBe('category');
        expect(sel2.values).toContain('A');
    });

    test('clearSelection on one chart propagates to siblings', () => {
        const chart1 = makeChart(
            ['A', 'B'],
            [
                [
                    { x: 'A', y: 10 },
                    { x: 'B', y: 20 },
                ],
            ]
        );
        const chart2 = makeChart(
            ['A', 'B'],
            [
                [
                    { x: 'A', y: 15 },
                    { x: 'B', y: 25 },
                ],
            ]
        );
        syncSelection([chart1, chart2]);

        chart1.helpers.selectCategory(chart1, 'A');
        chart1.helpers.clearSelection(chart1);

        const sel2 = getSelection(chart2);
        expect(sel2.type).toBeNull();
    });

    test('onClick propagation does not fire duplicate onSelect callbacks', () => {
        const onSelect = jest.fn();
        const chart1 = makeChart(
            ['A', 'B'],
            [
                [
                    { x: 'A', y: 10 },
                    { x: 'B', y: 20 },
                ],
            ]
        );
        const chart2 = makeChart(
            ['A', 'B'],
            [
                [
                    { x: 'A', y: 15 },
                    { x: 'B', y: 25 },
                ],
            ]
        );
        // Enable selection and attach onSelect to both charts.
        chart1.data._spec_.selection.enabled = true;
        chart2.data._spec_.selection.enabled = true;
        chart1.data._spec_.callbacks.onSelect = onSelect;
        chart2.data._spec_.callbacks.onSelect = onSelect;

        // Set chart1's original onClick to simulate bars/onClick selecting a category.
        const { selectCategory } = require('../../src/bars/selection.js');
        chart1.options.onClick = (event, activeElements, chartInstance) => {
            if (activeElements.length > 0) {
                const { index, datasetIndex } = activeElements[0];
                const point =
                    chartInstance.data.datasets[datasetIndex].data[index];
                selectCategory(chartInstance, point.x, event);
            }
        };

        syncSelection([chart1, chart2]);

        // Simulate a click on the first bar of chart1.
        const fakeEvent = { type: 'click' };
        chart1.options.onClick(
            fakeEvent,
            [{ datasetIndex: 0, index: 0 }],
            chart1
        );

        // onSelect should fire exactly once — from the originating chart only,
        // not from sibling propagation.
        expect(onSelect).toHaveBeenCalledTimes(1);
    });
});
