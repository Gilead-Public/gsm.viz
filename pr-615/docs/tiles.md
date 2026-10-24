# tiles

Renders a **heatmap of tiles** — one row per `y` value, one column per `x`
value — as an HTML `<table>` (not a canvas), so it scales to thousands of
cells with crisp text, a sticky header row and a sticky first column. Each
data row is one cell. Columns can optionally **expand** in place into one
sub-column per detail value (for example one column per measurement), and
the grid supports row selection, paging, tooltips and click callbacks.

`tiles` is generic: it knows nothing about the meaning of rows, columns or
fill values.

---

## Signature

```js
const chart = gsmViz.default.tiles(element, data, spec);
```

| Parameter | Type             | Default  | Description                                                   |
| --------- | ---------------- | -------- | ------------------------------------------------------------- |
| `element` | `Node \| string` | `'body'` | DOM element or CSS selector in which to render the chart      |
| `data`    | `Array`          | `[]`     | Array of plain objects; each object is one (row, column) cell |
| `spec`    | `Object`         | required | Chart specification (see [Spec](#spec))                       |

**Returns** a chart object (see [Chart object](#chart-object)). A selector
that matches nothing throws `tiles: could not find element matching "…"`.
Rendering into an element that already contains a `tiles` chart replaces
that chart.

---

## Spec

```js
{
    mapping: {                 // required
        x: 'vital',            // required — column field
        y: 'subjid',           // required — row field
        fill: 'flag',          // optional — field looked up in scales.fill.colors
        label: 'rate',         // optional — cell text; '\n' renders as a line break
    },
    scales: {
        x: { order: undefined, label: undefined },  // label defaults to mapping.x
        y: { order: undefined, label: undefined },  // label defaults to mapping.y
        fill: {
            colors: {},         // value → colour, e.g. { Red: '#FF5859' }
            order: undefined,   // legend order; defaults to colors key order
            label: undefined,   // legend title; defaults to mapping.fill
            missing: '#f6f6f6', // colour of cells with no data row
        },
    },
    expand: {                   // optional — expandable columns
        data: [],               // detail rows (see Expandable columns)
        mapping: { x: 'seq', fill: 'inWindow', label: 'value' },
        scales: { fill: { colors: {}, order: undefined, label: undefined } },
        initial: [],            // column (x) values expanded at first render
        tooltip: {},            // same shape as spec.tooltip, for detail cells
    },
    tooltip: {
        format: undefined,      // template string with {field} placeholders
        formatter: undefined,   // (row) => string; wins over format
    },
    callbacks: {
        onClick: null,          // (datum, event) => void — cell click
        onRowClick: null,       // ({ y, rows }, event) => void — row header click
        onExpand: null,         // (x, expanded) => void — after a column toggles
    },
    rows: { pageSize: null },   // positive integer enables paging
    labels: { title: null, subtitle: null },
    theme: {
        cellWidth: 64,          // px, compact columns
        detailCellWidth: 32,    // px, expanded sub-columns
        cellHeight: 28,         // px, minimum; rows grow for multi-line labels
        rowHeaderWidth: 120,    // px, first column
        maxHeight: '600px',     // CSS length or px number; grid scrolls inside
        fontSize: 12,           // px
        legend: true,           // show fill legend(s)
    },
}
```

### Validation

`spec.mapping.x` and `spec.mapping.y` are required, and every data row must
contain both fields (`null` values are allowed). When `spec.expand` is set,
`expand.data` must be an array, `expand.mapping.x` is required, and every
detail row must contain the compact `mapping.x`, compact `mapping.y` and
`expand.mapping.x` fields. Orders must be arrays, colour maps must be plain
objects, callbacks must be functions and `rows.pageSize` must be a positive
integer. Errors are prefixed with `tiles:`, e.g.
`tiles: spec.mapping.x is required`.

### Ordering

Rows and columns appear in **order of first appearance** in `data` (they are
not sorted), so pre-sorted data controls the layout. `scales.x.order` /
`scales.y.order` list values to show first; any remaining values follow in
order of first appearance. Ordered values absent from `data` render as rows
or columns of missing cells.

### Cells and colours

Values are matched by their string form, so `1` and `'1'` are the same row,
column or colour key (`true` matches the colour key `'true'`).

| Situation                                      | Rendering                                                     |
| ---------------------------------------------- | ------------------------------------------------------------- |
| Data row exists, fill value has a colour       | That colour; text is white or dark, whichever contrasts more  |
| Data row exists, no colour / no `fill` mapping | Neutral grey `#d9d9d9`                                        |
| No data row for the (row, column) pair         | Class `gsm-tiles-missing`, `scales.fill.missing`, empty label |

If several data rows share a (row, column) pair, the first one is used.

### Expandable columns

`expand.data` rows are joined to cells on the **compact** `mapping.x` and
`mapping.y` fields and add their own `expand.mapping.x` field:

```js
// compact row
{ subjid: 'P0001', vital: 'Pulse', flag: 'Red', rate: '50%' }
// detail rows for that cell
{ subjid: 'P0001', vital: 'Pulse', seq: 1, inWindow: false, value: 72 }
{ subjid: 'P0001', vital: 'Pulse', seq: 2, inWindow: true,  value: 75 }
```

Columns with at least one detail row show a `▸` affordance and are
focusable buttons (`role="button"`, `tabindex="0"`, `aria-expanded`).
Clicking one — or pressing Enter / Space — replaces it in place with one
sub-column per distinct detail `x` value for that column (sorted numerically
when all values are numeric, otherwise in order of first appearance) under a
spanning `▾` header. Detail cells are coloured by `expand.scales.fill.colors`
and labelled by `expand.mapping.label`; pairs with no detail row are
missing-styled. Columns without detail rows are not expandable.

### Labels, titles and legend

`labels.title` and `labels.subtitle` render above the grid. The `x` axis
label renders above the column headers and the `y` axis label in the top-left
corner; `null` or `''` hides either. When `theme.legend` is true, a legend
shows `scales.fill` swatches and, while at least one column is expanded, the
`expand.scales.fill` swatches.

### Tooltip

Tooltips use the cell's `title` attribute.

-   `formatter(row)` receives the source row and returns the text.
-   `format` replaces `{name}` with `row[name]`; if the row has no such field,
    the aesthetic aliases `{x}`, `{y}`, `{fill}`, `{label}` (and `{column}`,
    the compact column, for detail cells) are used.
-   Default: `"{y} · {x}: {label}"` (fill value when there is no label); detail
    cells default to `"{y} · {column} {x}: {label}"`.

`expand.tooltip` accepts the same options for detail cells.

### Paging

With `rows.pageSize` set and more rows than `pageSize`, only the current page
renders and a pager (`‹ Prev`, `Rows 1–50 of 683`, `Next ›`) appears below
the grid.

---

## Callbacks

| Callback     | Arguments        | Called when                                                                                                                         |
| ------------ | ---------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `onClick`    | `(datum, event)` | A non-missing cell is clicked; `datum` is the unchanged compact or detail source row                                                |
| `onRowClick` | `(info, event)`  | A row header is clicked or activated with Enter / Space; `info = { y, rows }` where `rows` are the compact source rows for that row |
| `onExpand`   | `(x, expanded)`  | After a column expands or collapses (header or helper), not for `expand.initial`                                                    |

Row-header clicks neither select nor expand; call `selectRow` from
`onRowClick` to select:

```js
callbacks: {
    onRowClick: (info) => chart.helpers.selectRow(chart, info.y),
}
```

---

## Chart object

```js
{
    element,   // container element
    data,      // current compact data
    spec,      // current merged spec
    helpers: { updateData, updateSpec, expandColumn, collapseColumn,
               selectRow, clearSelection, getState },
    destroy(), // remove the chart from the container
}
```

## Helper methods

All helpers take the chart as their first argument.

| Helper                           | Behaviour                                                                                                                                                                                          |
| -------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `updateData(chart, data, spec?)` | Replace the data (and the whole spec, merged with defaults, if given). Keeps expanded columns and the selected row that still exist; returns to page 1.                                            |
| `updateSpec(chart, delta)`       | Deep-merge `delta` into the current spec (arrays and functions replace) and re-render, keeping expansion, selection and page.                                                                      |
| `expandColumn(chart, x)`         | Expand column `x`; calls `onExpand(x, true)`. Returns `false` when `x` is unknown, not expandable or already expanded.                                                                             |
| `collapseColumn(chart, x)`       | Collapse column `x`; calls `onExpand(x, false)`. Returns `false` when nothing changed.                                                                                                             |
| `selectRow(chart, y)`            | Select row `y` (single selection; class `gsm-tiles-selected` on its `<tr>`), moving to its page and scrolling it into view. An unknown `y` clears the selection and returns `false`. No callbacks. |
| `clearSelection(chart)`          | Remove the selection. No callbacks.                                                                                                                                                                |
| `getState(chart)`                | `{ expanded: [x, …], selected: y \| null, page: n }`                                                                                                                                               |

```js
// Switch cell labels and sort rows without losing expansion or selection.
chart.helpers.updateSpec(chart, { mapping: { label: 'nd' } });
chart.helpers.updateSpec(chart, { scales: { y: { order: sortedIds } } });
```

---

## Styling

A single `<style id="gsm-viz-tiles-style">` is injected once per document.
All classes are prefixed with `gsm-tiles-`: `gsm-tiles-cell`,
`gsm-tiles-detail`, `gsm-tiles-missing`, `gsm-tiles-row-header`,
`gsm-tiles-col-header`, `gsm-tiles-toggle`, `gsm-tiles-subheader`,
`gsm-tiles-selected`, `gsm-tiles-legend`, `gsm-tiles-pager`, etc.

---

## Usage

```js
const chart = gsmViz.default.tiles('#container', data, {
    mapping: { x: 'vital', y: 'subjid', fill: 'flag', label: 'rate' },
    scales: {
        x: { label: 'Vital sign' },
        y: { label: 'Participant' },
        fill: {
            label: 'Flag',
            colors: { Green: '#3DAF06', Amber: '#FEAA02', Red: '#FF5859' },
        },
    },
    expand: {
        data: detail,
        mapping: { x: 'seq', fill: 'inWindow', label: 'value' },
        scales: {
            fill: {
                label: 'In repeat window',
                colors: { true: '#B5462F', false: '#E8E8E8' },
            },
        },
    },
    callbacks: {
        onRowClick: (info) => chart.helpers.selectRow(chart, info.y),
    },
    rows: { pageSize: 50 },
});
```

## Live example

[Open interactive example](../tiles/ ':ignore')
