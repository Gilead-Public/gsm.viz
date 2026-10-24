import getContrastColor from '../bars/structureData/getContrastColor.js';
import defaults from './defaults.js';
import formatTooltip from './formatTooltip.js';
import injectStyle from './injectStyle.js';
import structureData, { keyOf } from './structureData.js';

const px = (value) => (typeof value === 'number' ? `${value}px` : value);

// Labels default to the mapped field; null or '' hides them.
const resolveLabel = (label, field) => (label === undefined ? field : label);

function make(doc, tag, className, text) {
    const node = doc.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
}

function legendGroup(doc, title, fillScale) {
    const values = fillScale.order ?? Object.keys(fillScale.colors);
    if (!values.length) return null;
    const group = make(doc, 'div', 'gsm-tiles-legend-group');
    if (title !== null && title !== undefined && title !== '') {
        group.appendChild(make(doc, 'span', 'gsm-tiles-legend-title', title));
    }
    values.forEach((value) => {
        const item = make(doc, 'span', 'gsm-tiles-legend-item');
        const swatch = make(doc, 'span', 'gsm-tiles-swatch');
        swatch.style.backgroundColor =
            fillScale.colors[keyOf(value)] ?? defaults.neutralFill;
        item.appendChild(swatch);
        item.appendChild(doc.createTextNode(keyOf(value)));
        group.appendChild(item);
    });
    return group;
}

function fillCell(td, { datum, mapping, colors, missing, tooltip, aliases }) {
    if (!datum) {
        td.classList.add('gsm-tiles-missing');
        td.style.backgroundColor = missing;
        return;
    }
    const fill = mapping.fill ? datum[mapping.fill] : undefined;
    const label = mapping.label ? keyOf(datum[mapping.label]) : '';
    const background =
        mapping.fill && colors[keyOf(fill)]
            ? colors[keyOf(fill)]
            : defaults.neutralFill;
    td.style.backgroundColor = background;
    td.style.color = getContrastColor(background);
    td.textContent = label;
    td.title = formatTooltip(tooltip, datum, { ...aliases, fill, label });
    td._gsmTilesDatum = datum;
}

function headerCell(doc, column, expanded, expandable, theme) {
    const th = make(doc, 'th', 'gsm-tiles-col-header');
    const text = keyOf(column.value);
    th.textContent = expandable ? `${text} ${expanded ? '▾' : '▸'}` : text;
    th.title = text;
    th.style.height = px(theme.cellHeight);
    if (expandable) {
        th.classList.add('gsm-tiles-toggle');
        th.setAttribute('role', 'button');
        th.setAttribute('tabindex', '0');
        th.setAttribute('aria-expanded', String(expanded));
        th._gsmTilesX = column.value;
    }
    return th;
}

/**
 * Mark the selected row (`chart._state.selected`) in the rendered table.
 *
 * @param {Object} chart
 */
export function applySelection(chart) {
    const selected = chart._state.selected;
    const key = selected === null ? null : keyOf(selected);
    chart.root.querySelectorAll('tbody tr').forEach((tr) => {
        const isSelected = tr._gsmTilesKey === key;
        tr.classList.toggle('gsm-tiles-selected', isSelected);
        tr.firstChild.setAttribute('aria-pressed', String(isSelected));
    });
}

/**
 * Scroll the grid so the selected row is visible.
 *
 * @param {Object} chart
 */
export function scrollToSelected(chart) {
    const scroller = chart.root.querySelector('.gsm-tiles-scroll');
    const tr = chart.root.querySelector('tr.gsm-tiles-selected');
    if (!scroller || !tr) return;
    const headHeight = scroller.querySelector('thead').offsetHeight;
    const top = tr.offsetTop;
    if (top < scroller.scrollTop + headHeight) {
        scroller.scrollTop = Math.max(0, top - headHeight);
    } else if (
        top + tr.offsetHeight >
        scroller.scrollTop + scroller.clientHeight
    ) {
        scroller.scrollTop = top + tr.offsetHeight - scroller.clientHeight;
    }
}

/**
 * Render (or re-render) the tiles chart into `chart.root`.
 *
 * Prunes state that no longer applies (expanded columns that are gone or not
 * expandable, a selected row that is gone, an out-of-range page).
 *
 * @param {Object} chart
 * @param {Object} [options]
 * @param {boolean} [options.resetScroll=false] - scroll grid back to the top
 */
export default function render(chart, { resetScroll = false } = {}) {
    const { root, spec, data, _state: state } = chart;
    const doc = root.ownerDocument;
    const { mapping, scales, expand, theme } = spec;
    injectStyle(doc);

    const structure = structureData(data, spec);
    chart._structure = structure;

    const expandedKeys = new Set(state.expanded.map(keyOf));
    state.expanded = structure.columns
        .filter((col) => expandedKeys.has(col.key) && col.details.length)
        .map((col) => col.value);
    const isExpanded = (col) =>
        col.details.length > 0 &&
        state.expanded.some((v) => keyOf(v) === col.key);
    const anyExpanded = state.expanded.length > 0;

    if (
        state.selected !== null &&
        !structure.rows.some((row) => row.key === keyOf(state.selected))
    ) {
        state.selected = null;
    }

    const pageSize = spec.rows.pageSize;
    const nRows = structure.rows.length;
    const paged = Boolean(pageSize) && nRows > pageSize;
    const nPages = paged ? Math.ceil(nRows / pageSize) : 1;
    state.page = Math.min(Math.max(1, state.page), nPages);
    const start = paged ? (state.page - 1) * pageSize : 0;
    const pageRows = paged
        ? structure.rows.slice(start, start + pageSize)
        : structure.rows;

    const oldScroller = root.querySelector('.gsm-tiles-scroll');
    const scrollTop = resetScroll ? 0 : oldScroller?.scrollTop ?? 0;
    const scrollLeft = oldScroller?.scrollLeft ?? 0;

    root.replaceChildren();
    root.style.fontSize = px(theme.fontSize);

    if (spec.labels.title) {
        root.appendChild(
            make(doc, 'div', 'gsm-tiles-title', spec.labels.title)
        );
    }
    if (spec.labels.subtitle) {
        root.appendChild(
            make(doc, 'div', 'gsm-tiles-subtitle', spec.labels.subtitle)
        );
    }

    if (theme.legend) {
        const legend = make(doc, 'div', 'gsm-tiles-legend');
        if (mapping.fill) {
            const group = legendGroup(
                doc,
                resolveLabel(scales.fill.label, mapping.fill),
                scales.fill
            );
            if (group) legend.appendChild(group);
        }
        if (anyExpanded && expand.mapping.fill) {
            const group = legendGroup(
                doc,
                resolveLabel(expand.scales.fill.label, expand.mapping.fill),
                expand.scales.fill
            );
            if (group) legend.appendChild(group);
        }
        if (legend.childNodes.length) root.appendChild(legend);
    }

    const xLabel = resolveLabel(scales.x.label, mapping.x);
    if (xLabel) {
        const node = make(doc, 'div', 'gsm-tiles-x-label', xLabel);
        node.style.paddingLeft = px(theme.rowHeaderWidth);
        root.appendChild(node);
    }

    const scroller = make(doc, 'div', 'gsm-tiles-scroll');
    scroller.style.maxHeight = px(theme.maxHeight);
    const table = make(doc, 'table', 'gsm-tiles-table');
    const colgroup = make(doc, 'colgroup');
    const thead = make(doc, 'thead');
    const headRow = make(doc, 'tr');
    const subRow = make(doc, 'tr');
    let tableWidth = theme.rowHeaderWidth;

    const addCol = (width) => {
        const col = make(doc, 'col');
        col.style.width = px(width);
        colgroup.appendChild(col);
        tableWidth += width;
    };
    colgroup.appendChild(make(doc, 'col')).style.width = px(
        theme.rowHeaderWidth
    );

    const corner = make(
        doc,
        'th',
        'gsm-tiles-corner',
        keyOf(resolveLabel(scales.y.label, mapping.y))
    );
    if (anyExpanded) corner.rowSpan = 2;
    headRow.appendChild(corner);

    structure.columns.forEach((col) => {
        const expanded = isExpanded(col);
        const expandable = Boolean(expand) && col.details.length > 0;
        const th = headerCell(doc, col, expanded, expandable, theme);
        headRow.appendChild(th);
        if (expanded) {
            th.colSpan = col.details.length;
            col.details.forEach((detail) => {
                const sub = make(
                    doc,
                    'th',
                    'gsm-tiles-subheader',
                    keyOf(detail)
                );
                sub.style.top = px(theme.cellHeight);
                sub.style.height = px(theme.cellHeight);
                subRow.appendChild(sub);
                addCol(theme.detailCellWidth);
            });
        } else {
            if (anyExpanded) th.rowSpan = 2;
            addCol(theme.cellWidth);
        }
    });
    thead.appendChild(headRow);
    if (anyExpanded) thead.appendChild(subRow);

    const tbody = make(doc, 'tbody');
    const missing = scales.fill.missing;
    pageRows.forEach((row) => {
        const tr = make(doc, 'tr');
        tr._gsmTilesKey = row.key;
        const th = make(doc, 'th', 'gsm-tiles-row-header', keyOf(row.value));
        th.title = keyOf(row.value);
        th.setAttribute('role', 'button');
        th.setAttribute('tabindex', '0');
        th._gsmTilesY = row.value;
        tr.appendChild(th);

        structure.columns.forEach((col) => {
            if (isExpanded(col)) {
                col.details.forEach((detail) => {
                    const td = make(
                        doc,
                        'td',
                        'gsm-tiles-cell gsm-tiles-detail'
                    );
                    td.style.height = px(theme.cellHeight);
                    fillCell(td, {
                        datum: structure.getDetailCell(
                            row.value,
                            col.value,
                            detail
                        ),
                        mapping: expand.mapping,
                        colors: expand.scales.fill.colors,
                        missing,
                        tooltip: expand.tooltip,
                        aliases: { x: detail, y: row.value, column: col.value },
                    });
                    tr.appendChild(td);
                });
            } else {
                const td = make(doc, 'td', 'gsm-tiles-cell');
                td.style.height = px(theme.cellHeight);
                fillCell(td, {
                    datum: structure.getCell(row.value, col.value),
                    mapping,
                    colors: scales.fill.colors,
                    missing,
                    tooltip: spec.tooltip,
                    aliases: { x: col.value, y: row.value },
                });
                tr.appendChild(td);
            }
        });
        tbody.appendChild(tr);
    });

    table.style.width = px(tableWidth);
    table.append(colgroup, thead, tbody);
    scroller.appendChild(table);
    root.appendChild(scroller);

    if (paged) {
        const pager = make(doc, 'div', 'gsm-tiles-pager');
        const prev = make(doc, 'button', 'gsm-tiles-prev', '‹ Prev');
        const next = make(doc, 'button', 'gsm-tiles-next', 'Next ›');
        prev.type = 'button';
        next.type = 'button';
        prev.dataset.step = '-1';
        next.dataset.step = '1';
        prev.disabled = state.page === 1;
        next.disabled = state.page === nPages;
        const text = make(
            doc,
            'span',
            'gsm-tiles-pager-text',
            `Rows ${start + 1}–${start + pageRows.length} of ${nRows}`
        );
        pager.append(prev, text, next);
        root.appendChild(pager);
    }

    scroller.scrollTop = scrollTop;
    scroller.scrollLeft = scrollLeft;
    applySelection(chart);
}
