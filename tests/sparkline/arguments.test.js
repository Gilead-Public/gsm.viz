/**
 * @jest-environment jsdom
 */

import results from '../../examples/data/results.json';
import metricMetadata from '../../examples/data/metricMetadata.json';
import groupMetadata from '../../examples/data/groupMetadata.json';

import sparkline from '../../src/sparkline.js';

const MetricID = 'kri0001';
const resultsSubset = results.filter((d) => d.MetricID === MetricID);
const metricMetadatum = metricMetadata.find(
    (metric) => metric.MetricID === MetricID
);
const thresholds = metricMetadatum.Threshold.split(',').map((d) => +d);

describe('sparkline is generated', () => {
    const container = document.createElement('div');

    test('sparkline is generated with all arguments', () => {
        const instance = sparkline(
            container,
            resultsSubset,
            metricMetadatum,
            thresholds
        );

        expect(instance).not.toBeNull();
    });

    test(`sparkline is generated with missing optional arguments`, () => {
        const instance = sparkline(container, resultsSubset);

        expect(instance).not.toBeNull();
    });

    test(`sparkline is generated with empty results`, () => {
        const instance = sparkline(container, []);

        expect(instance).not.toBeNull();
    });

    test(`sparkline is generated with empty config`, () => {
        const instance = sparkline(container, resultsSubset, {});

        expect(instance).not.toBeNull();
    });

    test(`sparkline is generated with empty thresholds`, () => {
        const instance = sparkline(
            container,
            resultsSubset,
            metricMetadatum,
            []
        );

        expect(instance).not.toBeNull();
    });
});
