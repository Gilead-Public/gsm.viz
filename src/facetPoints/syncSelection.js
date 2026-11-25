import {
    clearSelection,
    getSelection,
    selectGroup,
    selectPoint,
} from '../points/selection.js';

function getPointKeys(chart) {
    return new Set(
        chart.data.datasets
            .filter((dataset) => !dataset._annotation)
            .flatMap((dataset) => dataset.data)
            .map((point) => point._key)
    );
}

function getGroupValues(chart) {
    const declared = chart.data._spec_.scales.color.order || [];
    const rendered = chart.data.datasets
        .filter(
            (dataset) =>
                !dataset._annotation &&
                Object.prototype.hasOwnProperty.call(dataset, '_color')
        )
        .map((dataset) => (dataset._colorMissing ? null : dataset._color));

    return new Set([...declared, ...rendered]);
}

function clearSibling(sibling) {
    clearSelection(sibling, undefined, { _silent: true });
}

// Silent mirrors bypass onSelect, so record each chart's actual selection.
function rememberSelection(chart) {
    chart._facetPointsSelectionMemory = {
        type: getSelection(chart).type,
        hasKey: Boolean(chart.data._spec_.mapping.key),
    };
}

function mirrorSelection(sibling, origin, selection) {
    if (selection.type === null) {
        clearSibling(sibling);
        return;
    }

    if (selection.type === 'point') {
        if (
            !origin.data._spec_.mapping.key ||
            !sibling.data._spec_.mapping.key
        ) {
            clearSibling(sibling);
            return;
        }

        const known = getPointKeys(sibling);
        const values = selection.values.filter((value) => known.has(value));
        if (values.length) {
            selectPoint(sibling, values, undefined, { _silent: true });
        } else {
            clearSibling(sibling);
        }
        return;
    }

    if (selection.type === 'group') {
        if (!sibling.data._spec_.mapping.color) {
            clearSibling(sibling);
            return;
        }

        const known = getGroupValues(sibling);
        const values = selection.values.filter((value) => known.has(value));
        if (values.length) {
            selectGroup(sibling, values, undefined, { _silent: true });
        } else {
            clearSibling(sibling);
        }
        return;
    }

    throw new Error(
        `facetPoints cannot synchronize selection type ${selection.type}`
    );
}

function synchronizeSelection(charts, origin, selection, previous) {
    // Point selections (and clears of them) are keyed; unkeyed siblings keep
    // facet-local point selections and only drop a mirrored group selection.
    const pointSync =
        selection.type === 'point' ||
        (selection.type === null && previous.type === 'point');

    charts.forEach((sibling) => {
        if (sibling === origin || !sibling.canvas) return;

        if (pointSync && !sibling.data._spec_.mapping.key) {
            if (getSelection(sibling).type === 'group') clearSibling(sibling);
        } else {
            mirrorSelection(sibling, origin, selection);
        }
        rememberSelection(sibling);
    });
}

function dropMirroredGroups(charts, origin) {
    charts.forEach((sibling) => {
        if (sibling === origin || !sibling.canvas) return;
        if (getSelection(sibling).type === 'group') {
            clearSibling(sibling);
            rememberSelection(sibling);
        }
    });
}

function propagateSelection(charts, chart, selection, previous) {
    const hasKey = Boolean(chart.data._spec_.mapping.key);
    const skipPointSync =
        (selection.type === 'point' && !hasKey) ||
        (selection.type === null &&
            previous.type === 'point' &&
            !previous.hasKey);

    if (!skipPointSync) {
        synchronizeSelection(charts, chart, selection, previous);
    } else if (previous.type === 'group') {
        dropMirroredGroups(charts, chart);
    }
}

/**
 * Propagate a selection that a chart rebuild cleared without onSelect.
 * Must run before syncSelection re-records the chart's selection memory.
 *
 * @param {Object[]} charts - Child points charts.
 * @param {Object} chart - Updated child chart.
 */
export function propagateDroppedSelection(charts, chart) {
    const previous = chart._facetPointsSelectionMemory;
    if (!previous || previous.type === null) return;
    if (getSelection(chart).type !== null) return;

    rememberSelection(chart);
    propagateSelection(charts, chart, { type: null, values: [] }, previous);
}

/**
 * Synchronize helper, pointer, and keyboard selection through onSelect.
 *
 * @param {Object[]} charts - Child points charts.
 */
export default function syncSelection(charts) {
    charts.forEach((chart) => {
        const current = chart.data._spec_.callbacks.onSelect;
        const callback =
            current === chart._facetPointsSelectionSyncWrapper
                ? chart._facetPointsSelectionOriginal
                : current;
        rememberSelection(chart);

        const wrapper = (selection, event) => {
            const previous = chart._facetPointsSelectionMemory;
            rememberSelection(chart);
            propagateSelection(charts, chart, selection, previous);
            callback?.(selection, event);
        };
        chart._facetPointsSelectionOriginal = callback;
        chart._facetPointsSelectionSyncWrapper = wrapper;
        chart.data._spec_.callbacks.onSelect = wrapper;
    });
}
