import mapThresholdsToFlags from './mapThresholdsToFlags.js';

export default function checkThresholds(_config_, _thresholds_) {
    let thresholds = _config_?.thresholds || _thresholds_ || [];

    if (_config_?.variableThresholds) return null;

    // pre-existing thresholds
    if (
        Array.isArray(thresholds) &&
        thresholds.length > 0 &&
        thresholds.every(
            (Threshold) =>
                typeof Threshold === 'object' &&
                Threshold.hasOwnProperty('Threshold') &&
                Threshold.hasOwnProperty('Flag')
        )
    )
        return thresholds;

    // If more than four non-zero thresholds are provided, return null.
    if (thresholds.filter((Threshold) => Threshold !== 0).length > 4) {
        console.warn(
            'More than four non-zero thresholds present. Threshold annotations will not be displayed.'
        );

        return null;
    }

    return mapThresholdsToFlags(thresholds);
}
