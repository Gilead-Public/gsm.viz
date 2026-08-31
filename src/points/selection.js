import { withOpacityFactor } from './styleData.js';

const MISSING_GROUP_VALUE = null;

function getMainDatasets(chart) {
    return chart.data.datasets
        .map((dataset, datasetIndex) => ({ dataset, datasetIndex }))
        .filter(({ dataset }) => !dataset._annotation);
}

function getPoints(chart) {
    return getMainDatasets(chart).flatMap(({ dataset }) => dataset.data);
}

function ensureState(chart) {
    chart.data._selectionState_ ||= {};
    chart.data._selectionState_.selection ||= {
        type: null,
        values: [],
    };
    return chart.data._selectionState_;
}

function normalizeValues(values, name, allowMissing = false) {
    const normalized = Array.isArray(values) ? [...values] : [values];

    normalized.forEach((value) => {
        if (
            !(allowMissing && value === MISSING_GROUP_VALUE) &&
            typeof value !== 'string' &&
            (typeof value !== 'number' || !Number.isFinite(value))
        ) {
            const requirement = allowMissing
                ? 'strings, finite numbers, or null'
                : 'strings or finite numbers';
            throw new Error(`points ${name} values must be ${requirement}`);
        }
    });

    return [...new Set(normalized)];
}

function validateKnownValues(values, knownValues, name, valueName) {
    values.forEach((value) => {
        if (!knownValues.has(value)) {
            throw new Error(
                `points ${name} could not find ${valueName} ${JSON.stringify(
                    value
                )}`
            );
        }
    });
}

function getResolvedColor(chart, datasetIndex, pointIndex, property) {
    return chart.getDatasetMeta(datasetIndex).data[pointIndex]?.options?.[
        property
    ];
}

function prepareResolvedStyles(chart) {
    const needsUpdate = getMainDatasets(chart).some(
        ({ dataset, datasetIndex }) =>
            dataset.data.length > 0 &&
            (!chart.getDatasetMeta(datasetIndex).controller ||
                chart.getDatasetMeta(datasetIndex).data.length <
                    dataset.data.length)
    );

    if (needsUpdate) chart.update('none');
}

function getPointColor(pointIndex, original, property, fallback) {
    const raw = original[property];
    const value = Array.isArray(raw) ? raw[pointIndex] : raw;

    return value ?? original.resolved[property][pointIndex] ?? fallback;
}

function storeOriginalStyles(chart) {
    const state = ensureState(chart);
    if (state.originalStyles) return;

    prepareResolvedStyles(chart);
    state.originalStyles = chart.data.datasets.map((dataset, datasetIndex) =>
        dataset._annotation
            ? null
            : {
                  backgroundColor: dataset.backgroundColor,
                  borderColor: dataset.borderColor,
                  resolved: {
                      backgroundColor: dataset.data.map((_point, pointIndex) =>
                          getResolvedColor(
                              chart,
                              datasetIndex,
                              pointIndex,
                              'backgroundColor'
                          )
                      ),
                      borderColor: dataset.data.map((_point, pointIndex) =>
                          getResolvedColor(
                              chart,
                              datasetIndex,
                              pointIndex,
                              'borderColor'
                          )
                      ),
                  },
              }
    );
    const fallback = chart.data._spec_.scales.color.palette[0];
    state.legendStyles = new Map();
    getMainDatasets(chart).forEach(({ datasetIndex }) => {
        const original = state.originalStyles[datasetIndex];
        state.legendStyles.set(datasetIndex, {
            fillStyle: getPointColor(0, original, 'backgroundColor', fallback),
            strokeStyle: getPointColor(0, original, 'borderColor', fallback),
        });
    });
    (chart.legend?.legendItems || []).forEach((item) => {
        state.legendStyles.set(item.datasetIndex, {
            fillStyle: item.fillStyle,
            strokeStyle: item.strokeStyle,
        });
    });
}

function getGroupValue(dataset) {
    return dataset._colorMissing ? MISSING_GROUP_VALUE : dataset._color;
}

function getGroupValues(chart) {
    return getMainDatasets(chart)
        .map(({ dataset }) => dataset)
        .filter((dataset) =>
            Object.prototype.hasOwnProperty.call(dataset, '_color')
        )
        .map(getGroupValue);
}

function isSelected(point, dataset, selection, selectedValues) {
    const value =
        selection.type === 'point' ? point._key : getGroupValue(dataset);
    return selectedValues.has(value);
}

function applySelectionStyles(chart) {
    const state = ensureState(chart);
    const opacity = chart.data._spec_.selection.opacity;
    const fallback = chart.data._spec_.scales.color.palette[0];
    const selectedValues = new Set(state.selection.values);

    getMainDatasets(chart).forEach(({ dataset, datasetIndex }) => {
        const original = state.originalStyles[datasetIndex];
        dataset.backgroundColor = dataset.data.map((point, pointIndex) => {
            const color = getPointColor(
                pointIndex,
                original,
                'backgroundColor',
                fallback
            );
            return isSelected(point, dataset, state.selection, selectedValues)
                ? color
                : withOpacityFactor(color, opacity);
        });
        dataset.borderColor = dataset.data.map((point, pointIndex) => {
            const color = getPointColor(
                pointIndex,
                original,
                'borderColor',
                fallback
            );
            return isSelected(point, dataset, state.selection, selectedValues)
                ? color
                : withOpacityFactor(color, opacity);
        });
    });
}

function restoreOriginalStyles(chart) {
    const state = ensureState(chart);
    if (!state.originalStyles) return;

    getMainDatasets(chart).forEach(({ dataset, datasetIndex }) => {
        const original = state.originalStyles[datasetIndex];
        dataset.backgroundColor = original.backgroundColor;
        dataset.borderColor = original.borderColor;
    });

    delete state.originalStyles;
    delete state.legendStyles;
}

function findPointLocation(chart, key) {
    for (const { dataset, datasetIndex } of getMainDatasets(chart)) {
        const index = dataset.data.findIndex((point) => point._key === key);
        if (index !== -1) return { datasetIndex, index };
    }
    return undefined;
}

function getElementPosition(chart, location) {
    const element = chart.getDatasetMeta(location.datasetIndex).data[
        location.index
    ];

    if (typeof element?.getCenterPoint === 'function') {
        return element.getCenterPoint();
    }

    return { x: element?.x ?? 0, y: element?.y ?? 0 };
}

function setActivePoint(chart, key, chartActive = true) {
    const location = findPointLocation(chart, key);
    if (!location || !chart.isDatasetVisible(location.datasetIndex)) {
        return undefined;
    }
    const meta = chart.getDatasetMeta(location.datasetIndex);
    if (!meta.controller || !meta.data[location.index]) return location;

    if (chartActive) chart.setActiveElements([location]);
    chart.tooltip?.setActiveElements(
        [location],
        getElementPosition(chart, location)
    );

    return location;
}

function clearTooltip(chart) {
    chart.tooltip?.setActiveElements([], { x: 0, y: 0 });
}

function clearActivePoint(chart) {
    chart.setActiveElements([]);
    clearTooltip(chart);
}

function setKeyboardIndex(chart, key) {
    const location = findPointLocation(chart, key);
    if (!location) return;

    const point =
        chart.data.datasets[location.datasetIndex].data[location.index];
    ensureState(chart).keyboardIndex = point._index;
}

function formatValues(values) {
    return values
        .map((value) => `${String(value)} (${typeof value})`)
        .join(', ');
}

function announce(chart, message) {
    const liveRegion = chart.data._selectionState_?.liveRegion;
    if (liveRegion) liveRegion.textContent = message;
}

function announceSelection(chart, selection) {
    if (selection.type === null) {
        announce(chart, 'Selection cleared.');
        return;
    }

    const noun = selection.type === 'point' ? 'point' : 'group';
    const label = selection.values.length === 1 ? noun : `${noun}s`;
    announce(chart, `Selected ${label} ${formatValues(selection.values)}.`);
}

function fireOnSelect(chart, selection, event) {
    const callback = chart.data._spec_.callbacks.onSelect;
    if (callback) callback(selection, event);
}

function setSelection(chart, type, values, event, options) {
    storeOriginalStyles(chart);
    const state = ensureState(chart);
    state.selection = { type, values: [...values] };
    applySelectionStyles(chart);
    const activeKey = options?._activeKey;
    const fromKeyboard = event?.type === 'keydown' && activeKey !== undefined;

    if (fromKeyboard) {
        if (activeKey !== undefined) setKeyboardIndex(chart, activeKey);
        if (type === 'point' && values.length === 1) {
            if (!setActivePoint(chart, values[0], false)) clearTooltip(chart);
        }
    } else if (activeKey !== undefined) {
        setKeyboardIndex(chart, activeKey);
        if (!setActivePoint(chart, activeKey)) clearActivePoint(chart);
    } else if (type === 'point' && values.length === 1) {
        setKeyboardIndex(chart, values[0]);
        if (!setActivePoint(chart, values[0])) clearActivePoint(chart);
    } else {
        clearActivePoint(chart);
        delete state.keyboardIndex;
    }

    chart.update('none');
    const selection = getSelection(chart);
    announceSelection(chart, selection);
    if (!options?._silent) fireOnSelect(chart, selection, event);
}

/**
 * Select one or more points by their mapped key or source-row index.
 *
 * @param {Object} chart - Chart.js chart instance.
 * @param {string|number|Array<string|number>} values - Point keys.
 * @param {Object} [event] - Event that triggered the selection.
 * @param {Object} [options] - Internal synchronization options.
 * @param {boolean} [options._silent] - Suppress the onSelect callback.
 */
export function selectPoint(chart, values, event, options) {
    const normalized = normalizeValues(values, 'selectPoint');
    if (normalized.length === 0) {
        clearSelection(chart, event, options);
        return;
    }
    validateKnownValues(
        normalized,
        new Set(getPoints(chart).map((point) => point._key)),
        'selectPoint',
        'key'
    );
    setSelection(chart, 'point', normalized, event, options);
}

/**
 * Select one or more color groups.
 *
 * @param {Object} chart - Chart.js chart instance.
 * @param {string|number|null|Array<string|number|null>} values - Color-group values.
 * @param {Object} [event] - Event that triggered the selection.
 * @param {Object} [options] - Internal synchronization options.
 * @param {boolean} [options._silent] - Suppress the onSelect callback.
 */
export function selectGroup(chart, values, event, options) {
    if (!chart.data._spec_.mapping.color) {
        throw new Error(
            'points selectGroup requires spec.mapping.color to be configured'
        );
    }

    const normalized = normalizeValues(values, 'selectGroup', true);
    if (normalized.length === 0) {
        clearSelection(chart, event, options);
        return;
    }
    validateKnownValues(
        normalized,
        new Set(getGroupValues(chart)),
        'selectGroup',
        'group'
    );
    setSelection(chart, 'group', normalized, event, options);
}

/**
 * Clear selection and restore the exact source dataset styles.
 *
 * @param {Object} chart - Chart.js chart instance.
 * @param {Object} [event] - Event that triggered the clear.
 * @param {Object} [options] - Internal synchronization options.
 * @param {boolean} [options._silent] - Suppress the onSelect callback.
 */
export function clearSelection(chart, event, options) {
    const state = chart.data._selectionState_;
    if (!state?.selection || state.selection.type === null) return;

    state.selection = { type: null, values: [] };
    restoreOriginalStyles(chart);
    if (event?.type === 'keydown' && event.key === 'Enter') {
        clearTooltip(chart);
    } else {
        clearActivePoint(chart);
        delete state.keyboardIndex;
    }
    chart.update('none');
    const selection = getSelection(chart);
    announceSelection(chart, selection);
    if (!options?._silent) fireOnSelect(chart, selection, event);
}

/**
 * Return a defensive copy of the current serializable selection.
 *
 * @param {Object} chart - Chart.js chart instance.
 * @returns {{type: 'point'|'group'|null, values: Array<string|number|null>}}
 */
export function getSelection(chart) {
    const selection = chart.data._selectionState_?.selection;
    return selection
        ? { type: selection.type, values: [...selection.values] }
        : { type: null, values: [] };
}

/**
 * Toggle one point using the chart's single/multiple interaction setting.
 *
 * @param {Object} chart - Chart.js chart instance.
 * @param {string|number} key - Point key.
 * @param {Object} [event] - Event that triggered the toggle.
 */
export function togglePointSelection(chart, key, event) {
    const current = getSelection(chart);
    const multiple = chart.data._spec_.selection.multiple;
    const options = { _activeKey: key };

    if (current.type === 'point' && current.values.includes(key)) {
        const remaining = current.values.filter((value) => value !== key);
        if (!multiple || remaining.length === 0) {
            clearSelection(chart, event);
        } else {
            selectPoint(chart, remaining, event, options);
        }
    } else if (multiple && current.type === 'point') {
        selectPoint(chart, [...current.values, key], event, options);
    } else {
        selectPoint(chart, key, event, options);
    }
}

/**
 * Dismiss a keyboard-active point when no selection needs clearing.
 *
 * @param {Object} chart - Chart.js chart instance.
 */
export function dismissActivePoint(chart) {
    const state = ensureState(chart);
    clearActivePoint(chart);
    delete state.keyboardIndex;
    chart.update('none');
    announce(chart, 'Active point cleared.');
}

/**
 * Clear stale selection/activity before datasets are replaced in place.
 *
 * @param {Object} chart - Chart.js chart instance.
 */
export function resetSelectionForUpdate(chart) {
    const state = chart.data._selectionState_;
    const hadSelection = state?.selection?.type !== null;
    const hadKeyboardPoint = state?.keyboardIndex !== undefined;
    const hadActivePoint =
        chart.getActiveElements().length > 0 ||
        (chart.tooltip?.getActiveElements().length || 0) > 0;

    chart.setActiveElements([]);
    clearTooltip(chart);

    if (!state) return;
    state.selection = { type: null, values: [] };
    delete state.originalStyles;
    delete state.legendStyles;
    delete state.keyboardIndex;
    if (hadSelection) {
        announce(chart, 'Selection cleared.');
    } else if (hadKeyboardPoint || hadActivePoint) {
        announce(chart, 'Active point cleared.');
    }
}

/**
 * Preserve undimmed legend swatches while per-point selection colors are active.
 *
 * @returns {Object} Chart.js plugin.
 */
export function selectionLegendPlugin() {
    const restoreLegend = (chart) => {
        const state = chart.data._selectionState_;
        if (!state?.legendStyles || !chart.legend?.legendItems) return;

        chart.legend.legendItems.forEach((item) => {
            const original = state.legendStyles.get(item.datasetIndex);
            if (!original) return;
            item.fillStyle = original.fillStyle;
            item.strokeStyle = original.strokeStyle;
        });
    };

    return {
        id: 'pointsSelectionLegend',
        afterUpdate: restoreLegend,
        beforeDraw: restoreLegend,
    };
}

function hasLocation(elements, location) {
    return (
        elements.length === 1 &&
        elements[0].datasetIndex === location.datasetIndex &&
        elements[0].index === location.index
    );
}

function reconcileSelectedPoint(
    chart,
    forcePosition = false,
    preserveKeyboardCursor = false
) {
    const selection = getSelection(chart);
    if (selection.type !== 'point' || selection.values.length !== 1) {
        return false;
    }

    const location = findPointLocation(chart, selection.values[0]);
    if (!location || !chart.isDatasetVisible(location.datasetIndex)) {
        const hadActivity =
            chart.getActiveElements().length > 0 ||
            (chart.tooltip?.getActiveElements().length || 0) > 0;
        if (hadActivity) clearActivePoint(chart);
        return hadActivity;
    }

    const chartActive = chart.getActiveElements();
    const tooltipActive = chart.tooltip?.getActiveElements() || [];
    if (
        !forcePosition &&
        hasLocation(chartActive, location) &&
        hasLocation(tooltipActive, location)
    ) {
        return false;
    }

    const state = ensureState(chart);
    const selectedPoint =
        chart.data.datasets[location.datasetIndex].data[location.index];
    const activePoint =
        chartActive.length === 1
            ? chart.data.datasets[chartActive[0].datasetIndex]?.data[
                  chartActive[0].index
              ]
            : undefined;
    const keyboardIsActive =
        preserveKeyboardCursor &&
        activePoint?._index === state.keyboardIndex &&
        state.keyboardIndex !== selectedPoint._index;
    setActivePoint(chart, selection.values[0], !keyboardIsActive);
    return true;
}

/**
 * Reassert a single selected point after Chart.js processes pointer events.
 *
 * @returns {Object} Chart.js plugin.
 */
export function selectionInteractionPlugin() {
    return {
        id: 'pointsSelectionInteraction',
        afterUpdate(chart) {
            reconcileSelectedPoint(chart, true, true);
        },
        afterEvent(chart, args) {
            if (reconcileSelectedPoint(chart)) args.changed = true;
        },
    };
}

export function announceActivePoint(chart, point) {
    announce(
        chart,
        `Active point ${String(point._key)} (${typeof point._key}): x ${
            point.x
        }, y ${point.y}.`
    );
}
