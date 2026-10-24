import validateSpec from './tiles/validateSpec.js';
import mergeSpec from './tiles/mergeSpec.js';
import render from './tiles/render.js';
import { keyOf } from './tiles/structureData.js';

// update methods
import updateData from './tiles/updateData.js';
import updateSpec from './tiles/updateSpec.js';
import { collapseColumn, expandColumn, isExpanded } from './tiles/expansion.js';
import { clearSelection, getState, selectRow } from './tiles/selection.js';

const INTERACTIVE =
    '.gsm-tiles-toggle, .gsm-tiles-row-header, .gsm-tiles-cell, .gsm-tiles-pager button';

function onActivate(chart, event) {
    const target = event.target.closest?.(INTERACTIVE);
    if (!target || !chart.root.contains(target)) return;
    const { callbacks } = chart.spec;

    if (target.classList.contains('gsm-tiles-toggle')) {
        const x = target._gsmTilesX;
        if (isExpanded(chart, x)) collapseColumn(chart, x);
        else expandColumn(chart, x);
        const header = [
            ...chart.root.querySelectorAll('.gsm-tiles-toggle'),
        ].find((th) => keyOf(th._gsmTilesX) === keyOf(x));
        header?.focus();
    } else if (target.classList.contains('gsm-tiles-row-header')) {
        const y = target._gsmTilesY;
        callbacks.onRowClick?.(
            { y, rows: chart._structure.rowData.get(keyOf(y)) ?? [] },
            event
        );
    } else if (target.dataset.step) {
        chart._state.page += Number(target.dataset.step);
        render(chart, { resetScroll: true });
    } else if (target._gsmTilesDatum) {
        callbacks.onClick?.(target._gsmTilesDatum, event);
    }
}

/**
 * Render a heatmap-style grid of tiles (rows × columns) as an HTML table.
 *
 * @param {(Node|string)} element - DOM element or selector
 * @param {Array}  data - compact cell rows (one per row × column)
 * @param {Object} spec - chart specification
 * @param {Object} spec.mapping - { x, y, fill?, label? } field names
 * @param {Object} [spec.scales] - x/y order and labels, fill colors
 * @param {Object} [spec.expand] - detail rows shown when a column expands
 * @param {Object} [spec.tooltip] - { format?, formatter? }
 * @param {Object} [spec.callbacks] - { onClick?, onRowClick?, onExpand? }
 * @param {Object} [spec.rows] - { pageSize? }
 * @param {Object} [spec.labels] - { title?, subtitle? }
 * @param {Object} [spec.theme] - sizing and legend options
 *
 * @returns {Object} chart object with helpers
 */
export default function tiles(element = 'body', data = [], spec = {}) {
    validateSpec(data, spec);

    let el = element;
    if (typeof el === 'string') {
        el = document.querySelector(el);
        if (!el) {
            throw new Error(
                `tiles: could not find element matching "${element}"`
            );
        }
    }

    // Replace any tiles chart previously rendered into this element.
    el.querySelectorAll(':scope > .gsm-tiles').forEach((node) => node.remove());
    const root = el.ownerDocument.createElement('div');
    root.className = 'gsm-tiles';
    el.appendChild(root);

    const merged = mergeSpec(spec);
    const chart = {
        element: el,
        root,
        data,
        spec: merged,
        _state: {
            expanded: [...(merged.expand?.initial ?? [])],
            selected: null,
            page: 1,
        },
        helpers: {
            updateData,
            updateSpec,
            expandColumn,
            collapseColumn,
            selectRow,
            clearSelection,
            getState,
        },
        destroy() {
            root.remove();
        },
    };

    root.addEventListener('click', (event) => onActivate(chart, event));
    root.addEventListener('keydown', (event) => {
        if (
            (event.key === 'Enter' || event.key === ' ') &&
            event.target.matches?.('.gsm-tiles-toggle, .gsm-tiles-row-header')
        ) {
            event.preventDefault();
            onActivate(chart, event);
        }
    });

    render(chart);

    return chart;
}
