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
    orientation: 'vertical',   // 'vertical' | 'horizontal'
    position: 'stack',         // 'stack' | 'dodge' | 'fill' | 'identity'
    scales: {
        x: {
            type: 'category',  // Chart.js scale type
            label: undefined,  // defaults to mapping.x; null or '' hides label
            order: undefined,  // optional category order array
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
    },
    annotations: {
        labels: {
            segment: {
                display: false,    // inside each bar segment
                value: 'auto',     // 'auto' | 'value' | 'raw' | 'percent'
                format: undefined, // optional d3-format string, e.g. ',.0f'
                formatter: undefined,
                minSize: 16,       // hide if the segment is smaller than this many px
                color: undefined,
                font: undefined,
            },
            total: {
                display: false,    // end-of-stack total labels, placed outside the bar
                format: undefined,
                formatter: undefined,
                color: undefined,
                font: undefined,
            },
            inside: {
                display: false,    // end-of-stack total labels, placed inside the bar
                format: undefined,
                formatter: undefined,
                color: undefined,
                font: undefined,
            },
            outside: {
                display: false,    // outside-bar value labels
                value: 'auto',     // 'auto' | 'value' | 'raw' | 'percent'
                format: undefined,
                formatter: undefined,
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
    theme: {
        maintainAspectRatio: false,
        animation: false,
        dynamicSizing: false,        // set container height (horizontal) or width (vertical) at 30 px per category plus chart overhead
        dynamicCategoryAxis: false,  // legend toggles remove categories that are only present in hidden fill groups
    },
}
```

### Defaults

| Key                                  | Default                        |
| ------------------------------------ | ------------------------------ |
| `orientation`                        | `'vertical'`                   |
| `position`                           | `'stack'`                      |
| `scales.x.type`                      | `'category'`                   |
| `scales.y.type`                      | `'linear'`                     |
| `scales.fill.palette`                | Tableau-10 categorical palette |
| `annotations.labels.*.display`       | `false`                        |
| `annotations.labels.segment.value`   | `'auto'`                       |
| `annotations.labels.segment.minSize` | `16`                           |
| `annotations.labels.outside.value`   | `'auto'`                       |
| `theme.maintainAspectRatio`          | `false`                        |
| `theme.animation`                    | `false`                        |
| `theme.dynamicSizing`                | `false`                        |
| `theme.dynamicCategoryAxis`          | `false`                        |
| `tooltip.format`                     | `undefined`                    |
| `tooltip.formatter`                  | `undefined`                    |

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

### Label annotations

`annotations.labels` controls value labels rendered by
`chartjs-plugin-datalabels`. Labels are disabled by default and can be enabled
independently:

| Mode      | Description                                                                 |
| --------- | --------------------------------------------------------------------------- |
| `segment` | Draws labels inside each rendered bar segment                               |
| `total`   | Draws one total label at the end of each stacked bar (outside the bar)      |
| `inside`  | Draws one total label at the end of each stacked bar, placed inside the bar |
| `outside` | Draws value labels outside bars, useful for unstacked bars                  |

`inside` is useful when `total` labels would overlap the legend (e.g., `position: 'fill'` with
`orientation: 'vertical'`). It shows the same raw stack total as `total` but uses
`anchor: 'end', align: 'start'` so the text extends inward rather than protruding beyond the bar.

`segment.value` and `outside.value` accept:

| Value       | Behaviour                                                               |
| ----------- | ----------------------------------------------------------------------- |
| `'auto'`    | Raw/count values, or percentages when `position: 'fill'`                |
| `'raw'`     | Raw/count values; for `position: 'fill'`, uses the pre-normalized value |
| `'value'`   | Rendered chart value                                                    |
| `'percent'` | Percentage of the category total                                        |

`format` accepts a d3-format string such as `',.0f'`, `'.1f'`, or `'.2%'`.
Use `formatter(value, context, details)` for full control. `details` includes
`mode`, `valueType`, `point`, and `total`.

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

// End-of-stack totals
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

// Outside-bar labels
gsmViz.default.bars(element, data, {
    mapping: { x: 'country', y: 'prevalence' },
    annotations: {
        labels: {
            outside: {
                display: true,
                format: '.1f',
            },
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

---

## Helper methods

After instantiation the chart exposes `chart.helpers`:

| Method                          | Description                                     |
| ------------------------------- | ----------------------------------------------- |
| `updateData(chart, data, spec)` | Replace the underlying data array and re-render |
| `updateSpec(chart, spec)`       | Apply a partial spec update and re-render       |

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
