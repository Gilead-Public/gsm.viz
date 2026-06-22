import buildTooltip from './buildTooltip.js';
import dataLabels from './dataLabels.js';
import dynamicCategoryLegendOnClick from './dynamicCategoryLegendOnClick.js';
import referenceLines from './referenceLines.js';

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

    const captionsRaw = labels.captions;
    const captionsArray = Array.isArray(captionsRaw)
        ? [...captionsRaw]
        : captionsRaw != null && captionsRaw !== ''
        ? [captionsRaw]
        : [];

    // Auto-inject a caption when nCategories is active with 'total' sort (or
    // the default) and some categories are excluded.
    const nExcluded = spec._nExcluded;
    const nRowsExcluded = spec._nRowsExcluded ?? 0;
    const origN = spec._originalNCategories;
    if (
        spec.nCategories &&
        (scales.x?.sort === 'total' || scales.x?.sort === undefined) &&
        nExcluded > 0
    ) {
        const xLabel = scales.x?.label || mapping?.x || 'category';
        const sort = scales.x?.sort ?? 'total';
        const rowsNote =
            nRowsExcluded > 0
                ? ` (${nRowsExcluded.toLocaleString()} records)`
                : '';
        const clickNote =
            spec.interactive !== false ? ' Click to show all.' : '';
        captionsArray.push(
            `Displaying top ${spec.nCategories} values of ${xLabel} by ${sort}. Remaining ${nExcluded} values of ${xLabel} are hidden${rowsNote}.${clickNote}`
        );
    } else if (origN && !spec.nCategories) {
        const xLabel = scales.x?.label || mapping?.x || 'category';
        const clickNote =
            spec.interactive !== false
                ? ` Click to show top ${origN}.`
                : '';
        captionsArray.push(
            `Showing all values of ${xLabel}.${clickNote}`
        );
    }

    return {
        title: {
            display: !!labels.title,
            text: labels.title || '',
        },
        subtitle: {
            display: captionsArray.length > 0,
            position: 'bottom',
            align: 'start',
            ...labels.captionsOptions,
            text: captionsArray,
        },
        annotation: {
            annotations: referenceLines(spec),
            clip: false,
        },
        tooltip: buildTooltip(tooltip, position),
        legend,
        datalabels: dataLabels(spec),
    };
}
