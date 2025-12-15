/**
 * @jest-environment jsdom
 */

import results from '../../examples/data/results.json';
import metricMetadata from '../../examples/data/metricMetadata.json';
import groupMetadata from '../../examples/data/groupMetadata.json';

import barChart from '../../src/barChart.js';

const MetricID = 'kri0001';
const resultsSubset = results.filter((d) => d.MetricID === MetricID);
const metricMetadatum = metricMetadata.find(
    (metric) => metric.MetricID === MetricID
);
const thresholds = metricMetadatum.Threshold.split(',').map((d) => +d);

describe('bar chart is generated', () => {
    const container = document.createElement('div');

    test('bar chart is generated with all arguments', () => {
        const instance = barChart(
            container,
            resultsSubset,
            metricMetadatum,
            thresholds,
            groupMetadata
        );

        expect(instance).not.toBeNull();
    });

    test(`bar chart is generated with missing optional arguments`, () => {
        const instance = barChart(container, resultsSubset);

        expect(instance).not.toBeNull();
    });

    test(`bar chart is generated with empty results`, () => {
        const instance = barChart(container, []);

        expect(instance).not.toBeNull();
    });

    test(`bar chart is generated with empty config`, () => {
        const instance = barChart(container, resultsSubset, {});

        expect(instance).not.toBeNull();
    });

    test(`bar chart is generated with empty thresholds`, () => {
        const instance = barChart(
            container,
            resultsSubset,
            metricMetadatum,
            []
        );

        expect(instance).not.toBeNull();
    });

    test(`bar chart is generated with empty group metadata`, () => {
        const instance = barChart(
            container,
            resultsSubset,
            metricMetadatum,
            thresholds,
            []
        );

        expect(instance).not.toBeNull();
    });
});
