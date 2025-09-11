import results from '../../examples/data/results.json';
import metricMetadata from '../../examples/data/metricMetadata.json';
import metricMetadatumSchema from '../../src/data/schema/metricMetadatum.json';
import resultsPredicted from '../../examples/data/resultsPredicted.json';

import configure from '../../src/scatterPlot/configure.js';

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
const resultsPredictedSubset = resultsPredicted.filter(
    (d) => d.MetricID === MetricID
);

describe('configuration', () => {
    const config = configure(metricMetadatum, resultsSubset);

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
                'Score',
                'Thresholds',

                // scatter plot settings
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

                'chartName',
                'displayLegend',
                'displayTitle',
                'displayTrendLine',
                'maintainAspectRatio',
                'selectedGroupIDs',
                'selectedGroupDatum',
            ].sort()
        );
    });
});
