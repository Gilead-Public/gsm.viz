import {
    announceActivePoint,
    clearSelection,
    dismissActivePoint,
    togglePointSelection,
} from './selection.js';

let statusId = 0;

function getPointLocations(chart) {
    return chart.data.datasets
        .flatMap((dataset, datasetIndex) =>
            dataset._annotation
                ? []
                : dataset.data.map((point, index) => ({
                      datasetIndex,
                      index,
                      point,
                  }))
        )
        .filter(({ datasetIndex }) => chart.isDatasetVisible(datasetIndex))
        .sort((a, b) => a.point._index - b.point._index);
}

function getPosition(chart, location) {
    const element = chart.getDatasetMeta(location.datasetIndex).data[
        location.index
    ];
    return typeof element?.getCenterPoint === 'function'
        ? element.getCenterPoint()
        : { x: element?.x ?? 0, y: element?.y ?? 0 };
}

function activate(chart, location) {
    const descriptor = {
        datasetIndex: location.datasetIndex,
        index: location.index,
    };
    chart.setActiveElements([descriptor]);
    chart.tooltip?.setActiveElements(
        [descriptor],
        getPosition(chart, location)
    );
    chart.data._selectionState_.keyboardIndex = location.point._index;
    chart.update('none');
    announceActivePoint(chart, location.point);
}

function move(chart, direction) {
    const locations = getPointLocations(chart);
    if (locations.length === 0) return false;

    const state = chart.data._selectionState_;
    const current = locations.findIndex(
        ({ point }) => point._index === state.keyboardIndex
    );
    const next =
        current === -1
            ? direction > 0
                ? 0
                : locations.length - 1
            : (current + direction + locations.length) % locations.length;

    activate(chart, locations[next]);
    return true;
}

function getActiveLocation(chart) {
    const locations = getPointLocations(chart);
    const state = chart.data._selectionState_;
    return locations.find(({ point }) => point._index === state.keyboardIndex);
}

function visuallyHide(element) {
    Object.assign(element.style, {
        position: 'absolute',
        width: '1px',
        height: '1px',
        padding: '0',
        margin: '-1px',
        overflow: 'hidden',
        clip: 'rect(0, 0, 0, 0)',
        whiteSpace: 'nowrap',
        border: '0',
    });
}

function addStatus(canvas) {
    const status = document.createElement('span');
    status.id = `gsm-points-status-${++statusId}`;
    status.className = 'gsm-points-live-status';
    status.setAttribute('role', 'status');
    status.setAttribute('aria-live', 'polite');
    status.setAttribute('aria-atomic', 'true');
    visuallyHide(status);

    if (canvas.parentNode) {
        canvas.parentNode.insertBefore(status, canvas.nextSibling);
    } else {
        canvas.appendChild(status);
    }
    return status;
}

/**
 * Enable source-order point traversal and selection on a chart canvas.
 *
 * @param {Object} chart - Chart.js chart instance.
 */
export function setupKeyboardSelection(chart) {
    if (!chart.data._spec_.selection.enabled) return;

    const { canvas } = chart;
    const state = (chart.data._selectionState_ ||= {});
    state.selection ||= { type: null, values: [] };
    const previous = {
        tabindex: canvas.getAttribute('tabindex'),
        role: canvas.getAttribute('role'),
        roledescription: canvas.getAttribute('aria-roledescription'),
        keyshortcuts: canvas.getAttribute('aria-keyshortcuts'),
    };
    const liveRegion = addStatus(canvas);

    canvas.tabIndex = 0;
    canvas.setAttribute('role', 'application');
    canvas.setAttribute('aria-roledescription', 'interactive point chart');
    canvas.setAttribute(
        'aria-keyshortcuts',
        'ArrowLeft ArrowRight ArrowUp ArrowDown Enter Escape'
    );
    state.liveRegion = liveRegion;

    const onKeyDown = (event) => {
        const directions = {
            ArrowLeft: -1,
            ArrowUp: -1,
            ArrowRight: 1,
            ArrowDown: 1,
        };

        if (Object.prototype.hasOwnProperty.call(directions, event.key)) {
            if (move(chart, directions[event.key])) event.preventDefault();
            return;
        }

        if (event.key === 'Enter') {
            let active = getActiveLocation(chart);
            if (!active) {
                const [first] = getPointLocations(chart);
                if (!first) return;
                activate(chart, first);
                active = first;
            }
            event.preventDefault();
            togglePointSelection(chart, active.point._key, event);
            return;
        }

        if (event.key === 'Escape') {
            if (state.selection?.type !== null) {
                event.preventDefault();
                clearSelection(chart, event);
            } else if (state.keyboardIndex !== undefined) {
                event.preventDefault();
                dismissActivePoint(chart);
            }
        }
    };

    canvas.addEventListener('keydown', onKeyDown);
    state.cleanupKeyboard = () => {
        canvas.removeEventListener('keydown', onKeyDown);
        liveRegion.remove();

        Object.entries(previous).forEach(([attribute, value]) => {
            const name = ['tabindex', 'role'].includes(attribute)
                ? attribute
                : `aria-${attribute}`;
            if (value === null) canvas.removeAttribute(name);
            else canvas.setAttribute(name, value);
        });

        delete state.liveRegion;
        delete state.cleanupKeyboard;
    };
}

/**
 * Match keyboard DOM/listeners to the current merged selection spec.
 *
 * @param {Object} chart - Chart.js chart instance.
 */
export function syncKeyboardSelection(chart) {
    const state = chart.data._selectionState_;

    if (chart.data._spec_.selection.enabled) {
        if (!state?.cleanupKeyboard) setupKeyboardSelection(chart);
    } else {
        state?.cleanupKeyboard?.();
    }
}

/**
 * Clean up keyboard-only DOM and listeners when Chart.js is destroyed.
 *
 * @returns {Object} Chart.js plugin.
 */
export function selectionAccessibilityPlugin() {
    return {
        id: 'pointsSelectionAccessibility',
        afterDestroy(chart) {
            chart.data?._selectionState_?.cleanupKeyboard?.();
        },
    };
}
