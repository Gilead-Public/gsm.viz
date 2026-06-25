# bars

Renders a bar chart using a **ggplot2-inspired spec** object. Introduced in
v2.4.0, `bars` is a lower-level, more composable alternative to `barChart`.
It accepts an aesthetic-mapping spec (`x`, optional `y`, optional `fill`) and
supports vertical / horizontal orientation, stacked / grouped / proportional
positioning, custom colour palettes, explicit category and fill ordering,
tooltips, and per-axis scale configuration.

---

## Signature

```js
gsmViz.default.bars(element, data, spec);
```

| Parameter | Type             | Default  | Description                                              |
| --------- | ---------------- | -------- | -------------------------------------------------------- |
| `element` | `Node \| string` | `'body'` | DOM element or CSS selector in which to render the chart |
| `data`    | `Array`          | `[]`     | Array of plain data objects                              |
| `spec`    | `Object`         | required | Chart specification (see [Spec](#spec))                  |

**Returns** a Chart.js chart instance.

---

## Spec

The spec mirrors ggplot2's `aes()` + `geom_bar()` + `scale_*` + `labs()` + `theme()` pattern.

```js
{
    mapping: {              // required
        x: 'fieldName',     // required category field
        y: 'fieldName',     // optional value field; omit for row counts
        fill: 'fieldName',  // optional grouping / colour field
    },
    interactive: true,             // true | false — enable/disable interactive elements (e.g. clickable Top N footnote)
    orientation: 'vertical',   // 'vertical' | 'horizontal'
    position: 'stack',         // 'stack' | 'dodge' | 'fill' | 'identity'
    nCategories: undefined,    // optional positive integer — limit displayed categories to top N
    scales: {
        x: {
            type: 'category',  // Chart.js scale type
            label: undefined,  // defaults to mapping.x; null or '' hides label
            order: undefined,  // optional category order array
            sort: undefined,   // 'total' | 'alphanumeric' — selection mode when nCategories is set
            sortDir: undefined, // 'asc' | 'desc' — overrides default sort direction (total→desc, alphanumeric→asc); ignored when order is set
        },
        y: {
            type: 'linear',
            label: undefined,  // defaults to mapping.y; null or '' hides label
        },
        fill: {
            palette: [ /* array of hex colour strings */ ],
            colors: { /* name → hex map, e.g. { Completed: '#4e79a7' } */ },
            label: undefined,  // defaults to mapping.fill; null or '' hides legend title
            order: undefined,  // optional fill order / allowlist array
        },
    },
    labels: {
        title: undefined,
        captions: undefined,          // string or string[]; rendered as subtitle lines at the bottom-left of the chart
        captionsOptions: undefined,   // plain object; any Chart.js subtitle plugin option (position, align, font, padding, …)
    },
    annotations: {
        referenceLines: [],    // array of reference line config objects (see Reference lines section)
        labels: {
            segment: {
                display: false,    // value label inside or at the end of each bar segment
                placement: 'center', // 'center' (inside segment) | 'end' (outside segment end)
                value: 'auto',     // 'auto' | 'value' | 'raw' | 'percent'
                format: undefined, // optional d3-format string, e.g. ',.0f'
                formatter: undefined,  // string template (e.g. '{fill}: {value} ({percent})') or (value, context, details) => string
                minSize: 16,       // hide if the segment is smaller than this many px
                color: undefined,
                font: undefined,
            },
            total: {
                display: false,    // end-of-stack total label for each category
                placement: 'outside', // 'outside' (beyond bar end) | 'inside' (within bar end)
                format: undefined,
                formatter: undefined,  // string template or (value, context, details) => string
                color: undefined,
                font: undefined,
            },
        },
    },
    tooltip: {
        format: undefined,     // built-in format: 'count' | 'percent' | 'count+percent' | 'percent+count'
        formatter: undefined,  // (count, context, details) => string — full custom control
        // All standard Chart.js tooltip plugin options and callbacks are also supported.
        // callbacks.label takes precedence over format / formatter.
    },
    callbacks: {
        onClick: null,   // (point, event) => void — called when a bar element is clicked
        onHover: null,   // (point, event) => void — called when a bar element is hovered
    },
    theme: {
        maintainAspectRatio: false,
        animation: false,
        dynamicSizing: false,        // set container height (horizontal) or width (vertical) at pxPerCategory px per category plus chart overhead
        dynamicCategoryAxis: false,  // legend toggles remove categories that are only present in hidden fill groups
        pxPerCategory: 30,           // pixels allocated per category when dynamicSizing is true
    },
    zoom: {
        enabled: false,       // true | false — enable/disable zoom & pan
        mode: 'x',           // 'x' | 'y' | 'xy' — axes that can be zoomed/panned
        pan: true,            // enable drag-to-pan
        wheel: true,          // enable mouse-wheel zoom
        pinch: true,          // enable touch pinch-to-zoom
    },
    legend: {
        dense: false,         // true | false — show only colour swatches; hover for full label
    },
}
```

### Defaults

| Key                                    | Default                                                       |
| -------------------------------------- | ------------------------------------------------------------- |
| `interactive`                          | `true`                                                        |
| `orientation`                          | `'vertical'`                                                  |
| `position`                             | `'stack'`                                                     |
| `nCategories`                          | `undefined` (all categories)                                  |
| `scales.x.type`                        | `'category'`                                                  |
| `scales.x.sort`                        | `undefined` (defaults to `'total'` when `nCategories` is set) |
| `scales.x.sortDir`                     | `undefined` (`total`→desc, `alphanumeric`→asc)                |
| `scales.y.type`                        | `'linear'`                                                    |
| `scales.fill.palette`                  | Tableau-10 categorical palette                                |
| `annotations.labels.*.display`         | `false`                                                       |
| `annotations.labels.segment.value`     | `'auto'`                                                      |
| `annotations.labels.segment.placement` | `'center'`                                                    |
| `annotations.labels.segment.minSize`   | `16`                                                          |
| `annotations.labels.total.placement`   | `'outside'`                                                   |
| `annotations.referenceLines`           | `[]` (no reference lines)                                     |
| `theme.maintainAspectRatio`            | `false`                                                       |
| `theme.animation`                      | `false`                                                       |
| `theme.dynamicSizing`                  | `false`                                                       |
| `theme.dynamicCategoryAxis`            | `false`                                                       |
| `theme.pxPerCategory`                  | `30`                                                          |
| `tooltip.format`                       | `undefined`                                                   |
| `tooltip.formatter`                    | `undefined`                                                   |
| `callbacks.onClick`                    | `null`                                                        |
| `callbacks.onHover`                    | `null`                                                        |
| `labels.captions`                      | `undefined`                                                   |
| `labels.captionsOptions`               | `undefined`                                                   |
| `zoom.enabled`                         | `false`                                                       |
| `zoom.mode`                            | `'x'`                                                         |
| `zoom.pan`                             | `true`                                                        |
| `zoom.wheel`                           | `true`                                                        |
| `zoom.pinch`                           | `true`                                                        |
| `legend.dense`                         | `false`                                                       |

### Mapping modes

When `mapping.y` is provided, bar values come from that field and are coerced to
numbers. Missing or non-numeric values render as `0`.

When `mapping.y` is omitted, `bars` runs in count mode: each bar value is the
number of rows in each `x` category, optionally split by `fill`.

### Position

| Value        | Behaviour                                                   |
| ------------ | ----------------------------------------------------------- |
| `'stack'`    | Stack fill groups within each category; this is the default |
| `'dodge'`    | Render fill groups side by side                             |
| `'fill'`     | Normalize each category to percentages that sum to 100      |
| `'identity'` | Render datasets without stacked scale configuration         |

For `position: 'fill'`, the value scale is capped at 100 and tooltip labels
default to percentages unless you provide `tooltip.callbacks.label`.

#### Embedded position control

When `mapping.fill` is specified and `interactive` is not `false`, an icon-styled
control is drawn above the chart area, right-aligned at the title level, with
three buttons — stacked, grouped, and normalized bar glyphs — that toggle
`position` between `'stack'`, `'dodge'`, and `'fill'`. The button matching the
current `position` is highlighted. Hovering a button shows a tooltip label
("Stacked Bars", "Side-by-Side Bars", or "Stacked, Scaled Bars"). Clicking a button
re-renders the chart via `updateSpec`. The control is hidden when
`interactive: false` or when no `fill` mapping is set, and `'identity'` is not
offered through it.

### Label annotations

`annotations.labels` controls value labels rendered by
`chartjs-plugin-datalabels`. Labels are disabled by default and can be enabled
independently:

| Mode      | Description                                                                               |
| --------- | ----------------------------------------------------------------------------------------- |
| `segment` | Draws a value label for each rendered bar segment; placement controlled by `placement`    |
| `total`   | Draws one total label at the end of each stacked bar; placement controlled by `placement` |

#### `segment.placement`

| Value      | Behaviour                                                     |
| ---------- | ------------------------------------------------------------- |
| `'center'` | Label rendered at the center of the segment (default)         |
| `'end'`    | Label rendered outside the end of the segment, beyond the bar |

Use `placement: 'end'` to annotate individual segments outside the bar — useful for unstacked or dodge charts where each segment spans the full bar.

#### `total.placement`

| Value       | Behaviour                                                                  |
| ----------- | -------------------------------------------------------------------------- |
| `'outside'` | Total label placed beyond the end of the bar (default)                     |
| `'inside'`  | Total label placed inside the bar at the end (`anchor: end, align: start`) |

Use `placement: 'inside'` when `total` labels would overlap the legend (e.g., `position: 'fill'` with `orientation: 'vertical'`). The raw stack total is always shown regardless of placement.

`segment.value` accepts:

| Value       | Behaviour                                                               |
| ----------- | ----------------------------------------------------------------------- |
| `'auto'`    | Raw/count values, or percentages when `position: 'fill'`                |
| `'raw'`     | Raw/count values; for `position: 'fill'`, uses the pre-normalized value |
| `'value'`   | Rendered chart value                                                    |
| `'percent'` | Percentage of the category total                                        |

`format` accepts a d3-format string such as `',.0f'`, `'.1f'`, or `'.2%'`.

`formatter` accepts a **function** or a **template string**:

-   **Function:** `formatter(value, context, details)` — full control over the label.
-   **Template string:** a string with `{token}` placeholders that are interpolated automatically.

#### Formatter details object

When using a `formatter` function, `details` exposes:

| Field       | Type                              | Description                                                                                           |
| ----------- | --------------------------------- | ----------------------------------------------------------------------------------------------------- |
| `fill`      | `any \| undefined`                | Value from `mapping.fill` for this bar segment (`undefined` when `fill` is not set or point has none) |
| `value`     | `number`                          | Raw/count value of the segment; for `total` mode, the visible stack total                             |
| `percent`   | `number`                          | `value` as a percentage of the full category total across all datasets (0–100)                        |
| `category`  | `any`                             | The axis category value for this bar (type matches your source data field)                            |
| `datum`     | `Object \| Object[] \| undefined` | The source data row(s); single object in y-mapping mode, array in count mode, `undefined` if absent   |
| `mode`      | `'segment' \| 'total'`            | Whether this is a segment or total label                                                              |
| `valueType` | `'raw' \| 'percent' \| 'value'`   | The resolved value type (controlled by `segment.value`)                                               |
| `total`     | `number`                          | Full raw total for the category across all datasets (including hidden ones)                           |
| `point`     | `Object`                          | The raw Chart.js data point object                                                                    |

#### Template string tokens

| Token        | Resolves to                                              |
| ------------ | -------------------------------------------------------- |
| `{fill}`     | `fill` value (empty string when not set)                 |
| `{value}`    | Raw/count value, formatted with d3 `~g`                  |
| `{percent}`  | Percentage of the category total, formatted to 1 decimal |
| `{category}` | Axis category label                                      |

Unknown `{tokens}` are left unchanged in the output string.

Inside segment labels automatically hide when the rendered segment is smaller
than `segment.minSize` pixels. Set `minSize: 0` to disable this rule.

```js
// Inside-segment counts
gsmViz.default.bars(element, data, {
    mapping: { x: 'country', fill: 'flag' },
    annotations: {
        labels: {
            segment: {
                display: true,
                format: ',.0f',
                color: 'white',
                font: { weight: 'bold' },
            },
        },
    },
});

// Outside-segment labels (useful for dodge/unstacked bars)
gsmViz.default.bars(element, data, {
    mapping: { x: 'country', y: 'prevalence' },
    annotations: {
        labels: {
            segment: {
                display: true,
                placement: 'end',
                format: '.1f',
            },
        },
    },
});

// Template string — fill group, count, and percent on each segment
gsmViz.default.bars(element, data, {
    mapping: { x: 'country', fill: 'flag' },
    annotations: {
        labels: {
            segment: {
                display: true,
                formatter: '{fill}: {value} ({percent})',
                color: 'white',
            },
        },
    },
});

// Custom formatter function using enriched details
gsmViz.default.bars(element, data, {
    mapping: { x: 'site', fill: 'flag' },
    annotations: {
        labels: {
            segment: {
                display: true,
                formatter: (value, context, details) => {
                    return `${details.fill}\n${
                        details.value
                    } (${details.percent.toFixed(1)}%)`;
                },
            },
        },
    },
});

// End-of-stack totals (outside, default)
gsmViz.default.bars(element, data, {
    mapping: { x: 'country', y: 'count', fill: 'flag' },
    position: 'stack',
    annotations: {
        labels: {
            total: {
                display: true,
                format: ',.0f',
                color: '#333333',
            },
        },
    },
});

// End-of-stack totals (inside bar)
gsmViz.default.bars(element, data, {
    mapping: { x: 'country', y: 'count', fill: 'flag' },
    position: 'fill',
    annotations: {
        labels: {
            total: {
                display: true,
                placement: 'inside',
                format: ',.0f',
            },
        },
    },
});
```

### Reference lines

`annotations.referenceLines` draws one or more lines across the chart at a specified value on the value axis. Lines are orientation-aware: for `orientation: 'vertical'` a horizontal line is drawn; for `orientation: 'horizontal'` a vertical line is drawn.

Each entry in the array is a plain object:

| Property        | Type                           | Default      | Description                                                       |
| --------------- | ------------------------------ | ------------ | ----------------------------------------------------------------- |
| `value`         | `number` (required)            | —            | Position of the line on the value axis                            |
| `label`         | `string \| null`               | `undefined`  | Text label displayed along the line; omit or pass `null` for none |
| `color`         | `string`                       | `'#666666'`  | CSS colour string for both the line and its label                 |
| `lineWidth`     | `number` (positive)            | `1`          | Width of the line in pixels                                       |
| `lineDash`      | `number[]`                     | `[]` (solid) | Dash pattern passed to `CanvasRenderingContext2D.setLineDash`     |
| `labelPosition` | `'start' \| 'center' \| 'end'` | `'end'`      | Position of the label along the line                              |

```js
// Single reference line (no label)
gsmViz.default.bars(element, data, {
    mapping: { x: 'site', y: 'score' },
    annotations: {
        referenceLines: [{ value: 0, color: '#333333' }],
    },
});

// Dashed threshold with a label
gsmViz.default.bars(element, data, {
    mapping: { x: 'site', y: 'score' },
    annotations: {
        referenceLines: [
            {
                value: 0.05,
                label: 'Upper threshold',
                color: '#e15759',
                lineDash: [4, 4],
            },
        ],
    },
});

// Reproducing the barChart positive/negative threshold pattern
gsmViz.default.bars(element, data, {
    mapping: { x: 'site', y: 'score' },
    annotations: {
        referenceLines: [
            { value: 0.05, label: 'Amber ↑', color: '#e5a919', lineDash: [2] },
            {
                value: -0.05,
                label: '↓ Amber',
                color: '#e5a919',
                lineDash: [2],
                labelPosition: 'start',
            },
            { value: 0.1, label: 'Red ↑', color: '#e15759', lineDash: [2] },
            {
                value: -0.1,
                label: '↓ Red',
                color: '#e15759',
                lineDash: [2],
                labelPosition: 'start',
            },
        ],
    },
});

// Reference lines coexist with label annotations
gsmViz.default.bars(element, data, {
    mapping: { x: 'site', y: 'score' },
    annotations: {
        referenceLines: [
            {
                value: 0.05,
                label: 'Threshold',
                color: '#e15759',
                lineDash: [4, 4],
            },
        ],
        labels: {
            segment: { display: true },
        },
    },
});
```

### Color palettes

Bar colours are driven by `scales.fill`. Two APIs are supported:

**Array palette** — provide `scales.fill.palette` (array of hex strings) and optionally `scales.fill.order` to anchor each colour to a named fill value:

```js
scales: {
    fill: {
        order:   ['Completed', 'Discontinued', 'Ongoing'],
        palette: ['#4e79a7',   '#e15759',       '#59a14f'],
    },
}
```

**Named colour map** (`scales.fill.colors`) — a `{ name: hex }` object that is equivalent to providing both `order` and `palette` simultaneously. This is the preferred API when upstream packages maintain domain-specific colour maps:

```js
const RETENTION_COLORS = {
    Completed: '#4e79a7',
    Discontinued: '#e15759',
    Ongoing: '#59a14f',
};

gsmViz.default.bars(element, data, {
    mapping: { x: 'site', fill: 'disposition' },
    scales: { fill: { colors: RETENTION_COLORS } },
});
```

`colors` takes precedence over any separately provided `palette` + `order`. Keys that appear in the map but not in the data are silently dropped; rows whose fill value is not a key in the map are excluded (same allowlist behaviour as `scales.fill.order`).

When no palette or colors map is provided, the Tableau-10 categorical palette is used as the default. A darkened shade of each fill colour is automatically applied as `borderColor` to give each bar a visible non-colour edge cue.

### Tooltip

The `tooltip` spec key is passed through to the Chart.js [tooltip plugin](https://www.chartjs.org/docs/latest/configuration/tooltip.html), so any native Chart.js tooltip option works as-is. Two additional convenience keys — `format` and `formatter` — are provided for the most common formatting patterns.

#### Built-in point data

Each bar point carries these extra properties that are accessible inside any tooltip callback via `context.dataset.data[context.dataIndex]`:

| Property | Description                                                                                       |
| -------- | ------------------------------------------------------------------------------------------------- |
| `_rawY`  | Pre-normalization value when `position: 'fill'` is used; otherwise the same as the rendered value |
| `_datum` | The original input row (or, in count mode, the array of rows that make up the bar)                |
| `_fill`  | The fill group value assigned to this segment                                                     |

#### `tooltip.format`

A shorthand string that injects a pre-built `label` callback. The prefix (`"Label: "`) is omitted when no `mapping.fill` is set.

| Value             | Output example          |
| ----------------- | ----------------------- |
| `'count'`         | `"Treated: 42"`         |
| `'percent'`       | `"Treated: 33.3%"`      |
| `'count+percent'` | `"Treated: 42 (33.3%)"` |
| `'percent+count'` | `"Treated: 33.3% (42)"` |

The percentage is always the segment's raw count divided by the **full** category total across all groups — including groups currently hidden via the legend (the same denominator used by `annotations.labels.segment` with `value: 'percent'`). Hiding a legend group does not change the denominator.

#### `tooltip.formatter`

A callback for full control over the tooltip label line. Called as:

```
formatter(count, context, details)
```

| Parameter         | Type     | Description                                                                                  |
| ----------------- | -------- | -------------------------------------------------------------------------------------------- |
| `count`           | `number` | Raw count / value for this segment                                                           |
| `context`         | `Object` | Standard Chart.js tooltip callback context                                                   |
| `details`         | `Object` | `{ percent, total, fill, datum }`                                                            |
| `details.percent` | `number` | Percentage of category total (0–100)                                                         |
| `details.total`   | `number` | Sum of raw values across **all** datasets for this category (including legend-hidden groups) |
| `details.fill`    | `*`      | Fill group value (`_fill`) for this segment                                                  |
| `details.datum`   | `*`      | Original input row (`_datum`)                                                                |

#### Precedence

1. `tooltip.callbacks.label` — used as-is (standard Chart.js)
2. `tooltip.formatter` — takes priority over `format`
3. `tooltip.format` — built-in formatted callback
4. `position: 'fill'` default — percentage callback injected when none of the above are present
5. Chart.js default tooltip label

#### Examples

```js
// Built-in count+percent format
gsmViz.default.bars(element, data, {
    mapping: { x: 'country', fill: 'flag' },
    tooltip: { format: 'count+percent' },
});

// Custom formatter with enriched context
gsmViz.default.bars(element, data, {
    mapping: { x: 'country', y: 'count', fill: 'flag' },
    tooltip: {
        formatter: (count, context, { percent, total, fill }) =>
            `${fill}: ${count} of ${total} (${percent.toFixed(1)}%)`,
    },
});

// Raw Chart.js callback (always supported)
gsmViz.default.bars(element, data, {
    mapping: { x: 'country', y: 'value' },
    tooltip: {
        callbacks: {
            label: (ctx) => `Value: ${ctx.parsed.y.toFixed(2)}`,
        },
    },
});
```

### Ordering and labels

Categories are sorted alphanumerically by default. Set `scales.x.order` to
provide an explicit category order. Categories listed in `order` but absent
from the data are dropped; data categories not listed are appended
alphanumerically.

Fill groups appear in data order by default. Use `scales.fill.order` or
`scales.fill.colors` to set an explicit fill order. When either is set, it also
acts as an allowlist: rows with fill values not listed are excluded. Palette
colours follow the fill order position, so colours stay aligned even when some
fill values are absent from the data.

Axis labels default to `mapping.x` and `mapping.y`. The legend title defaults to
`mapping.fill`. Set `scales.x.label`, `scales.y.label`, or
`scales.fill.label` to `null` or `''` to hide the corresponding label.

### Dense legend

When a chart has many fill groups, the legend can become large and consume
significant vertical space. Set `legend.dense` to `true` to show only colour
swatches (no text labels). Hovering a swatch reveals a tooltip with the full
label.

```js
bars(data, {
    mapping: { x: 'site', y: 'count', fill: 'arm' },
    legend: { dense: true },
});
```

Dense mode works with all legend features including `dynamicCategoryAxis`
click-to-toggle.

---

## Captions

`labels.captions` attaches one or more caption lines below the chart using
Chart.js's built-in `subtitle` plugin. Captions are suited for footnotes,
data-source attributions, and programmatic messages generated by pipeline steps
(such as Top-N truncation notices from issue #493).

```js
// Single caption string
gsmViz.default.bars(element, data, {
    mapping: { x: 'category', y: 'value' },
    labels: {
        title: 'Adverse Events by Category',
        captions: 'Source: Study XYZ, Database lock 2024-01-15',
    },
});

// Array of caption strings — each element is a separate rendered line
gsmViz.default.bars(element, data, {
    mapping: { x: 'category', y: 'value', fill: 'arm' },
    labels: {
        title: 'Adverse Events by Category',
        captions: [
            'Top 5 categories shown; 3 others grouped as "Other".',
            'Source: Study XYZ, Database lock 2024-01-15',
        ],
    },
});
```

Pass `null`, `undefined`, or an empty array to suppress captions entirely
(the default).

Captions default to **bottom, left-aligned**. Override any Chart.js subtitle
option via `labels.captionsOptions`:

```js
gsmViz.default.bars(element, data, {
    mapping: { x: 'category', y: 'value' },
    labels: {
        captions: 'Source: Study XYZ',
        captionsOptions: {
            position: 'top', // 'top' | 'bottom' (default: 'bottom')
            align: 'end', // 'start' | 'center' | 'end' (default: 'start')
            font: { size: 10, style: 'italic' },
            padding: { top: 8 },
        },
    },
});
```

`captionsOptions` is spread onto the Chart.js `subtitle` config, so any
[subtitle plugin option](https://www.chartjs.org/docs/latest/configuration/title.html)
is accepted. `text` is always derived from `labels.captions` and cannot be
overridden through `captionsOptions`.

---

## Top-N category limiting

Set `spec.nCategories` to a positive integer to display only the top N
categories, automatically excluding the rest.

```js
gsmViz.default.bars(element, data, {
    mapping: { x: 'site', y: 'count' },
    nCategories: 10,
    scales: {
        x: {
            label: 'Site',
            sort: 'total', // 'total' (default) | 'alphanumeric'
        },
    },
});
```

### Selection modes (`scales.x.sort`)

| Value               | Behaviour                                                                                                                                                             |
| ------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `'total'` (default) | Keeps the top N categories by descending aggregate value (sum of `y`, or row count in count mode). Ties broken alphanumerically. Displayed in descending-total order. |
| `'alphanumeric'`    | Keeps the first N categories in alphanumeric order. No reordering.                                                                                                    |

When `nCategories` is omitted or `undefined`, all categories are shown and
`sort` has no effect.

### Auto-caption

When `scales.x.sort` is `'total'` (or unset, which defaults to `'total'`) and
at least one category is excluded, a caption line is automatically appended to
the chart subtitle:

> `Displaying top N values of {label} by total. Remaining M values of {label} are hidden.`

where `{label}` is `scales.x.label` (or `mapping.x` when the label is unset).
The auto-caption is appended after any captions supplied via `labels.captions`.

No auto-caption is generated for `'alphanumeric'` sort.

---

## Zoom & Pan

Set `spec.zoom.enabled` to `true` to allow users to zoom and pan the chart.
This is especially useful for bar charts with many categorical values, enabling
users to zoom in for detail.

```js
gsmViz.default.bars(element, data, {
    mapping: { x: 'site', y: 'value' },
    zoom: {
        enabled: true,
        mode: 'x', // zoom/pan along the x-axis only
    },
});
```

### Options

| Key       | Type      | Default | Description                             |
| --------- | --------- | ------- | --------------------------------------- |
| `enabled` | `boolean` | `false` | Enable the zoom & pan feature           |
| `mode`    | `string`  | `'x'`   | Axis direction: `'x'`, `'y'`, or `'xy'` |
| `pan`     | `boolean` | `true`  | Allow click-and-drag panning            |
| `wheel`   | `boolean` | `true`  | Allow mouse-wheel zooming               |
| `pinch`   | `boolean` | `true`  | Allow touch pinch-to-zoom               |

### Resetting zoom

When zoom is enabled, the chart instance exposes a `resetZoom()` method
(provided by `chartjs-plugin-zoom`):

```js
const chart = gsmViz.default.bars(element, data, {
    mapping: { x: 'site', y: 'value' },
    zoom: { enabled: true },
});

// Programmatically reset zoom level:
chart.resetZoom();
```

### Notes

-   Zoom is disabled by default — existing charts are unaffected.
-   The zoom plugin is globally registered and available to all Chart.js instances
    in the bundle, but only activated when `spec.zoom.enabled` is `true`.
-   For horizontal bar charts, set `mode: 'y'` to zoom along the category axis.

---

## Callbacks

Use `spec.callbacks` to hook into click and hover interactions. Each callback receives the Chart.js **point object** for the active bar element plus the raw Chart.js event.

```js
gsmViz.default.bars(element, data, {
    mapping: { x: 'category', y: 'value', fill: 'group' },
    callbacks: {
        onClick: (point, event) => {
            console.log('clicked:', point.x, point.y, point._datum);
        },
        onHover: (point, event) => {
            console.log('hovered:', point.x, point.y);
        },
    },
});
```

### Point object

| Property | Description                                                                                           |
| -------- | ----------------------------------------------------------------------------------------------------- |
| `x`      | Category value (or numeric value in `horizontal` orientation)                                         |
| `y`      | Numeric bar value (or category value in `horizontal` orientation; percentage when `position: 'fill'`) |
| `_fill`  | Fill group value for this segment (`undefined` when no `mapping.fill`)                                |
| `_datum` | Original input row, or (in count mode) the array of rows that make up the bar                         |

> **Note on horizontal orientation:** When `spec.orientation` is `'horizontal'`, Chart.js swaps the axes internally. As a result, `point.x` holds the numeric value and `point.y` holds the category value — the reverse of vertical (default) orientation.

### Cursor behaviour

When either `callbacks.onClick` or `callbacks.onHover` is registered, the cursor automatically changes to `pointer` when hovering over a bar element, and resets to `default` when the cursor moves off. No cursor changes occur when no callbacks are set.

### Notes

-   `callbacks.onClick` is called only when the pointer is directly over a bar element. Clicks on empty chart areas are ignored.
-   Both callbacks are optional and independent. You can supply one without the other.
-   `callbacks` defaults to `{ onClick: null, onHover: null }`.

---

## Helper methods

After instantiation the chart exposes `chart.helpers`:

| Method                          | Description                                     |
| ------------------------------- | ----------------------------------------------- |
| `updateData(chart, data, spec)` | Replace the underlying data array and re-render |
| `updateSpec(chart, spec)`       | Apply a partial spec update and re-render       |
| `exportImage(chart, filename?)` | Download the chart as a PNG file                |

All three helpers follow the same calling convention: the chart instance is
always the first argument.

### `exportImage(chart, filename?)`

Captures the rendered chart canvas (including the white background) and
triggers a browser download.

When `filename` is omitted the name is derived from the chart spec using
this priority order:

1. `spec.labels.title` — sanitized to lowercase with spaces replaced by dashes
2. `spec.scales.fill.label` + `-by-` + `spec.scales.x.label` (both must be present)
3. `spec.mapping.fill` (if set) + `-by-` + `spec.mapping.x`
4. `bars.png` — hard fallback when none of the above are available

In all cases the filename is lowercased, invalid characters stripped, and
spaces replaced with dashes.

```js
// Auto-derived from spec — e.g. "retention-status-by-site.png"
chart.helpers.exportImage(chart);

// Explicit filename
chart.helpers.exportImage(chart, 'retention-by-site.png');
```

The chart already renders with a white background (applied by the
`displayWhiteBackground` plugin), so the exported PNG is fully opaque and
suitable for inclusion in documents and reports.

---

## Usage

```html
<script src="path/to/index.js"></script>

<div id="chart"></div>

<script>
    const data = [
        { country: 'US', metric: 'AE Rate', value: 0.12 },
        { country: 'US', metric: 'Query Rate', value: 0.34 },
        { country: 'EU', metric: 'AE Rate', value: 0.09 },
        { country: 'EU', metric: 'Query Rate', value: 0.28 },
    ];

    const chart = gsmViz.default.bars(document.getElementById('chart'), data, {
        mapping: { x: 'country', y: 'value', fill: 'metric' },
        orientation: 'vertical',
        position: 'dodge',
        labels: { title: 'Metric Rates by Country' },
    });
</script>
```

### Updating the chart

```js
// Replace data
chart.helpers.updateData(chart, newData, chart.data._spec_);

// Apply a partial spec update (merges into existing spec)
chart.helpers.updateSpec(chart, {
    orientation: 'horizontal',
    labels: { title: 'Updated Title' },
});
```

---

## Live example

[Open interactive example](../bars/ ':ignore')
