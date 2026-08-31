# points

Renders a two-dimensional point chart using a **ggplot2-inspired spec** object.
`points` is the generic, data-agnostic counterpart to the KRI-specific
`scatterPlot` module.

---

## Signature

```js
gsmViz.default.points(element, data, spec);
```

| Parameter | Type             | Default  | Description                                              |
| --------- | ---------------- | -------- | -------------------------------------------------------- |
| `element` | `Node \| string` | `'body'` | DOM element or CSS selector in which to render the chart |
| `data`    | `Array`          | `[]`     | Array of source rows                                     |
| `spec`    | `Object`         | required | Point chart specification                                |

Returns a Chart.js chart instance.

---

## Basic example

```js
const data = [
    {
        exposure: 5,
        events: 1,
        site: 'Site 01',
        arm: 'Control',
        participants: 12,
        completeness: 0.72,
        status: 'Review',
        flagged: true,
    },
    {
        exposure: 12,
        events: 3,
        site: 'Site 02',
        arm: 'Treatment',
        participants: 35,
        completeness: 0.94,
        status: 'On target',
        flagged: false,
    },
    {
        exposure: 25,
        events: 6,
        site: 'Site 03',
        arm: null,
        participants: 48,
        completeness: 0.83,
        status: 'Review',
        flagged: true,
    },
];

const thresholds = [
    { exposure: 1, events: 2, threshold: 'Review' },
    { exposure: 10, events: 5, threshold: 'Review' },
    { exposure: 100, events: 10, threshold: 'Review' },
    { exposure: 1, events: 4, threshold: 'Alert' },
    { exposure: 10, events: 8, threshold: 'Alert' },
    { exposure: 100, events: 16, threshold: 'Alert' },
];

const chart = gsmViz.default.points(element, data, {
    mapping: {
        x: 'exposure',
        y: 'events',
        key: 'site',
        color: 'arm',
        size: 'participants',
        opacity: 'completeness',
        shape: 'status',
    },
    scales: {
        x: {
            type: 'log',
            label: 'Participant exposure',
            range: [1, 100],
            breaks: [1, 10, 100],
            labels: ['1', '10', '100'],
        },
        y: {
            label: 'Reported events',
            beginAtZero: true,
        },
        color: {
            colors: {
                Control: '#4e79a7',
                Treatment: '#f28e2b',
            },
            order: ['Control', 'Treatment', null],
            label: 'Treatment arm',
        },
        size: { range: [4, 12] },
        opacity: { range: [0.35, 1] },
        shape: {
            values: {
                'On target': 'circle',
                Review: 'triangle',
            },
            order: ['On target', 'Review'],
            label: 'Monitoring status',
        },
    },
    labels: {
        title: 'Events by exposure',
        caption: 'Simulated data',
        description:
            'Each point represents one site and compares exposure with reported events.',
    },
    annotations: {
        referenceLines: [
            {
                axis: 'y',
                value: 10,
                label: '10-event reference',
                dash: [3, 3],
            },
        ],
        lines: [
            {
                data: thresholds,
                mapping: {
                    x: 'exposure',
                    y: 'events',
                    group: 'threshold',
                },
                order: ['Review', 'Alert'],
                colors: {
                    Review: '#e5a919',
                    Alert: '#e15759',
                },
                width: 2,
                dash: [6, 3],
                showInLegend: true,
            },
        ],
        labels: {
            point: {
                field: 'site',
                display: 'flagged',
                align: 'top',
                offset: 6,
            },
        },
    },
    tooltip: {
        format: '{site}: {events} events at {exposure} exposure ({color})',
    },
    callbacks: {
        onClick: (point) => {
            console.log(point._datum);
        },
        onSelect: (selection, event) => {
            console.log(selection, event);
        },
    },
    selection: {
        enabled: true,
        multiple: true,
        opacity: 0.2,
    },
});
```

## Initial spec

```js
{
    mapping: {
        x: 'xField',       // required
        y: 'yField',       // required
        key: 'idField',    // optional stable point identity
        color: 'groupField', // optional categorical grouping
        size: 'sizeField',    // optional non-negative numeric field
        opacity: 'alphaField', // optional finite numeric field
        shape: 'shapeField',   // optional categorical grouping
    },
    scales: {
        x: {
            type: 'linear',     // 'linear' or 'log'
            label: undefined, // defaults to mapping.x; '' hides the title
            range: undefined,   // optional fixed [min, max]
            beginAtZero: false, // automatic linear domains only
            breaks: [],         // explicit, increasing tick values
            labels: [],         // one label per break
        },
        y: {
            type: 'linear',
            label: undefined, // defaults to mapping.y; '' hides the title
            range: undefined,
            beginAtZero: false,
            breaks: [],
            labels: [],
        },
        color: {
            colors: {},       // level-to-CSS-color map
            palette: [/* default categorical colors */],
            order: [],        // explicit order; null places missing values
            label: undefined, // defaults to mapping.color
        },
        size: {
            range: [3, 12],   // positive minimum and maximum radius
        },
        opacity: {
            range: [0.25, 1], // minimum and maximum alpha
        },
        shape: {
            values: {},       // level-to-point-style map
            order: [],        // explicit order; null places missing values
            label: undefined, // defaults to mapping.shape
        },
    },
    labels: {
        title: undefined,
        caption: undefined,
        description: undefined,
    },
    annotations: {
        referenceLines: [],
        lines: [],
        labels: {
            point: null,
        },
    },
    tooltip: {
        format: undefined,
        formatter: undefined,
    },
    callbacks: {
        onClick: null,
        onHover: null,
        onSelect: null,
    },
    selection: {
        enabled: false,
        multiple: false,
        opacity: 0.2,
    },
    zoom: {
        enabled: false,
        mode: 'xy',  // 'x', 'y', or 'xy'
        pan: false,
        wheel: true,
        pinch: true,
    },
    theme: {
        maintainAspectRatio: false,
        animation: false,
    },
}
```

The renderer supports ungrouped points; categorical color and shape mappings;
continuous size and opacity mappings; linear or logarithmic x/y axes;
annotations; keyed point or color-group selection; and optional zoom and pan.

## Numeric axes

Each axis supports `type: 'linear'` or `type: 'log'`; the public `log` spelling is
normalized to Chart.js's `logarithmic` scale. An explicit two-number `range`
fixes the axis minimum and maximum. Otherwise, `beginAtZero: true` extends an
automatic linear domain to zero.

Set `breaks` and `labels` together to replace generated ticks. Breaks must be
finite, strictly increasing values, and each break must have a string or numeric
label. Log-scale coordinates, ranges, and breaks must all be greater than zero;
`beginAtZero: true` is therefore invalid on a log scale. Invalid settings and
coordinates throw before Chart.js renders.

## Categorical color

Set `mapping.color` to create one dataset and legend entry per categorical level.
Levels use first-seen order unless `scales.color.order` is provided. Ordered
levels with no matching rows remain as empty datasets so legend identity and
palette positions stay stable as data changes; new observed levels are appended.

`scales.color.colors` maps level names to CSS colors. Levels without a named
color use the default palette, or the non-empty `scales.color.palette` supplied by
the caller. Set `scales.color.label` to customize the legend title; `null` or `''`
hides the title. Null, undefined, blank, and `NaN` color values share a neutral
gray `"(Missing)"` level rather than dropping rows. Add `null` to
`scales.color.order` to position this level explicitly. The literal string
`"(Missing)"` remains a separate categorical value and is quoted in the legend.

## Continuous size and opacity

`mapping.size` maps finite, non-negative values into `scales.size.range`. The
scale interpolates point **area**, avoiding the visual exaggeration caused by
linear radius scaling. Equal input values use the midpoint radius. Hover radius
is always two pixels larger than the rendered radius.

`mapping.opacity` maps finite values into the clamped
`scales.opacity.range`. Equal input values use the midpoint alpha. Opacity is
applied to each point's resolved color, including color-mapped datasets. Numeric
strings, missing values, infinities, and negative size values throw rather than
being coerced or dropped.

## Discrete shape

`mapping.shape` creates one dataset per shape level. Use `scales.shape.values` to
map levels to `circle`, `triangle`, `rect`, `rectRot`, `cross`, `crossRot`,
`star`, `line`, `dash`, or `rectRounded`; otherwise shapes are assigned in a
deterministic first-seen or explicit `order`. Missing values use a neutral
`"(Missing)"` cross that is reserved from automatic fallback assignment.

When color and shape map the same field, each level receives both styles in one
legend entry. The shared domain starts with `scales.color.order`, appends any
additional `scales.shape.order` levels, and then appends observed levels. When
color and shape map different fields, the legend contains only observed
color/shape combinations, ordered by their respective scale domains. String
components are quoted in composite labels so combinations remain unambiguous.
Add `null` to `scales.shape.order` to position missing values; the literal string
`"(Missing)"` remains distinct and is quoted in the legend. Set
`scales.shape.label` to customize the legend title; `null` or `''` hides that
title component.
For a shared color/shape field, an explicit color label takes precedence over an
explicit shape label; otherwise either explicit label takes precedence over the
field name.

## Reference lines

Use `annotations.referenceLines` for constant vertical or horizontal guides:

```js
annotations: {
    referenceLines: [
        {
            axis: 'y',          // 'x' or 'y'
            value: 10,
            label: 'Target',    // optional
            color: '#666666',
            width: 1,
            dash: [4, 2],
            labelPosition: 'end', // 'start', 'center', or 'end'
        },
    ],
}
```

Reference values must be finite JavaScript numbers and must be positive on a log
axis. They extend automatic domains so the guide remains visible; an explicit
axis `range` remains authoritative.

## Auxiliary line series

`annotations.lines` adds one or more external line layers without merging them
into the point data:

```js
annotations: {
    lines: [
        {
            data: thresholdData,
            mapping: {
                x: 'exposure',
                y: 'limit',
                group: 'threshold', // optional
            },
            order: ['Review', 'Alert'],
            label: 'Threshold',     // legend prefix for grouped lines
            color: undefined,       // shared line color
            colors: { Review: '#e5a919', Alert: '#e15759' },
            palette: ['#e5a919', '#e15759'],
            width: 2,
            dash: [6, 3],
            tension: 0,
            stepped: false,         // or 'before', 'after', 'middle'
            showInLegend: false,
        },
    ],
}
```

Auxiliary coordinates follow the same strict finite-number and positive-log
rules as points. Input order determines each line path. With `mapping.group`,
first-seen order is used unless `order` is supplied; ordered absent groups remain
as empty datasets, and `null` positions the missing group. Named `colors` take
precedence over `color`, then `palette`. Without a group, the first palette color
is used when `color` is absent.

Line geometry participates in automatic x/y domains, while explicit ranges still
win. Auxiliary lines are excluded from tooltips, pointer callbacks, and point
encoding descriptions. `showInLegend` opts a line into the legend; an ungrouped
line then requires a non-empty `label`.

## Selective point labels

Configure `annotations.labels.point` to draw source-row text next to selected
points:

```js
annotations: {
    labels: {
        point: {
            field: 'site',
            display: 'flagged',
            formatter: (point, context) => point._datum.site,
            align: 'top',
            offset: 4,
            color: '#333333',
            font: {
                family: 'Arial',
                size: 12,
                style: 'normal',
                weight: 400,
                lineHeight: 1.2,
            },
        },
    },
}
```

`field` is required and must resolve to a non-empty string or finite number on
every point row. By default all points are labeled. Set `display` to a boolean,
a source-field name whose truthiness selects rows, or
`(point, context) => boolean`. A custom `formatter(point, context)` receives the
structured point and its original row at `point._datum`; otherwise the mapped
field value is rendered.

`align` accepts `center`, `start`, `end`, `right`, `bottom`, `left`, or `top`.
`offset` must be non-negative. Labels never apply to auxiliary line datasets or
empty ordered legend groups. Missing label values and errors thrown by display
predicates or formatters are surfaced rather than ignored. Set `point` to `null`
or `false` to disable labels.

## Tooltips

Use `tooltip.format` for field templates:

```js
tooltip: {
    format: '{site}: ({x}, {y}), {color}, {datum.region}',
}
```

`{x}`, `{y}`, and `{key}` resolve structured point values; `{color}` is available
when `mapping.color` is set.
Unqualified placeholders such as `{site}` resolve fields on the original source
row. Prefix a field with `datum.` or `_datum.` for an explicit source-row lookup;
nested paths such as `{datum.participant.id}` are supported. Every requested
source field must exist on every non-empty input row, and unresolved placeholders
throw descriptive errors.

For complete control, provide
`tooltip.formatter(point, context, details)`. `details` contains
`{ x, y, color, key, datum }`. Label precedence is:

1. `tooltip.callbacks.label` using the standard Chart.js signature
2. `tooltip.formatter`
3. `tooltip.format`
4. Chart.js's default scatter label

The gsm.viz-only `format` and `formatter` keys are removed before tooltip options
are passed to Chart.js. Standard options such as `enabled`, `mode`, `intersect`,
`position`, styling, and tooltip callbacks can be configured in the same object.

## Pointer callbacks

`callbacks.onClick(point, event)` and `callbacks.onHover(point, event)` run only
when a point is hit. The structured `point` contains its coordinates, `_key`,
optional `_color`, and original source row in `_datum`. A pointer cursor is shown
for interactive points and reset when the pointer leaves or callbacks are
removed.

## Selection

Every chart exposes serializable point and color-group selection helpers:

```js
chart.helpers.selectPoint(chart, 'Site 01');
chart.helpers.selectPoint(chart, ['Site 01', 'Site 02']);
chart.helpers.selectGroup(chart, 'Control');
chart.helpers.selectGroup(chart, ['Control', 'Treatment']);

const selection = chart.helpers.getSelection(chart);
// { type: 'point'|'group'|null, values: [...] }

chart.helpers.clearSelection(chart);
```

Point values are the mapped `mapping.key` values, or original row indexes when
no key is mapped. Group values are resolved `mapping.color` values and
`selectGroup` requires a color mapping. Point values must be known strings or
finite numbers; group values may additionally use `null` for the missing-value
level. This keeps a missing group distinct from the literal string
`"(Missing)"`. Empty levels named in `scales.color.order` are also valid group
selection values. Numeric and string values remain distinct. Scalar and array
inputs are accepted, duplicates are removed without reordering, and an empty
array clears the current selection.

A selected point or group keeps its original color while all other points are
dimmed by multiplying their encoded alpha by `selection.opacity`; selection
therefore never makes a low-opacity point more prominent. Auxiliary lines and
legend swatches retain their original colors. Selecting exactly one point keeps
that point's tooltip active by dataset and index, so points at duplicate
coordinates remain independent.

Set `selection.enabled: true` to enable pointer and keyboard selection. A point
click selects its key, clicking it again clears it, and clicking empty chart
space clears the current selection. With `selection.multiple: true`, point
clicks toggle keys additively; otherwise a new click replaces the selection.
Programmatic array selection is available regardless of this interaction
setting.

`callbacks.onSelect(selection, event)` runs after click, keyboard, or
programmatic selection changes. The callback receives a defensive
`{ type, values }` object. For linked-chart synchronization, mutating helpers
accept an event as their third argument and `{ _silent: true }` as their fourth
argument:

```js
chart.helpers.selectPoint(chart, ['Site 01'], event, { _silent: true });
chart.helpers.clearSelection(chart, event, { _silent: true });
```

When enabled, the canvas is focusable. `ArrowRight` and `ArrowDown` move to the
next point in original source-row order; `ArrowLeft` and `ArrowUp` move to the
previous point, with traversal wrapping at either end. `Enter` toggles the
active point and `Escape` clears selection or dismisses an active point. The
canvas uses interactive application semantics and includes the keyboard
instructions in its accessible label. One initially quiet, visually hidden live
status announces active-point and selection changes; no per-point DOM nodes are
created.

## Reactive updates

Every chart also exposes two in-place lifecycle helpers:

```js
chart.helpers.updateData(chart, nextData);
chart.helpers.updateData(chart, nextData, replacementSpec);
chart.helpers.updateSpec(chart, {
    labels: { title: 'Updated title' },
    scales: { x: { label: 'Updated x label' } },
});
```

Both helpers return the same Chart.js instance and rerun strict validation, data
structuring, auxiliary lines, scales, plugin options, and the accessible
summary. They do not replace the canvas or attach duplicate event handlers.

`updateData(chart, data)` retains the chart's current complete spec. Supplying
the third argument replaces that spec and therefore requires the normal
`mapping.x` and `mapping.y` fields. `updateSpec(chart, partialSpec)` deep-merges
the partial object over the current spec: nested sibling fields and callbacks
remain intact, while supplied arrays replace existing arrays.

Hidden point datasets are restored by typed color/shape identity when that same
mapping and combination still exists. Positional indexes, display labels, and
string coercion are not used, so reordered datasets and numeric/string levels
remain stable. Stale indexes become visible when a group disappears or an
aesthetic mapping changes. Auxiliary line visibility is rebuilt from the new
spec.

Because rebuilt points and styles invalidate selection indexes, either update
clears point/group selection and active tooltip state without calling
`callbacks.onSelect`. Selection can be applied again after the helper returns.
Fixed ranges, current callbacks, keyboard behavior, and hidden groups otherwise
remain configured. Enabling or disabling point labels and keyboard selection
through `updateSpec` registers or cleans up their plugins, status element, and
listeners in place.

## Zoom and pan

Zoom is disabled by default. Enable it for either axis or both axes:

```js
const chart = gsmViz.default.points(element, data, {
    mapping: { x: 'exposure', y: 'events' },
    zoom: {
        enabled: true,
        mode: 'xy',
        pan: true,
        wheel: true,
        pinch: true,
    },
});

chart.resetZoom();
```

| Key       | Type      | Default | Description                               |
| --------- | --------- | ------- | ----------------------------------------- |
| `enabled` | `boolean` | `false` | Activate zoom and pan behavior            |
| `mode`    | `string`  | `'xy'`  | Restrict interaction to `x`, `y`, or `xy` |
| `pan`     | `boolean` | `false` | Allow pointer dragging to pan             |
| `wheel`   | `boolean` | `true`  | Allow mouse-wheel zooming                 |
| `pinch`   | `boolean` | `true`  | Allow touch pinch-to-zoom                 |

`chart.resetZoom()` is supplied by `chartjs-plugin-zoom`. The normal
`updateData` and `updateSpec` helpers rebuild zoom options, so settings can be
enabled, disabled, or changed in place. Either update resets the current zoom
window before applying the rebuilt scales. Zoom operates on Chart.js's runtime
scale limits; it never modifies a configured `scales.x.range` or
`scales.y.range` in the stored spec. A later update therefore reapplies those
fixed ranges.

## Image export

Every chart exposes an image-download helper:

```js
chart.helpers.exportImage(chart);
chart.helpers.exportImage(chart, 'site-scatter.png');
```

The helper captures the rendered canvas, including its white background, as an
opaque PNG. An explicit non-empty filename is used unchanged. When it is
omitted, the filename is chosen in this order:

1. The sanitized `labels.title`
2. `<y>-by-<x>.png`, using each scale label when present and otherwise its mapping
3. `points.png`

Generated names are lowercase, remove non-filename punctuation, and replace
whitespace with dashes.

## Data rules

-   Values mapped to x and y must already be finite JavaScript numbers and must be
    positive when their axis uses a log scale.
-   Numeric strings are not coerced.
-   Invalid rows throw a descriptive error; rows are never silently dropped.
-   Duplicate coordinates remain independent points.
-   `mapping.key`, when supplied, must resolve to a unique string or finite number
    for every row. Without it, the original row index is the local point key.
-   Each rendered point retains its original source row as `_datum`.
-   Each rendered point retains its original source-row position as `_index`;
    keyboard traversal uses this value even when categorical datasets reorder
    points.
-   Color-mapped points retain their resolved categorical value as `_color`.
-   Size- and opacity-mapped points retain their source values as `_size` and
    `_opacity`.
-   Shape-mapped points retain their resolved categorical value as `_shape`.
-   An empty data array renders a valid empty chart.

## Accessibility and responsive behavior

The canvas receives an image role and text alternative derived from the title,
description, axis mappings, point count, and encoded color/shape values.
When selection is enabled, the canvas becomes a focusable interactive
application, adds the documented controls to its text alternative, and reports
changes through a polite live status element.
`theme.maintainAspectRatio` controls whether Chart.js preserves its aspect ratio
as the container resizes.

For ordered small multiples with fixed/free numeric domains and linked
interaction, use [`facetPoints`](facetPoints.md).

## Downstream qualification

The v2.5.0 API is qualified against sanitized versions of the three concrete
scatter use cases that motivated the generic module. This table describes the
JavaScript contract; adapting an R data frame or htmlwidget payload remains the
consumer package's responsibility.

| Consumer shape      | Required behavior                                                                                  | `points` / `facetPoints` contract                                                                                                                                          |
| ------------------- | -------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Status Tracker      | Continuous x/y, fixed markers, ordered named disposition colors, source-row tooltip/click          | `mapping.x/y/key/color`; an equal-valued `mapping.size` field uses the midpoint of `scales.size.range`; `scales.color.colors/order`; `tooltip.format`; `callbacks.onClick` |
| Premature Deaths    | Ordered outcome categories, fixed study-wide ranges, country/site filtering, arbitrary row payload | Named/ordered color scale; explicit x/y `range`; `updateData`; `_datum` in callbacks; mapped subject key                                                                   |
| `Visualize_Scatter` | Log exposure, explicit ticks, threshold curves, flagged labels, fixed-scale snapshot facets        | Raw positive x values with `type: 'log'`; `breaks/labels`; `annotations.lines`; `annotations.labels.point`; `facetPoints` fixed scales and facet-aware line rows           |

Sanitized fixtures and executable integration coverage live in
`tests/points/fixtures/downstreamUseCases.js` and
`tests/points/downstreamQualification.test.js`.

### Status Tracker migration

```js
const chart = gsmViz.default.points(element, rows, {
    mapping: {
        x: 'lastKnownDay',
        y: 'daysSinceContact',
        key: 'participantId',
        color: 'disposition',
        size: 'markerSize', // one equal numeric value for a fixed radius
    },
    scales: {
        x: { label: 'Last Known Alive Day from Randomization' },
        y: { label: 'Reference to Last Known Alive Day' },
        color: {
            colors: dispositionColors,
            order: dispositionOrder,
            label: 'Disposition',
        },
        size: { range: [3, 5] }, // equal input values resolve to radius 4
    },
    tooltip: {
        format: '{siteId} - {participantId}: {disposition}; Last Known Alive Day: {lastKnownDay}; Reference to Last Known Alive Day: {daysSinceContact}',
    },
    callbacks: {
        onClick: (point, event) => openParticipant(point._datum, event),
    },
});
```

The ordered color scale intentionally retains empty categories so palette and
legend identity do not shift after filtering.

### Premature Deaths migration

```js
const chart = gsmViz.default.points(element, subjects, {
    mapping: {
        x: 'eventDay',
        y: 'followUpDay',
        key: 'subjectId',
        color: 'category',
    },
    scales: {
        x: {
            label: 'Days from Randomization to Event',
            range: [0, studyXMaximum],
        },
        y: {
            label: 'Days from Randomization to Snapshot',
            range: [0, studyYMaximum],
        },
        color: {
            colors: categoryColors,
            order: categoryOrder,
            label: 'Category',
        },
    },
    tooltip: {
        format: 'Country: {country}; Site: {siteId}; Subject: {subjectId}; Category: {category}; Days (x): {eventDay}',
    },
});

chart.helpers.updateData(
    chart,
    subjects.filter((row) => row.country === selectedCountry)
);
```

Because the data-only update retains the complete spec, fixed study-wide ranges,
ordered categories, tooltip behavior, and hidden semantic groups survive
country/site filtering. External filtering can read the full source row from
`point._datum`; the chart does not own consumer-specific filters.

### `Visualize_Scatter` migration

Use raw positive denominators rather than precomputing `log(denominator)`.
Chart.js performs the coordinate transform while the data, callbacks, and
tooltips retain the original value.

```js
const result = gsmViz.default.facetPoints(element, results, {
    mapping: {
        x: 'denominator',
        y: 'numerator',
        key: 'groupId',
        color: 'absoluteFlag',
    },
    scales: {
        x: {
            type: 'log',
            label: 'Site Total (Denominator, log scale)',
            breaks: [5, 10, 50, 100, 500, 1000, 5000, 10000],
            labels: ['5', '10', '50', '100', '500', '1,000', '5,000', '10,000'],
        },
        y: {
            label: 'Site Total (Numerator)',
            beginAtZero: true,
        },
        color: {
            colors: flagColors,
            order: [0, 1, 2],
        },
    },
    annotations: {
        lines: [
            {
                data: bounds, // includes the same snapshot field
                mapping: {
                    x: 'denominator',
                    y: 'numerator',
                    group: 'threshold',
                },
                order: thresholdOrder,
                colors: thresholdColors,
            },
        ],
        labels: {
            point: {
                field: 'groupId',
                display: 'flagged',
                align: 'bottom',
            },
        },
    },
    facet: {
        field: 'snapshot',
        order: snapshotOrder,
        scales: {
            x: { free: false },
            y: { free: false },
        },
        legend: { display: false },
    },
});
```

See [`facetPoints` facet-aware auxiliary lines](facetPoints.md#facet-aware-auxiliary-lines)
for common versus per-snapshot threshold behavior. Rows with zero, negative,
missing, or nonnumeric denominators must be handled explicitly before rendering;
the strict log contract never silently drops them. Likewise, callers that want
to omit missing flags should filter them rather than relying on ggplot2-style
implicit row removal.

## Helper reference

Every `points` chart, including each child returned by `facetPoints`, exposes:

| Helper          | Signature                                                           | Result                                                          |
| --------------- | ------------------------------------------------------------------- | --------------------------------------------------------------- |
| Point selection | `chart.helpers.selectPoint(chart, valueOrValues, event?, options?)` | Selects known mapped keys or local row indexes                  |
| Group selection | `chart.helpers.selectGroup(chart, valueOrValues, event?, options?)` | Selects known color values; `null` identifies the missing group |
| Clear selection | `chart.helpers.clearSelection(chart, event?, options?)`             | Restores exact point styles and clears active state             |
| Read selection  | `chart.helpers.getSelection(chart)`                                 | Defensive `{ type, values }` copy                               |
| Replace data    | `chart.helpers.updateData(chart, data, replacementSpec?)`           | Returns the same chart after a validated rebuild                |
| Merge spec      | `chart.helpers.updateSpec(chart, partialSpec)`                      | Returns the same chart after a deep-partial rebuild             |
| Export PNG      | `chart.helpers.exportImage(chart, filename?)`                       | Downloads the current opaque canvas                             |
| Reset zoom      | `chart.resetZoom()`                                                 | Restores the configured x/y limits                              |

The internal facet synchronization option is `{ _silent: true }` as the fourth
argument to a mutating selection helper. Application code normally omits it.
`facetPoints` itself intentionally has no batch helper; reinvoke it to recompute
facet membership, shared domains, and global styles.

## Consolidated error behavior

Validation is strict and path-specific:

| Input                     | Requirement                                                                        |
| ------------------------- | ---------------------------------------------------------------------------------- |
| Point x/y                 | Finite JavaScript numbers; positive on a log axis                                  |
| `mapping.key`             | Unique non-null string or finite number within one chart/facet                     |
| Color/shape values        | String, finite number, or explicit missing value                                   |
| Size/opacity values       | Finite numbers; size is non-negative                                               |
| Axis ranges/breaks        | Two increasing finite range values and increasing breaks; log values are positive  |
| Tooltip templates         | Every placeholder is available on every non-empty source row                       |
| Reference/auxiliary lines | Valid orientation/mappings and finite coordinates under the same axis rules        |
| Facets                    | Non-empty field name, supported typed values, unique order, positive layout values |

Initial renders and reactive updates validate before mutating Chart.js state.
Invalid updates leave the existing chart data/spec intact. Facet-wide
validation and shared-domain/style preparation happen before the previous grid
is replaced. User callback, formatter, and predicate exceptions are surfaced
unchanged rather than converted into successful-looking fallbacks.

Rows are never silently dropped. This differs deliberately from plotting
systems that remove invalid or log-incompatible rows with a warning; consumer
adapters must make that preprocessing decision explicitly.

## Large-data qualification

`tests/points/performanceQualification.test.js` renders and updates 10,000
grouped points, verifies the resulting point count, and asserts that the
container contains one canvas and no per-point DOM elements. The test has no
timing threshold, so slower CI workers do not create flaky failures.

An informational Windows/Node 24.16.0 Jest/jsdom run measured:

| Operation      | 10,000 points |
| -------------- | ------------- |
| Initial render | 42.0 ms       |
| Data update    | 43.5 ms       |

These numbers qualify transformation and mocked-canvas overhead on one
development machine; they are not a browser rendering guarantee. Reproduce the
informational output in PowerShell with:

```powershell
$env:GSM_VIZ_BENCHMARK = '1'
npm test -- --runInBand tests/points/performanceQualification.test.js
```

## Deferred features

The following are not accepted spec fields in v2.5.0:

-   categorical or date coordinate axes
-   jitter, dodge, hexbin, density, regression, or smoothing layers
-   separate point fill and outline aesthetics
-   a general ordered layer grammar or draggable annotations
-   lasso/brush selection and module-owned cross-chart filtering
-   synchronized facet zoom windows or top-level batch facet helpers
-   automatic sampling/decimation and CSV/data export
-   animation trails or motion encodings
-   refactoring or deprecating the legacy KRI-specific `scatterPlot`

These remain possible follow-up extensions. Unknown options fail validation
rather than being accepted as no-ops.
