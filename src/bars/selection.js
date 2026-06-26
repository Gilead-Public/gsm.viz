/**
 * Selection/highlight API for the bars module.
 *
 * Supports two selection modes:
 * - category: highlights all bars in selected x-axis categories
 * - segment: highlights specific fill×category intersections
 *
 * Visual effect: selected bars keep original colors; non-selected bars are
 * dimmed to the configured opacity (default 0.2).
 */

/**
 * Convert a hex color to an rgba string with the given alpha.
 * Handles #RGB, #RRGGBB, and existing rgba(...) strings.
 */
function toRgba(color, alpha) {
    if (!color) return `rgba(128, 128, 128, ${alpha})`;

    // Already rgba — replace the alpha
    const rgbaMatch = color.match(
        /^rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*[\d.]+)?\)$/
    );
    if (rgbaMatch) {
        return `rgba(${rgbaMatch[1]}, ${rgbaMatch[2]}, ${rgbaMatch[3]}, ${alpha})`;
    }

    // Hex color
    let hex = color.replace('#', '');
    if (hex.length === 3) {
        hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
    }
    const r = parseInt(hex.slice(0, 2), 16);
    const g = parseInt(hex.slice(2, 4), 16);
    const b = parseInt(hex.slice(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/**
 * Get the category key for a data point based on orientation.
 */
function getCategoryValue(point, orientation) {
    return orientation === 'horizontal' ? point.y : point.x;
}

/**
 * Check if a data point is selected based on current selection state.
 */
function isPointSelected(point, selectionState, orientation) {
    if (!selectionState || selectionState.type === null) return true;

    const category = getCategoryValue(point, orientation);

    if (selectionState.type === 'category') {
        return selectionState.values.includes(category);
    }

    if (selectionState.type === 'segment') {
        const fill = point._fill;
        return selectionState.values.some(
            (seg) =>
                seg.category === category &&
                (seg.fill === undefined || seg.fill === fill)
        );
    }

    return true;
}

/**
 * Store original colors before applying selection dimming.
 */
function storeOriginalColors(chart) {
    if (chart.data._selectionState_?.originalColors) return;

    const originalColors = chart.data.datasets.map((ds) => ({
        backgroundColor: ds.backgroundColor,
        borderColor: ds.borderColor,
    }));

    chart.data._selectionState_ = chart.data._selectionState_ || {};
    chart.data._selectionState_.originalColors = originalColors;
}

/**
 * Apply selection dimming to non-selected bars.
 */
function applySelection(chart) {
    const state = chart.data._selectionState_;
    if (!state || state.selection.type === null) return;

    const spec = chart.data._spec_;
    const opacity = spec.selection?.opacity ?? 0.2;
    const orientation = spec.orientation;

    chart.data.datasets.forEach((ds, dsIndex) => {
        const origBg = state.originalColors[dsIndex].backgroundColor;
        const origBorder = state.originalColors[dsIndex].borderColor;

        // Convert to per-point color arrays
        const bgColors = ds.data.map((point, ptIndex) => {
            const selected = isPointSelected(
                point,
                state.selection,
                orientation
            );
            const pointBg = Array.isArray(origBg)
                ? origBg[ptIndex]
                : origBg;
            return selected ? pointBg : toRgba(pointBg, opacity);
        });

        const borderColors = ds.data.map((point, ptIndex) => {
            const selected = isPointSelected(
                point,
                state.selection,
                orientation
            );
            const pointBorder = Array.isArray(origBorder)
                ? origBorder[ptIndex]
                : origBorder;
            return selected ? pointBorder : toRgba(pointBorder, opacity);
        });

        ds.backgroundColor = bgColors;
        ds.borderColor = borderColors;
    });

    chart.update();
}

/**
 * Restore original colors (remove selection visual).
 */
function removeSelection(chart) {
    const state = chart.data._selectionState_;
    if (!state?.originalColors) return;

    chart.data.datasets.forEach((ds, i) => {
        ds.backgroundColor = state.originalColors[i].backgroundColor;
        ds.borderColor = state.originalColors[i].borderColor;
    });

    delete state.originalColors;
    chart.update();
}

/**
 * Chart.js plugin that ensures legend swatches always display the original
 * (undimmed) dataset colors when a selection is active.
 *
 * Registered as a chart-level plugin during bars() instantiation. Works by
 * patching legend items in the beforeDraw hook — avoids mutating Chart.js's
 * proxied options object which would cause stack overflow.
 */
export function selectionLegendPlugin() {
    return {
        id: 'selectionLegend',
        beforeDraw(chart) {
            const state = chart.data?._selectionState_;
            if (!state?.originalColors || !chart.legend?.legendItems) return;

            chart.legend.legendItems.forEach((item) => {
                const dsIndex = item.datasetIndex;
                if (dsIndex == null || !state.originalColors[dsIndex]) return;
                const orig = state.originalColors[dsIndex];
                const bg = orig.backgroundColor;
                item.fillStyle = Array.isArray(bg) ? bg[0] : bg;
                const border = orig.borderColor;
                item.strokeStyle = Array.isArray(border) ? border[0] : border;
            });
        },
    };
}

/**
 * Fire the onSelect callback if configured.
 */
function fireOnSelect(chart, selection, event) {
    const onSelect = chart.data._spec_?.callbacks?.onSelect;
    if (typeof onSelect === 'function') {
        onSelect(selection, event);
    }
}

// --- Public API ---

/**
 * Select one or more categories (x-axis values).
 * All bars in the selected categories are highlighted.
 *
 * @param {Object} chart - Chart.js instance
 * @param {string|string[]} values - category value(s) to select
 * @param {Object} [event] - optional event that triggered the selection
 */
export function selectCategory(chart, values, event) {
    const valArray = Array.isArray(values) ? values : [values];

    storeOriginalColors(chart);

    chart.data._selectionState_ = chart.data._selectionState_ || {};
    chart.data._selectionState_.selection = {
        type: 'category',
        values: valArray,
    };

    applySelection(chart);

    const selection = getSelection(chart);
    fireOnSelect(chart, selection, event);
}

/**
 * Select one or more specific segments (fill×category intersections).
 *
 * @param {Object} chart - Chart.js instance
 * @param {Object|Object[]} values - segment descriptor(s) { category, fill }
 * @param {Object} [event] - optional event that triggered the selection
 */
export function selectSegment(chart, values, event) {
    const valArray = Array.isArray(values) ? values : [values];

    storeOriginalColors(chart);

    chart.data._selectionState_ = chart.data._selectionState_ || {};
    chart.data._selectionState_.selection = {
        type: 'segment',
        values: valArray,
    };

    applySelection(chart);

    const selection = getSelection(chart);
    fireOnSelect(chart, selection, event);
}

/**
 * Clear all selection and restore original bar colors.
 *
 * @param {Object} chart - Chart.js instance
 * @param {Object} [event] - optional event that triggered the clear
 */
export function clearSelection(chart, event) {
    const state = chart.data._selectionState_;
    if (!state || !state.selection || state.selection.type === null) return;

    state.selection = { type: null, values: [] };
    removeSelection(chart);

    fireOnSelect(chart, { type: null, values: [] }, event);
}

/**
 * Get the current selection state.
 *
 * @param {Object} chart - Chart.js instance
 * @returns {{ type: 'category'|'segment'|null, values: Array }}
 */
export function getSelection(chart) {
    const state = chart.data._selectionState_;
    if (!state || !state.selection) return { type: null, values: [] };
    return { ...state.selection, values: [...state.selection.values] };
}
