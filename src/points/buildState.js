import validateSpec from './validateSpec.js';
import mergeSpec from './mergeSpec.js';
import structureData from './structureData.js';
import structureLines from './structureLines.js';
import getScales from './getScales.js';
import getPlugins from './getPlugins.js';
import getPointInteractionMode from './pointInteractionMode.js';
import { getAccessibleLabel } from './accessibility.js';

/**
 * Run the complete pure points configuration pipeline.
 *
 * @param {Array} data - Source point rows.
 * @param {Object} spec - Public points specification.
 * @param {boolean} [validated=false] - Skip duplicate public validation.
 * @returns {Object} Prepared chart state.
 */
export default function buildState(data, spec, validated = false) {
    if (!validated) validateSpec(data, spec);

    const merged = mergeSpec(data, spec);
    const chartData = structureData(merged);
    chartData.datasets.push(...structureLines(merged));

    return {
        merged,
        chartData,
        scales: getScales(merged),
        plugins: getPlugins(merged),
        interaction: merged.annotations.lines.length
            ? { mode: getPointInteractionMode('point') }
            : undefined,
        accessibleLabel: getAccessibleLabel(merged, chartData, data.length),
    };
}
