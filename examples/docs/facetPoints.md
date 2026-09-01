# facetPoints

Renders linked [`points`](points.md) charts as ordered small multiples. Each
facet is a complete Chart.js scatter chart, while `facetPoints` coordinates the
grid, fixed numeric domains, categorical styles, legends, hover, and selection.

---

## Signature

```js
gsmViz.default.facetPoints(element, data, spec);
```

| Parameter | Type             | Default  | Description                                                |
| --------- | ---------------- | -------- | ---------------------------------------------------------- |
| `element` | `Node \| string` | `'body'` | Parent DOM element or selector in which to render the grid |
| `data`    | `Array`          | `[]`     | Source rows                                                |
| `spec`    | `Object`         | required | A `points` spec plus the required `facet` configuration    |

Returns `{ charts, container }`:

-   `charts` is an array of Chart.js instances in facet order.
-   `container` is the generated `.gsm-facet-grid` element.

The legacy `scatterPlot` API is separate and is not used by `facetPoints`.

---

## Example

```js
const result = gsmViz.default.facetPoints(element, data, {
    mapping: {
        x: 'exposure',
        y: 'events',
        key: 'site',
        color: 'region',
        shape: 'status',
    },
    scales: {
        x: { label: 'Participant exposure', beginAtZero: true },
        y: { label: 'Reported events', beginAtZero: true },
        color: {
            order: ['Americas', 'Europe', 'Asia Pacific'],
            label: 'Region',
        },
        shape: {
            order: ['On target', 'Review'],
            label: 'Status',
        },
    },
    facet: {
        field: 'visit',
        order: ['Baseline', 'Week 4', 'Week 8'],
        nCol: 2,
        chartHeight: 300,
        scales: {
            x: { free: false },
            y: { free: false },
        },
        legend: {
            display: true,
            sync: true,
        },
    },
    selection: {
        enabled: true,
        multiple: true,
    },
    callbacks: {
        onClick: (point, facetValue, event) => {
            console.log(point._datum, facetValue, event);
        },
        onHover: (point, facetValue, event) => {
            console.log(point._key, facetValue, event);
        },
        onSelect: (selection, facetValue, event) => {
            console.log(selection, facetValue, event);
        },
    },
});
```

See the [interactive example](../facetPoints/) for fixed/free scales, an
explicit empty facet, global legends, keyed interaction, and full-grid
rerendering.

---

## Facet spec

`facetPoints` accepts the complete [`points` spec](points.md#initial-spec) plus:

```js
{
    facet: {
        field: 'visit',        // required source field
        order: undefined,      // ordered allowlist; may request empty facets
        nCol: undefined,       // positive integer; defaults to at most 3 columns
        chartHeight: undefined, // positive pixel height for each chart
        label: {
            position: 'top',   // 'top' or 'bottom'
            font: undefined,   // non-empty CSS font shorthand
        },
        scales: {
            x: { free: false },
            y: { free: false },
        },
        legend: {
            display: true,
            sync: true,
        },
    },
}
```

| Key                    | Default                                   | Description                                     |
| ---------------------- | ----------------------------------------- | ----------------------------------------------- |
| `facet.order`          | first-seen facet order                    | Ordered allowlist, including requested empties  |
| `facet.nCol`           | `min(facetCount, 3)`, at least one column | Number of CSS-grid columns                      |
| `facet.chartHeight`    | Chart.js responsive height                | Height of each chart container in pixels        |
| `facet.label.position` | `'top'`                                   | Places the facet label above or below its chart |
| `facet.label.font`     | `undefined`                               | CSS font shorthand for facet labels             |
| `facet.scales.x.free`  | `false`                                   | Use a local automatic x domain when `true`      |
| `facet.scales.y.free`  | `false`                                   | Use a local automatic y domain when `true`      |
| `facet.legend.display` | `true`                                    | Show eligible legends on every child chart      |
| `facet.legend.sync`    | `true`                                    | Synchronize semantic legend visibility          |

All facet options are validated before a grid is replaced. Unsupported fields
and invalid facet values throw descriptive errors.

## Facet identity and ordering

Without `facet.order`, one chart is created for each first-seen facet value.
String and numeric values remain distinct, so `1` and `'1'` create different
facets.

`facet.order` is an ordered allowlist. Unlisted source values are excluded, and
listed values with no rows still create valid empty charts:

```js
facet: {
    field: 'visit',
    order: ['Baseline', 'Week 4', 'Week 8'],
}
```

Null, undefined, blank, and `NaN` source values share one canonical missing
facet, displayed as `"(Missing)"`. Use `null` in `facet.order` to position it.
The literal source value `"(Missing)"` remains a separate facet and is quoted in
its display label.

An empty data array is valid. It produces no charts unless `facet.order`
requests empty facets.

## Fixed and free numeric scales

Both axes are fixed across facets by default. Their shared domains include all
rendered point coordinates, auxiliary line coordinates, and reference-line
values. This supports direct geometric comparisons between panels.

```js
facet: {
    field: 'visit',
    scales: {
        x: { free: false }, // shared x range
        y: { free: true },  // each chart computes its own y range
    },
}
```

The axes are independent: either, both, or neither can be free. The shared
calculation honors linear/log rules and `beginAtZero`. A
`scales.x.range` or `scales.y.range` in the underlying points spec remains
authoritative, including when that facet axis is marked free.

When all global values on an axis are equal, `facetPoints` expands the domain to
a finite usable range. Log domains remain positive.

### Facet-aware auxiliary lines

An `annotations.lines` layer is repeated in every child when none of its data
rows contains `facet.field`. When that field is present, rows are split by the
same typed and missing-value rules as points:

```js
facet: { field: 'snapshot' },
annotations: {
    lines: [
        {
            data: thresholdRows, // includes a snapshot field
            mapping: {
                x: 'denominator',
                y: 'limit',
                group: 'threshold',
            },
        },
    ],
}
```

Each child then receives only its matching threshold rows. Facet-aware line rows
for values excluded by `facet.order` do not expand the shared domain. Reference
lines remain global. All auxiliary rows are still validated before this
allowlist filtering, so an invalid coordinate, group, log value, or facet
identity cannot be hidden in an unrendered panel. This distinction supports both
one common guide curve and snapshot-specific threshold curves without adding a
separate annotation-facet option.

## Global styles and legends

Color and shape levels are resolved once across the complete source data.
Palette assignment follows original source-row order rather than
`facet.order`, so rearranging panels does not change styles. Explicit
`scales.color.order` and `scales.shape.order` still take precedence.

Every child legend uses the same typed point-dataset order. Empty ghost datasets
represent combinations absent from one facet, so composite color/shape legends
remain aligned without creating rendered points. Numeric/string levels and
missing/literal `"(Missing)"` levels remain distinct.

By default, clicking a point or auxiliary-line legend item propagates its
visibility to the semantically matching dataset in every sibling:

```js
facet: {
    field: 'visit',
    legend: { display: true, sync: true },
}
```

Set `sync: false` for local toggles or `display: false` to hide all child
legends. Point datasets are matched by typed color/shape identity, not label or
array index. Auxiliary lines are matched by original layer and typed group
identity, so a group absent from one facet cannot toggle an unrelated line.

## Linked hover, selection, and callbacks

With `mapping.key`, hovering a visible point highlights the exact matching key
in sibling charts. Sibling tooltips are not opened, and numeric and string keys
are not coerced. Without a mapped key, source-row indexes are facet-local and
hover is not linked.

Point selection is also linked only when `mapping.key` is present in both
charts. A sibling selects the subset of requested keys that it contains and
clears when it has no match. Color-group selection synchronizes by typed group
identity. Sibling updates are silent, so `onSelect` runs once on the originating
facet. Pointer, keyboard, and programmatic selection all use the same path.

Callbacks add the typed facet value to the normal points signatures:

```js
callbacks: {
    onClick: (point, facetValue, event) => {},
    onHover: (point, facetValue, event) => {},
    onSelect: (selection, facetValue, event) => {},
}
```

`point` is the normal structured points value and retains its source row as
`point._datum`. Missing facets pass `null`, while the literal `"(Missing)"`
facet passes that string.

## Child helpers and grid updates

Each entry in `result.charts` is a normal `points` chart and retains its helpers:

```js
const first = result.charts[0];
first.helpers.selectPoint(first, 'Site 01');
first.helpers.clearSelection(first);
first.helpers.exportImage(first, 'baseline.png');
first.helpers.updateData(first, replacementRows);
first.helpers.updateSpec(first, { labels: { title: 'Updated panel' } });
```

A child `updateData` or `updateSpec` is local to that chart. It preserves the
initial global point-dataset templates, facet legend display, hidden semantic
groups, and synchronization wrappers when the original color/shape domain is
retained.

Reinvoke `facetPoints(element, completeData, completeSpec)` whenever an update
changes facet membership/order, shared x/y domains, color/shape mappings or
levels, auxiliary-line layers, or other shared configuration. Reinvocation is
the supported full-grid update: it recomputes every shared domain/style,
destroys the previous child charts, and replaces the old grid.

Zoom, pan, and image export remain child-chart operations. Runtime zoom windows
are not synchronized.

## Layout and accessibility

The generated DOM uses the established facet classes:

```text
.gsm-facet-grid
  .gsm-facet-cell
    .gsm-facet-label
    .gsm-facet-canvas
      canvas
```

The label and canvas-container order reflects `facet.label.position`. Layout can
be customized with these classes in addition to `nCol` and `chartHeight`.

Each child canvas retains the points text alternative, no-data message,
color/shape encoding summary, and keyboard/live selection behavior. Its
accessible summary is prefixed with `Facet <field>: <value>.`, including after
local child updates. Missing and literal `"(Missing)"` facet values remain
distinct. Visible facet labels provide the same panel context without creating
per-point DOM nodes.
