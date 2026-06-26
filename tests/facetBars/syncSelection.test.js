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
                const { selectCategory } = require('../../src/bars/selection.js');
                selectCategory(chart, values);
            }),
            selectSegment: jest.fn((chart, values) => {
                const { selectSegment } = require('../../src/bars/selection.js');
                selectSegment(chart, values);
            }),
            clearSelection: jest.fn((chart) => {
                const { clearSelection } = require('../../src/bars/selection.js');
                clearSelection(chart);
            }),
        },
    };
}

describe('facetBars/syncSelection', () => {
    test('selectCategory on one chart propagates to siblings', () => {
        const chart1 = makeChart(
            ['A', 'B'],
            [[{ x: 'A', y: 10 }, { x: 'B', y: 20 }]]
        );
        const chart2 = makeChart(
            ['A', 'B'],
            [[{ x: 'A', y: 15 }, { x: 'B', y: 25 }]]
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
            [[{ x: 'A', y: 10 }, { x: 'B', y: 20 }]]
        );
        const chart2 = makeChart(
            ['A', 'B'],
            [[{ x: 'A', y: 15 }, { x: 'B', y: 25 }]]
        );
        syncSelection([chart1, chart2]);

        chart1.helpers.selectCategory(chart1, 'A');
        chart1.helpers.clearSelection(chart1);

        const sel2 = getSelection(chart2);
        expect(sel2.type).toBeNull();
    });
});
