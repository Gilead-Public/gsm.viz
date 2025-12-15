/**
 * @jest-environment jsdom
 */

import results from '../../examples/data/results.json';
import metricMetadata from '../../examples/data/metricMetadata.json';
import groupMetadata from '../../examples/data/groupMetadata.json';

import timeSeries from '../../src/timeSeries.js';

const MetricID = 'kri0001';
const resultsSubset = results.filter((d) => d.MetricID === MetricID);
const metricMetadatum = metricMetadata.find(
    (metric) => metric.MetricID === MetricID
);
const thresholds = metricMetadatum.Threshold.split(',').map((d) => +d);

describe('time series is generated', () => {
    const container = document.createElement('div');

    test('time series is generated with all arguments', () => {
        const instance = timeSeries(
            container,
            resultsSubset,
            metricMetadatum,
            thresholds,
            null,
            groupMetadata
        );

        expect(instance).not.toBeNull();
    });

    test(`time series is generated with missing optional arguments`, () => {
        const instance = timeSeries(container, resultsSubset);

        expect(instance).not.toBeNull();
    });

    test(`time series is generated with empty results`, () => {
        const instance = timeSeries(container, []);

        expect(instance).not.toBeNull();
    });

    test(`time series is generated with empty config`, () => {
        const instance = timeSeries(container, resultsSubset, {});

        expect(instance).not.toBeNull();
    });

    test(`time series is generated with empty thresholds`, () => {
        const instance = timeSeries(
            container,
            resultsSubset,
            metricMetadatum,
            []
        );

        expect(instance).not.toBeNull();
    });

    test(`time series is generated with empty groupMetadata`, () => {
        const instance = timeSeries(
            container,
            resultsSubset,
            metricMetadatum,
            thresholds,
            null,
            []
        );

        expect(instance).not.toBeNull();
    });
});
