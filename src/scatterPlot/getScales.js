import { format } from 'd3';
import getDefaultScales from '../util/getDefaultScales.js';

export default function getScales(config) {
    const scales = getDefaultScales();

    // x
    scales.x.grid.display = true;
    scales.x.ticks = {
        callback: function (value, index, context) {
            const tick = context[index];
            return config.xType !== 'logarithmic' || tick.major
                ? format(',d')(tick.value)
                : null;
        },
    };
    scales.x.title.text =
        config.xType === 'logarithmic'
            ? `${config.xLabel} (Log Scale)`
            : config.xLabel;
    scales.x.type = config.xType;

    // y
    scales.y.title.text = config.yLabel;
    scales.y.type = config.yType;

    return scales;
}
