import results from '../../examples/data/results.json';
import metricMetadata from '../../examples/data/metricMetadata.json';

import configure from '../../src/sparkline/configure.js';

const MetricID = 'kri0001';
const resultsSubset = results.filter((d) => d.MetricID === MetricID);
const metricMetadatum = metricMetadata.find(
    (metric) => metric.MetricID === MetricID
);
const thresholds = metricMetadatum.Thresholds.split(',').map((d) => +d);

describe('configuration', () => {
    const config = configure(metricMetadatum, resultsSubset, thresholds);

    test('configure() accepts metric metadata object and returns config object', () => {
        const settings = Object.keys(config).sort();

        expect(settings).toEqual(
            [
                // metric metadata
                'MetricID',
                'GroupLevel',
                'Abbreviation',
                'Metric',
                'Numerator',
                'Denominator',
                'Outcome',
                'Model',
                'Score',
                'ScoreExtra',
                'Thresholds',

                // sparkline settings
                'x',
                'xType',
                'xLabel',

                'y',
                'yType',
                'yLabel',

                'color',

                'hoverCallback',
                'clickCallback',

                'annotation',
                'chartName',
                'dataType',
                'displayThresholds',
                'maintainAspectRatio',
                'nSnapshots',
                'thresholds',
            ].sort()
        );
    });
});
