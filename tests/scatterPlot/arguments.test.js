/**
 * @jest-environment jsdom
 */

import results from '../../examples/data/results.json';
import metricMetadata from '../../examples/data/metricMetadata.json';
import resultsPredicted from '../../examples/data/resultsPredicted.json';
import groupMetadata from '../../examples/data/groupMetadata.json';

import scatterPlot from '../../src/scatterPlot.js';

const MetricID = 'kri0001';
const resultsSubset = results.filter((d) => d.MetricID === MetricID);
const metricMetadatum = metricMetadata.find(
    (metric) => metric.MetricID === MetricID
);
const resultsPredictedSubset = resultsPredicted.filter(
    (d) => d.MetricID === MetricID
);

describe('scatter plot is generated', () => {
    const container = document.createElement('div');

    test('scatter plot is generated with all arguments', () => {
        const instance = scatterPlot(
            container,
            resultsSubset,
            metricMetadatum,
            resultsPredictedSubset,
            groupMetadata
        );

        expect(instance).not.toBeNull();
        expect(instance.data._bounds_).toEqual(resultsPredictedSubset);
    });

    test(`scatter plot is generated with missing optional arguments`, () => {
        const instance = scatterPlot(container, resultsSubset);

        expect(instance).not.toBeNull();
    });

    test(`scatter plot is generated with empty results`, () => {
        const instance = scatterPlot(container, []);

        expect(instance).not.toBeNull();
    });

    test(`scatter plot is generated with empty config`, () => {
        const instance = scatterPlot(container, resultsSubset, {});

        expect(instance).not.toBeNull();
    });

    test(`scatter plot is generated with empty bounds`, () => {
        const instance = scatterPlot(
            container,
            resultsSubset,
            metricMetadatum,
            []
        );

        expect(instance).not.toBeNull();
    });

    test('scatter plot calculates and renders bounds when bounds is null', () => {
        const instance = scatterPlot(
            container,
            resultsSubset,
            metricMetadatum,
            null,
            groupMetadata
        );

        const lineDatasets = instance.data.datasets.filter(
            (dataset) => dataset.type === 'line'
        );

        expect(instance).not.toBeNull();
        expect(lineDatasets.length).toBeGreaterThan(0);
    });

    test(`scatter plot is generated with empty group metadata`, () => {
        const instance = scatterPlot(
            container,
            resultsSubset,
            metricMetadatum,
            resultsPredictedSubset,
            []
        );

        expect(instance).not.toBeNull();
    });
});
