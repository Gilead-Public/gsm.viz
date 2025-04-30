import configureAll from '../util/configure.js';
import checkSelectedGroupIDs from '../util/checkSelectedGroupIDs.js';
import checkThresholds from '../util/checkThresholds.js';
import coalesce from '../util/coalesce.js';
import updateSelectedGroupDatum from '../util/updateSelectedGroupDatum.js';
import getCallbackWrapper from '../util/addCanvas/getCallbackWrapper.js';

export default function configure(_config_, _results_, _thresholds_) {
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

    // horizontal
    defaults.x = 'GroupID';
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
    defaults.displayTitle = false;
    defaults.maintainAspectRatio = false;

    const config = configureAll(defaults, _config_ || {}, {
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

    // configuration-driven settings
    config.xLabel = coalesce(_config_?.xLabel, config['Group']);
    config.yLabel = coalesce(_config_?.yLabel, config[config.y]);
    config.chartName = `Bar Chart of ${config.yLabel} by ${config.xLabel}`;
    if (config.y !== 'Score') delete config.thresholds;

    // If callbacks already exist maintain them.
    if (config.hoverCallbackWrapper === undefined)
        config.hoverCallbackWrapper = getCallbackWrapper(config.hoverCallback);
    if (config.clickCallbackWrapper === undefined)
        config.clickCallbackWrapper = getCallbackWrapper(config.clickCallback);

    return config;
}
