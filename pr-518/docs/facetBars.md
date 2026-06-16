# facetBars

Renders a set of linked, faceted bar charts — one chart per unique value of a
categorical variable — arranged in a CSS-grid layout. All sub-charts share a
common axis range (constant axes by default) and a common Chart.js legend shown
on one designated sub-chart. Hover interactions are linked across facets:
highlighting a bar in one chart highlights the matching category in all siblings.

Introduced in v2.4.x. Internally, each sub-chart is a [`bars`](bars.md) instance.

---

## Signature

```js
gsmViz.default.facetBars(element, data, spec);
```

| Parameter | Type             | Default  | Description                                                    |
| --------- | ---------------- | -------- | -------------------------------------------------------------- |
| `element` | `Node \| string` | `'body'` | Parent DOM element or CSS selector in which to render the grid |
| `data`    | `Array`          | `[]`     | Array of plain data objects                                    |
| `spec`    | `Object`         | required | Chart specification (see [Spec](#spec))                        |

**Returns** `{ charts: Chart[], container: Element }`:

-   `charts` — array of Chart.js instances, one per facet value, in facet order
-   `container` — the grid container `<div>` element

---

## Spec

`facetBars` accepts all standard [`bars`](bars.md) spec keys (applied uniformly to
every sub-chart) plus a required `facet` block:

```js
{
    // ── All standard bars spec keys ──────────────────────────────────────────
    mapping: {
        x: 'fieldName',     // required category field
        y: 'fieldName',     // optional value field; omit for row counts
        fill: 'fieldName',  // optional grouping / colour field
    },
    orientation: 'vertical',   // 'vertical' | 'horizontal'
    position: 'stack',         // 'stack' | 'dodge' | 'fill' | 'identity'
    nCategories: undefined,    // optional positive integer
    scales: { /* same as bars */ },
    labels: { /* same as bars */ },
    annotations: { /* same as bars */ },
    tooltip: { /* same as bars */ },
    theme: { /* same as bars */ },

    // ── Facet configuration ──────────────────────────────────────────────────
    facet: {
        field: 'columnName',    // required — categorical column to split on
        order: undefined,       // optional array — explicit facet value order;
                                //   values absent from order are excluded
        nCol: undefined,        // optional positive integer — grid columns
                                //   (auto-computed as min(facetCount, 3) if omitted)
        chartHeight: undefined, // optional positive number — height in px of each
                                //   sub-chart canvas container (e.g. 300)
        label: {
            position: 'top',    // 'top' | 'bottom' — facet title relative to chart
            font: undefined,    // CSS font string for facet title (e.g. 'bold 13px sans-serif')
        },
        scales: {
            x: { free: false }, // false (default) = constant axis (shared min/max)
                                // true = each facet auto-scales independently
            y: { free: false }, // same for the value axis
        },
        legend: {
            display: true,      // false hides all legends
            chart: 'first',     // 'first' | 'last' | '<facetValue>'
                                //   which sub-chart carries the Chart.js legend;
                                //   all others have their legend suppressed
        },
    },

    // ── Callbacks (extended signature vs bars) ───────────────────────────────
    callbacks: {
        onClick: null,   // (point, facetValue, event) => void
        onHover: null,   // (point, facetValue, event) => void
    },
}
```

### Facet defaults

| Key                    | Default                                     |
| ---------------------- | ------------------------------------------- |
| `facet.nCol`           | `undefined` (auto: `min(facetCount, 3)`)    |
| `facet.chartHeight`    | `undefined` (Chart.js default aspect ratio) |
| `facet.label.position` | `'top'`                                     |
| `facet.label.font`     | `undefined`                                 |
| `facet.scales.x.free`  | `false` (constant, shared axis)             |
| `facet.scales.y.free`  | `false` (constant, shared axis)             |
| `facet.legend.display` | `true`                                      |
| `facet.legend.chart`   | `'first'`                                   |

---

## Faceting

The `facet.field` column is used to split the data. Each unique value becomes
one sub-chart. Sub-charts appear in natural insertion order unless `facet.order`
is specified.

```js
// Render one bar chart per region
facetBars(el, data, {
    mapping: { x: 'site', y: 'ae_count', fill: 'flag' },
    facet: { field: 'region' },
});
```

To control ordering and to include only specific facets, pass `facet.order`:

```js
facet: { field: 'region', order: ['APAC', 'EU', 'US'] }
```

---

## Axis scales

### Constant axes (default)

By default, all sub-charts share the same value-axis range, computed as the
global min/max across all facets. This makes it safe to compare bar heights
across charts.

```js
facet: {
    field: 'region',
    scales: { y: { free: false } }, // default — all charts share the same y range
}
```

### Free axes

Set `free: true` to let each sub-chart auto-scale independently. Useful when
absolute comparison is less important than within-facet patterns.

```js
facet: {
    field: 'region',
    scales: { y: { free: true } },
}
```

> **Note:** `position: 'fill'` always uses a fixed 0–100 % scale regardless of
> the `free` setting.

---

## Legend

When `mapping.fill` is set, a Chart.js legend is shown on exactly one
sub-chart (controlled by `facet.legend.chart`). All other sub-charts have their
legend suppressed to reduce clutter.

```js
// Default: legend on first chart
facet: { field: 'region', legend: { chart: 'first' } }

// Legend on the last chart
facet: { field: 'region', legend: { chart: 'last' } }

// Legend on a specific facet value
facet: { field: 'region', legend: { chart: 'EU' } }

// No legend on any chart
facet: { field: 'region', legend: { display: false } }
```

---

## Linked hover

When a bar is hovered in any sub-chart, the matching category bar is
highlighted in all sibling charts (highlight only — no tooltip popup in
siblings). The hover state clears in siblings when the mouse leaves the chart.

This synchronisation is applied automatically. There is no additional
configuration required.

---

## Callbacks

User-provided `onClick` and `onHover` receive an extended signature that
includes the facet value:

```js
callbacks: {
    onClick: (point, facetValue, event) => {
        console.log('Clicked', point.x, 'in facet', facetValue);
    },
    onHover: (point, facetValue, event) => {
        // update a detail panel, etc.
    },
}
```

`point` is the same data-point object as in `bars`:
`{ x, y, _fill?, _datum }`.

---

## Layout

Sub-charts are arranged in a CSS flexbox/grid container
(`.gsm-facet-grid`). Each cell (`.gsm-facet-cell`) contains a label
(`.gsm-facet-label`) and a chart canvas container (`.gsm-facet-canvas`).

Override layout via CSS:

```css
.gsm-facet-grid {
    gap: 16px;
}
.gsm-facet-canvas {
    height: 350px;
}
.gsm-facet-label {
    font-weight: bold;
    text-align: center;
}
```

Control the number of columns via `facet.nCol`:

```js
facet: { field: 'region', nCol: 2 }
```

---

## Return value

```js
const { charts, container } = facetBars(el, data, spec);

// charts[0] is the Chart.js instance for the first facet
charts[0].helpers.exportImage('facet-0.png');

// container is the grid <div> element
container.style.maxWidth = '1200px';
```

Each chart exposes the same `.helpers` object as a standalone `bars` chart
(`updateData`, `updateSpec`, `exportImage`).
