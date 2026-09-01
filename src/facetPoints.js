import points from './points.js';

import buildSubSpec from './facetPoints/buildSubSpec.js';
import computeGlobalScales from './facetPoints/computeGlobalScales.js';
import {
    applyGlobalStyles,
    getGlobalStyles,
} from './facetPoints/globalStyles.js';
import mergeSpec from './facetPoints/mergeSpec.js';
import renderGrid from './facetPoints/renderGrid.js';
import splitData from './facetPoints/splitData.js';
import syncHover from './facetPoints/syncHover.js';
import syncLegendClicks from './facetPoints/syncLegendClicks.js';
import syncSelection from './facetPoints/syncSelection.js';
import syncUpdates from './facetPoints/syncUpdates.js';
import validateSpec from './facetPoints/validateSpec.js';

/**
 * Render ordered point-chart small multiples with linked interactions.
 *
 * @param {(Node|string)} element - Grid host or CSS selector.
 * @param {Array} data - Source rows.
 * @param {Object} spec - Points spec with a required facet block.
 * @returns {{charts: Object[], container: Element}} Child charts and grid.
 */
export default function facetPoints(element = 'body', data = [], spec = {}) {
    validateSpec(data, spec);

    let parent = element;
    if (typeof parent === 'string') {
        parent = document.querySelector(parent);
        if (!parent) {
            throw new Error(
                `facetPoints: could not find element matching "${element}"`
            );
        }
    }

    const merged = mergeSpec(data, spec);
    const facets = splitData(data, merged.facet.field, merged.facet.order);
    const globalScales = computeGlobalScales(facets, merged);
    const globalStyles = getGlobalStyles(facets, merged);
    const facetValues = [...facets.keys()];
    const { containers, grid } = renderGrid(parent, facetValues, merged);
    const charts = [];

    try {
        facetValues.forEach((facetValue) => {
            const chart = points(
                containers.get(facetValue),
                facets.get(facetValue),
                buildSubSpec(facetValue, merged, globalScales, globalStyles)
            );
            charts.push(chart);

            chart.options.plugins.legend.display =
                merged.facet.legend.display &&
                chart.options.plugins.legend.display;
            applyGlobalStyles(chart, globalStyles.templates);
        });

        syncHover(charts);
        syncSelection(charts);
        syncLegendClicks(charts, { sync: merged.facet.legend.sync });
        syncUpdates(charts, globalStyles.templates, merged.facet.legend);
    } catch (error) {
        charts.forEach((chart) => chart.destroy());
        grid.remove();
        throw error;
    }

    return { charts, container: grid };
}
