import results from '../../examples/data/results.json';
import metricMetadata from '../../examples/data/metricMetadata.json';
import resultsPredicted from '../../examples/data/resultsPredicted.json';

import configure from '../../src/scatterPlot/configure.js';

const MetricID = 'kri0001';
const resultsSubset = results.filter((d) => d.MetricID === MetricID);
const metricMetadatum = metricMetadata.find(
    (metric) => metric.MetricID === MetricID
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
                'Outcome',
                'Model',
                'Score',
                'ScoreExtra',
                'Thresholds',

                // scatter plot settings
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
