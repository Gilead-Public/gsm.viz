import results from '../../examples/data/results.json';
import metricMetadata from '../../examples/data/metricMetadata.json';
import metricMetadatumSchema from '../../src/data/schema/metricMetadatum.json';

import configure from '../../src/timeSeries/configure.js';

const MetricID = 'kri0001';
const resultsSubset = results.filter((d) => d.MetricID === MetricID);
const metricMetadatum = Object.keys(metricMetadatumSchema.properties).reduce(
    (acc, key) => {
        acc[key] = metricMetadata.find(
            (metric) => metric.MetricID === MetricID
        )[key];

        return acc;
    },
    {}
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
                'Numerator',
                'Denominator',
                'Metric',
                'Score',
                'Thresholds',

                // time series settings
                'resultTooltipKeys',
                'groupLabelKey',
                'groupParticipantCountKey',
                'groupTooltipKeys',

                'x',
                'xType',
                'xLabel',

                'y',
                'yType',
                'yLabel',

                'color',

                'hoverCallback',
                'hoverCallbackWrapper',
                'clickCallback',
                'clickCallbackWrapper',

                'annotateThreshold',
                'aggregateLabel',
                'chartName',
                'dataType',
                'discreteUnit',
                'distributionDisplay',
                'displayTitle',
                'maintainAspectRatio',
                'selectedGroupIDs',
                'selectedGroupDatum',
                'thresholds',
                'variableThresholds',
            ].sort()
        );
    });
});
