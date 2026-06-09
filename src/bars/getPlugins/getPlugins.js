import buildTooltip from './buildTooltip.js';
import dynamicCategoryLegendOnClick from './dynamicCategoryLegendOnClick.js';

/**
 * Build Chart.js plugins configuration from the merged spec.
 *
 * The legend title defaults to the fill mapping variable name.
 * Set scales.fill.label to null or '' to disable the legend title.
 *
 * When theme.dynamicCategoryAxis is true, a custom legend onClick handler is
 * attached that subsets the categorical axis to only include categories present
 * in the remaining visible fill groups after each toggle.
 *
 * @param {Object} spec - merged spec
 * @returns {Object} Chart.js plugins config
 */
export default function getPlugins(spec) {
    const { labels, mapping, scales, tooltip, theme, position } = spec;

    const fillLabel =
        scales.fill?.label !== undefined ? scales.fill.label : mapping?.fill;

    const legend = {
        display: !!mapping.fill,
        title: {
            display: !!fillLabel,
            text: fillLabel || '',
        },
    };

    if (theme?.dynamicCategoryAxis) {
        legend.onClick = dynamicCategoryLegendOnClick;
    }

    return {
        title: {
            display: !!labels.title,
            text: labels.title || '',
        },
        tooltip: buildTooltip(tooltip, position),
        legend,
        datalabels: {
            display: false,
        },
    };
}
