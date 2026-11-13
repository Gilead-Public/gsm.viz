import configureAll from '../util/configure.js';

export default function configure(_config_) {
    const defaults = {};

    defaults.resultTooltipKeys = [
        'Score',
        'Metric',
        'Numerator',
        'Denominator',
    ];
    defaults.GroupLevel = 'Site';
    defaults.groupLabelKey = null;
    defaults.groupParticipantCountKey = 'ParticipantCount';
    defaults.groupTooltipKeys = null;
    defaults.SiteRiskScoreMetricID = 'Analysis_srs0001';
    defaults.ComparisonRiskScoreMetricID = null;
    defaults.ComparisonRiskScoreLabel = 'Adjusted Risk Score';
    defaults.SiteRiskScoreURL =
        'https://gilead-public.github.io/gsm.kri/articles/SiteRiskScore.html';

    // callbacks
    defaults.groupClickCallback = (datum) => {
        console.log(datum);
    };
    defaults.metricClickCallback = (datum) => {
        console.log(datum);
    };

    const config = configureAll(defaults, _config_);

    return config;
}
