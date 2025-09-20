/**
 * Define custom tooltip content for the Risk Score column.
 *
 * @param {Object} column - The column definition.
 * @param {Object} content - The data content for the column.
 * @param {Object} config - Configuration object.
 * @param {Array} results - Full results array to get amber/red flags and calculation details.
 * @param {Array} metricMetadata - Metric metadata for proper metric names.
 *
 * @returns {String} The tooltip content.
 */
export default function defineRiskScoreTooltip(
    column,
    content,
    config,
    results,
    metricMetadata = null
) {
    const groupID = content.GroupID;

    // Get all results for this group
    const groupResults = results.filter((result) => result.GroupID === groupID);

    // Get the risk score result specifically
    const riskScoreResult = groupResults.find(
        (result) => result.MetricID === config.SiteRiskScoreMetricID
    );

    // Get amber and red flagged metrics for this group
    const amberFlags = groupResults
        .filter((result) => Math.abs(parseInt(result.Flag)) === 1)
        .filter((result) => result.MetricID !== config.SiteRiskScoreMetricID);
    const redFlags = groupResults
        .filter((result) => Math.abs(parseInt(result.Flag)) === 2)
        .filter((result) => result.MetricID !== config.SiteRiskScoreMetricID);

    // Create a lookup for metric names
    const metricLookup = metricMetadata
        ? metricMetadata.reduce((acc, metric) => {
              acc[metric.MetricID] = {
                  name: metric.Metric,
                  abbreviation: metric.Abbreviation,
              };
              return acc;
          }, {})
        : {};

    const tooltipLines = [];

    // Add the main calculation line
    if (riskScoreResult) {
        const numerator = riskScoreResult.Numerator;
        const denominator = riskScoreResult.Denominator;
        const score = parseFloat(riskScoreResult.Score).toFixed(2);

        tooltipLines.push(`Risk Score Calculation:`);
        tooltipLines.push(`${numerator} / ${denominator} = ${score}`);
        tooltipLines.push(''); // Empty line for spacing
    }

    // Add red flags section
    if (redFlags.length > 0) {
        tooltipLines.push(`Red Flags (${redFlags.length}):`);
        redFlags.forEach((result) => {
            const metricInfo = metricLookup[result.MetricID];
            const metricName = metricInfo ? metricInfo.name : result.MetricID;
            const metricText = result.Weight
                ? `• ${metricName}: ${result.Weight}`
                : `• ${metricName}`;
            tooltipLines.push(metricText);
        });
        tooltipLines.push(''); // Empty line for spacing
    }

    // Add amber flags section
    if (amberFlags.length > 0) {
        tooltipLines.push(`Amber Flags (${amberFlags.length}):`);
        amberFlags.forEach((result) => {
            const metricInfo = metricLookup[result.MetricID];
            const metricName = metricInfo ? metricInfo.name : result.MetricID;
            const metricText = result.Weight
                ? `• ${metricName}: ${result.Weight}`
                : `• ${metricName}`;
            tooltipLines.push(metricText);
        });
    }

    // If no flags, show message
    if (redFlags.length === 0 && amberFlags.length === 0) {
        tooltipLines.push('No amber or red flags for this group');
    }

    // Add link to risk signal calculation vignette
    tooltipLines.push('');
    tooltipLines.push('For more information, see:');
    tooltipLines.push(
        config.SiteRiskScoreURL ||
            'https://gilead-biostats.github.io/gsm.kri/articles/SiteRiskScore.html'
    );

    return tooltipLines.join('\n');
}
