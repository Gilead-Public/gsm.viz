import results from '../../examples/data/results.json';
import metricMetadata from '../../examples/data/metricMetadata.json';

import formatMetricTooltipLabel from '../../src/util/formatMetricTooltipLabel.js';

describe('result attributes are formatted correctly', () => {
    const result = results.find((result) => parseFloat(result.Metric) > 0.01);
    const config = metricMetadata.find((d) => d.MetricID === result.MetricID);
    config.resultTooltipKeys = {
        'Score': config.Score,
        'Metric': config.Metric,
        'Numerator': config.Numerator,
        'Denominator': config.Denominator,
    };

    test('result attributes are formatted correctly without metric metadata', () => {
        const tooltip = formatMetricTooltipLabel(result, {
            resultTooltipKeys: {
                'Score': 'Score',
                'Metric': 'Metric',
                'Numerator': 'Numerator',
                'Denominator': 'Denominator',
            }
        });

        // - round score to 2 decimal places
        // - round metric to 2 decimal places
        // - format numerator with commas
        // - format denominator with commas
        expect(tooltip).toEqual([
            `Score: ${Math.round(parseFloat(result.Score) * 100) / 100}`,
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

    test('result attributes are formatted correctly and can include additional metric metadata with custom labels', () => {
        const tooltip = formatMetricTooltipLabel(result, {
            resultTooltipKeys: {
                'Numerator': 'Custom Numerator',
                'Denominator': 'Custom Denominator',
                'Metric': 'Custom Metric',
                'Score': 'Custom Score',
                'Flag': 'Custom Flag',
            }
        });

        // - round score to 2 decimal places
        // - round metric to 2 decimal places
        // - format numerator with commas
        // - format denominator with commas
        expect(tooltip).toEqual([
            `Custom Numerator: ${parseInt(result.Numerator).toLocaleString()}`,
            `Custom Denominator: ${parseInt(result.Denominator).toLocaleString()}`,
            `Custom Metric: ${Math.round(parseFloat(result.Metric) * 100) / 100}`,
            `Custom Score: ${Math.round(parseFloat(result.Score) * 100) / 100}`,
            `Custom Flag: ${result.Flag}`,
        ]);
    });
});
