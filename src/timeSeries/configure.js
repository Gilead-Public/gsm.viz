import configureAll from '../util/configure.js';
import coalesce from '../util/coalesce.js';
import checkSelectedGroupIDs from '../util/checkSelectedGroupIDs.js';
import checkThresholds from '../util/checkThresholds.js';
import updateSelectedGroupDatum from '../util/updateSelectedGroupDatum.js';
import getCallbackWrapper from '../util/addCanvas/getCallbackWrapper.js';

export default function configure(
    _config_,
    _results_,
    _thresholds_,
    _intervals_
) {
    const defaults = {};

    defaults.resultTooltipKeys = [
        'Score',
        'Metric',
        'Numerator',
        'Denominator',
    ];
    defaults.GroupLevel = 'Site';
    defaults.groupLabelKey = 'InvestigatorLastName';
    defaults.groupParticipantCountKey = 'ParticipantCount';
    defaults.groupTooltipKeys = null;

    defaults.dataType = 'continuous';
    defaults.discreteUnit = null;

    defaults.distributionDisplay = 'boxplot';

    // horizontal
    defaults.x = 'SnapshotDate';
    defaults.xType = 'category';

    // vertical
    defaults.y = 'Score';
    defaults.yType = 'linear';

    // color
    defaults.color = 'Flag';

    // callbacks
    defaults.hoverCallback = (datum) => {};
    defaults.clickCallback = (datum) => {
        console.log(datum);
    };

    // miscellaneous
    defaults.aggregateLabel = 'Study';
    defaults.annotateThreshold = _thresholds_ !== null;
    defaults.displayTitle = false;
    defaults.maintainAspectRatio = false;
    //defaults.displayBoxplots = true;
    //defaults.displayViolins = false;
    //defaults.displayAmberFlags = true;
    //defaults.displayRedFlags = true;
    //defaults.displayThresholds = true;
    //defaults.displayTrendLine = true;

    if (_config_ !== null)
        _config_.variableThresholds = Array.isArray(_thresholds_)
            ? _thresholds_.some(
                  (Threshold) =>
                      Threshold.SnapshotDate !== _thresholds_[0].SnapshotDate
              )
            : false;

    const config = configureAll(defaults, _config_, {
        selectedGroupIDs: checkSelectedGroupIDs.bind(
            null,
            _config_?.selectedGroupIDs,
            _results_
        ),
        thresholds: checkThresholds.bind(null, _config_, _thresholds_),
    });

    // Update selected group datum.
    config.selectedGroupDatum = updateSelectedGroupDatum(
        _results_,
        config.selectedGroupIDs
    );

    config.dataType = /flag|risk/.test(config.y) ? 'discrete' : 'continuous';

    if (defaults.dataType === 'discrete')
        config.discreteUnit = Object.keys(_results_[0]).includes('GroupID')
            ? 'Metric'
            : 'Site';

    config.xLabel = coalesce(_config_?.xLabel, 'Snapshot Date');
    const discreteUnits =
        config.dataType === 'discrete'
            ? `${config.discreteUnit.replace(/y$/, 'ie')}s`
            : '';
    config.yLabel = coalesce(
        _config_?.yLabel,
        config.dataType === 'continuous'
            ? config[config.y]
            : /flag/.test(config.y) && /risk/.test(config.y)
            ? `Red or Amber ${discreteUnits}`
            : /flag/.test(config.y)
            ? `Red ${discreteUnits}`
            : /risk/.test(config.y)
            ? `Amber ${discreteUnits}`
            : ''
    );
    config.chartName = `Time Series of ${config.yLabel} by ${config.xLabel}`;
    if (
        config.y !== 'Score' &&
        !(config.y === 'Metric' && _intervals_ !== null)
    )
        delete config.thresholds;

    // If callbacks already exist maintain them.
    if (config.hoverCallbackWrapper === undefined)
        config.hoverCallbackWrapper = getCallbackWrapper(config.hoverCallback);
    if (config.clickCallbackWrapper === undefined)
        config.clickCallbackWrapper = getCallbackWrapper(config.clickCallback);

    return config;
}
