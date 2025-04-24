import results from '../../examples/data/results.json';
import metricMetadata from '../../examples/data/metricMetadata.json';

import formatMetricTooltipLabel from '../../src/util/formatMetricTooltipLabel.js';

describe('result attributes are formatted correctly', () => {
    const result = results.find((result) => parseFloat(result.Metric) > 0.01);
    const config = metricMetadata.find((d) => d.MetricID === result.MetricID);

    test('result attributes are formatted correctly without metric metadata', () => {
        const tooltip = formatMetricTooltipLabel(result, {});

        // - round score to 2 decimal places
        // - round metric to 2 decimal places
        // - format numerator with commas
        // - format denominator with commas
        expect(tooltip).toEqual([
            `Score: ${Math.round(parseFloat(result.Score) * 100) / 100}`,
            `ScoreExtra: ${Math.round(parseFloat(result.ScoreExtra) * 100) / 100}`,
            `Metric: ${Math.round(parseFloat(result.Metric) * 100) / 100}`,
            `Numerator: ${parseInt(result.Numerator).toLocaleString()}`,
            `Denominator: ${parseInt(result.Denominator).toLocaleString()}`,
        ]);
    });

    test('result attributes are formatted correctly and include metric metadata', () => {
        const tooltip = formatMetricTooltipLabel(result, config);

        // - round score to 2 decimal places
        // - round metric to 2 decimal places
        // - format numerator with commas
        // - format denominator with commas
        expect(tooltip).toEqual([
            `${config.Score}: ${
                Math.round(parseFloat(result.Score) * 100) / 100
            }`,
            `${config.ScoreExtra}: ${
                Math.round(parseFloat(result.ScoreExtra) * 100) / 100
            }`,
            `${config.Metric}: ${
                Math.round(parseFloat(result.Metric) * 100) / 100
            }`,
            `${config.Numerator}: ${parseInt(
                result.Numerator
            ).toLocaleString()}`,
            `${config.Denominator}: ${parseInt(
                result.Denominator
            ).toLocaleString()}`,
        ]);
    });
});
