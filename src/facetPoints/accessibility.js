import { setAccessibleLabel } from '../points/accessibility.js';
import { formatFacetValue } from './splitData.js';

function applyFacetContext(chart, state) {
    const currentLabel = chart.canvas.getAttribute('aria-label') || '';
    const baseLabel =
        currentLabel === state.label ? state.baseLabel : currentLabel;
    const facetLabel = `Facet ${state.field}: ${formatFacetValue(
        state.value
    )}.`;
    const label = baseLabel ? `${facetLabel} ${baseLabel}` : facetLabel;

    setAccessibleLabel(chart.canvas, label);
    chart._facetPointsAccessibility = {
        ...state,
        baseLabel,
        label,
    };
}

/**
 * Add facet identity to a child chart's existing points text alternative.
 *
 * @param {Object} chart - Child points chart.
 * @param {string} field - Facet source field.
 * @param {*} value - Canonical typed facet value.
 */
export function setFacetAccessibleLabel(chart, field, value) {
    applyFacetContext(chart, { field, value });
}

/**
 * Restore facet context after a points child rebuilds its base summary.
 *
 * @param {Object} chart - Updated child points chart.
 */
export function refreshFacetAccessibleLabel(chart) {
    if (chart._facetPointsAccessibility) {
        applyFacetContext(chart, chart._facetPointsAccessibility);
    }
}
