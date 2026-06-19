import bars from './bars.js';

import validateSpec from './facetBars/validateSpec.js';
import mergeSpec from './facetBars/mergeSpec.js';
import splitData from './facetBars/splitData.js';
import computeGlobalScales from './facetBars/computeGlobalScales.js';
import computeGlobalCategories from './facetBars/computeGlobalCategories.js';
import buildSubSpec from './facetBars/buildSubSpec.js';
import renderGrid from './facetBars/renderGrid.js';
import syncCharts from './facetBars/syncCharts.js';

/**
 * Render a faceted set of bar charts — one chart per unique value of a
 * categorical faceting variable — inside a shared CSS-grid container.
 *
 * Charts share a common axis range (constant axes by default) and a common
 * Chart.js legend shown on one designated sub-chart. Hover interactions are
 * linked: highlighting a bar in one chart highlights the matching category
 * bar in all sibling charts.
 *
 * @param {(Node|string)} element - DOM element or CSS selector for the parent container
 * @param {Array}  data - array of plain data objects
 * @param {Object} spec - chart specification (see facetBars docs)
 * @param {Object} spec.mapping  - aesthetic mappings (x, y, fill)
 * @param {Object} spec.facet    - facet configuration
 * @param {string} spec.facet.field - the categorical column to facet by
 *
 * @returns {{ charts: Object[], container: Element }}
 *   charts   - array of Chart.js chart instances, one per facet
 *   container - the grid container DOM element
 */
export default function facetBars(element = 'body', data = [], spec = {}) {
    // Validate inputs
    validateSpec(data, spec);

    // Resolve string selector to DOM node
    let el = element;
    if (typeof el === 'string') {
        el = document.querySelector(el);
        if (!el) {
            throw new Error(
                `facetBars: could not find element matching "${element}"`
            );
        }
    }

    // Merge user spec with defaults
    const merged = mergeSpec(data, spec);

    // Split data into per-facet groups
    const facetDataMap = splitData(
        data,
        merged.facet.field,
        merged.facet.order
    );
    const facetValues = [...facetDataMap.keys()];

    // Compute global axis bounds for constant-scale rendering
    const globalScales = computeGlobalScales(facetDataMap, merged);

    // Compute global category domain for constant x-axis rendering
    const globalCategories = computeGlobalCategories(facetDataMap, merged);

    // Build the CSS grid layout with one sub-container per facet
    const { containers, grid } = renderGrid(el, facetValues, merged);

    // Render one bars chart per facet
    const charts = [];
    for (const facetValue of facetValues) {
        const facetData = facetDataMap.get(facetValue);
        const subSpec = buildSubSpec(facetValue, merged, facetData);
        const container = containers.get(facetValue);
        const chart = bars(container, facetData, subSpec);
        // bars() unconditionally clears el.style.height — re-apply chartHeight
        // so Chart.js fills the intended pixel height.
        if (merged.facet.chartHeight) {
            container.style.height = `${merged.facet.chartHeight}px`;
            chart.resize();
        }
        charts.push(chart);
    }

    // Apply constant scale bounds, constant category domain, and legend
    // visibility in a single update pass.
    const horizontal = merged.orientation === 'horizontal';
    const valueAxisKey = horizontal ? 'x' : 'y';
    const categoryAxisKey = horizontal ? 'y' : 'x';
    const xFree = merged.facet.scales.x.free;
    const yFree = merged.facet.scales.y.free;
    const legendDisplay = merged.facet.legend.display;
    const legendChart = merged.facet.legend.chart;
    const hasFill = !!merged.mapping.fill;

    charts.forEach((chart, i) => {
        let needsUpdate = false;

        // Inject global category domain (only when axis is constant).
        //
        // Setting data.labels alone is insufficient: Chart.js CategoryScale
        // computes its visible range (min/max) from the parsed data indices,
        // which are bounded to the range actually present in each facet's
        // datasets. This would silently trim the axis to the per-facet data
        // range, making constant and free look identical. Explicitly pinning
        // min=0 and max=N-1 forces the full global domain to render on every
        // facet chart, producing visible empty positions for absent categories.
        if (!xFree && globalCategories && globalCategories.length > 0) {
            chart.data.labels = globalCategories;
            chart.options.scales[categoryAxisKey].min = 0;
            chart.options.scales[categoryAxisKey].max =
                globalCategories.length - 1;
            needsUpdate = true;
        }

        // Inject global axis bounds (only when axis is constant and bounds were computed)
        if (!yFree && globalScales.yMax !== undefined) {
            chart.options.scales[valueAxisKey].min = globalScales.yMin;
            chart.options.scales[valueAxisKey].max = globalScales.yMax;
            needsUpdate = true;
        }

        // Control which chart shows the Chart.js legend
        if (hasFill) {
            const facetVal = facetValues[i];
            const showLegend =
                legendDisplay &&
                (legendChart === 'first'
                    ? i === 0
                    : legendChart === 'last'
                    ? i === facetValues.length - 1
                    : facetVal === String(legendChart));
            if (chart.options.plugins.legend.display !== showLegend) {
                chart.options.plugins.legend.display = showLegend;
                needsUpdate = true;
            }
        }

        if (needsUpdate) chart.update('none');
    });

    // Wire cross-chart hover highlight synchronisation
    syncCharts(charts);

    return { charts, container: grid };
}
