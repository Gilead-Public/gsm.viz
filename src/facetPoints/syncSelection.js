import {
    clearSelection,
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
    return new Set(
        chart.data.datasets
            .filter(
                (dataset) =>
                    !dataset._annotation &&
                    Object.prototype.hasOwnProperty.call(dataset, '_color')
            )
            .map((dataset) => (dataset._colorMissing ? null : dataset._color))
    );
}

function clearSibling(sibling) {
    clearSelection(sibling, undefined, { _silent: true });
}

function synchronizeSelection(charts, origin, selection) {
    charts.forEach((sibling) => {
        if (sibling === origin) return;

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
    });
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

        const wrapper = (selection, event) => {
            synchronizeSelection(charts, chart, selection);
            callback?.(selection, event);
        };
        chart._facetPointsSelectionOriginal = callback;
        chart._facetPointsSelectionSyncWrapper = wrapper;
        chart.data._spec_.callbacks.onSelect = wrapper;
    });
}
