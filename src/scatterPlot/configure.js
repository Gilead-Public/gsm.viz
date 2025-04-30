import configureAll from '../util/configure.js';
import checkSelectedGroupIDs from '../util/checkSelectedGroupIDs.js';
import coalesce from '../util/coalesce.js';
import updateSelectedGroupDatum from '../util/updateSelectedGroupDatum.js';
import getCallbackWrapper from '../util/addCanvas/getCallbackWrapper.js';

export default function configure(_config_, _results_) {
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
    defaults.x = 'Denominator';
    defaults[defaults.x] = defaults.x;
    defaults.xType = 'logarithmic';

    // vertical
    defaults.y = 'Numerator';
    defaults[defaults.y] = defaults.y;
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
    defaults.displayLegend = true;
    defaults.displayTrendLine = false;
    defaults.maintainAspectRatio = false;

    const config = configureAll(defaults, _config_, {
        selectedGroupIDs: checkSelectedGroupIDs.bind(
            null,
            _config_?.selectedGroupIDs,
            _results_
        ),
    });

    // Update selected group datum.
    config.selectedGroupDatum = updateSelectedGroupDatum(
        _results_,
        config.selectedGroupIDs
    );

    // configuration-driven settings
    config.xLabel = coalesce(_config_?.xLabel, config[config.x]);
    config.yLabel = coalesce(_config_?.yLabel, config[config.y]);
    config.chartName = `Scatter Plot of ${config.yLabel} by ${config.xLabel}`;

    // If callbacks already exist maintain them.
    if (config.hoverCallbackWrapper === undefined)
        config.hoverCallbackWrapper = getCallbackWrapper(config.hoverCallback);
    if (config.clickCallbackWrapper === undefined)
        config.clickCallbackWrapper = getCallbackWrapper(config.clickCallback);

    return config;
}
