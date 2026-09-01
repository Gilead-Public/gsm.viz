import syncLegendClicks from '../../src/facetPoints/syncLegendClicks.js';

function makeDataset(color, shape, label = String(color)) {
    return {
        label,
        data: [],
        _color: color,
        _colorMissing: color === null,
        _shape: shape,
        _shapeMissing: shape === null,
    };
}

function makeChart(datasets) {
    const visible = datasets.map(() => true);
    const chart = {
        data: {
            datasets,
            _spec_: {
                mapping: {
                    x: 'x',
                    y: 'y',
                    color: 'color',
                    shape: 'shape',
                },
            },
        },
        options: {
            plugins: {
                legend: {
                    onClick: jest.fn((_event, item) => {
                        visible[item.datasetIndex] =
                            !visible[item.datasetIndex];
                    }),
                },
            },
        },
        isDatasetVisible: jest.fn((index) => visible[index]),
        setDatasetVisibility: jest.fn((index, value) => {
            visible[index] = value;
        }),
        update: jest.fn(),
    };
    return chart;
}

describe('facetPoints/syncLegendClicks', () => {
    test('runs the original handler with its legend context', () => {
        const chart = makeChart([makeDataset('A', 'Circle')]);
        const original = chart.options.plugins.legend.onClick;
        const legend = { chart };
        const event = { type: 'click' };
        const item = { datasetIndex: 0, text: 'A' };

        syncLegendClicks([chart]);
        chart.options.plugins.legend.onClick.call(legend, event, item, legend);

        expect(original).toHaveBeenCalledWith(event, item, legend);
        expect(original.mock.instances[0]).toBe(legend);
    });

    test('propagates visibility by composite typed identity, not label or index', () => {
        const origin = makeChart([
            makeDataset(1, 'Circle', 'same label'),
            makeDataset('1', 'Triangle', 'same label'),
        ]);
        const sibling = makeChart([
            makeDataset('1', 'Triangle', 'same label'),
            makeDataset(1, 'Circle', 'same label'),
        ]);

        syncLegendClicks([origin, sibling]);
        origin.options.plugins.legend.onClick(
            {},
            { datasetIndex: 0, text: 'same label' },
            { chart: origin }
        );

        expect(sibling.setDatasetVisibility).toHaveBeenCalledWith(1, false);
        expect(sibling.setDatasetVisibility).not.toHaveBeenCalledWith(0, false);
        expect(sibling.update).toHaveBeenCalledWith('none');
    });

    test('keeps missing and literal Missing groups distinct', () => {
        const origin = makeChart([
            makeDataset('(Missing)', 'Circle', '"(Missing)"'),
            {
                ...makeDataset(null, 'Circle', '(Missing)'),
                _color: '(Missing)',
                _colorMissing: true,
            },
        ]);
        const sibling = makeChart([
            {
                ...makeDataset(null, 'Circle', '(Missing)'),
                _color: '(Missing)',
                _colorMissing: true,
            },
            makeDataset('(Missing)', 'Circle', '"(Missing)"'),
        ]);

        syncLegendClicks([origin, sibling]);
        origin.options.plugins.legend.onClick(
            {},
            { datasetIndex: 1, text: '(Missing)' },
            { chart: origin }
        );

        expect(sibling.setDatasetVisibility).toHaveBeenCalledWith(0, false);
    });

    test('matches annotation datasets by their annotation ordinal', () => {
        const makeLine = (label) => ({
            _annotation: true,
            label,
            data: [],
        });
        const origin = makeChart([
            makeDataset('A', 'Circle'),
            makeLine('Same'),
            makeLine('Same'),
        ]);
        const sibling = makeChart([
            makeDataset('A', 'Circle'),
            makeLine('Same'),
            makeLine('Same'),
        ]);

        syncLegendClicks([origin, sibling]);
        origin.options.plugins.legend.onClick(
            {},
            { datasetIndex: 2, text: 'Same' },
            { chart: origin }
        );

        expect(sibling.setDatasetVisibility).toHaveBeenCalledWith(2, false);
        expect(sibling.setDatasetVisibility).not.toHaveBeenCalledWith(1, false);
    });

    test('matches facet-aware annotations by layer and typed group identity', () => {
        const makeLine = (layer, group) => ({
            _annotation: true,
            _annotationLayer: layer,
            _annotationGroup: group,
            _annotationGroupMissing: false,
            label: String(group),
            data: [],
        });
        const makeUngroupedLine = (layer) => ({
            _annotation: true,
            _annotationLayer: layer,
            label: `Layer ${layer}`,
            data: [],
        });
        const origin = makeChart([
            makeDataset('A', 'Circle'),
            makeLine(0, 'Low'),
            makeLine(0, 'High'),
            makeUngroupedLine(1),
        ]);
        const sibling = makeChart([
            makeDataset('A', 'Circle'),
            makeLine(0, 'High'),
            makeUngroupedLine(1),
        ]);

        syncLegendClicks([origin, sibling]);
        origin.options.plugins.legend.onClick(
            {},
            { datasetIndex: 1, text: 'Low' },
            { chart: origin }
        );

        expect(sibling.setDatasetVisibility).not.toHaveBeenCalled();

        origin.options.plugins.legend.onClick(
            {},
            { datasetIndex: 3, text: 'Layer 1' },
            { chart: origin }
        );

        expect(sibling.setDatasetVisibility).toHaveBeenCalledTimes(1);
        expect(sibling.setDatasetVisibility).toHaveBeenCalledWith(2, false);
    });

    test('can leave legend toggles local', () => {
        const origin = makeChart([makeDataset('A', 'Circle')]);
        const sibling = makeChart([makeDataset('A', 'Circle')]);

        syncLegendClicks([origin, sibling], { sync: false });
        origin.options.plugins.legend.onClick(
            {},
            { datasetIndex: 0, text: 'A' },
            { chart: origin }
        );

        expect(origin.isDatasetVisible(0)).toBe(false);
        expect(sibling.setDatasetVisibility).not.toHaveBeenCalled();
    });

    test('can be re-applied without nesting synchronization wrappers', () => {
        const origin = makeChart([makeDataset('A', 'Circle')]);
        const sibling = makeChart([makeDataset('A', 'Circle')]);
        const original = origin.options.plugins.legend.onClick;

        syncLegendClicks([origin, sibling]);
        syncLegendClicks([origin, sibling]);
        origin.options.plugins.legend.onClick(
            {},
            { datasetIndex: 0, text: 'A' },
            { chart: origin }
        );

        expect(original).toHaveBeenCalledTimes(1);
        expect(sibling.setDatasetVisibility).toHaveBeenCalledTimes(1);
        expect(sibling.update).toHaveBeenCalledTimes(1);
    });
});
