/**
 * Build Chart.js plugins configuration from the merged spec.
 *
 * The legend title defaults to the fill mapping variable name.
 * Set scales.fill.label to null or '' to disable the legend title.
 *
 * @param {Object} spec - merged spec
 * @returns {Object} Chart.js plugins config
 */
export default function getPlugins(spec) {
    const { labels, mapping, scales, tooltip } = spec;

    const fillLabel =
        scales.fill?.label !== undefined ? scales.fill.label : mapping?.fill;

    return {
        title: {
            display: !!labels.title,
            text: labels.title || '',
        },
        tooltip: {
            enabled: true,
            ...tooltip,
        },
        legend: {
            display: !!mapping.fill,
            title: {
                display: !!fillLabel,
                text: fillLabel || '',
            },
        },
        datalabels: {
            display: false,
        },
    };
}
