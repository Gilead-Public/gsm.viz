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
            label: undefined,  // defaults to mapping.fill; null or '' hides legend title
            order: undefined,  // optional fill order / allowlist array
        },
    },
    labels: {
        title: undefined,
    },
    tooltip: {
        // Chart.js tooltip options and callbacks
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

| Key                         | Default                        |
| --------------------------- | ------------------------------ |
| `orientation`               | `'vertical'`                   |
| `position`                  | `'stack'`                      |
| `scales.x.type`             | `'category'`                   |
| `scales.y.type`             | `'linear'`                     |
| `scales.fill.palette`       | Tableau-10 categorical palette |
| `theme.maintainAspectRatio` | `false`                        |
| `theme.animation`           | `false`                        |
| `theme.dynamicSizing`       | `false`                        |
| `theme.dynamicCategoryAxis` | `false`                        |

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

### Ordering and labels

Categories are sorted alphanumerically by default. Set `scales.x.order` to
provide an explicit category order. Categories listed in `order` but absent
from the data are dropped; data categories not listed are appended
alphanumerically.

Fill groups appear in data order by default. Set `scales.fill.order` to provide
an explicit fill order. When set, it also acts as an allowlist: rows with fill
values not listed in `scales.fill.order` are excluded. Palette colours follow
the fill order position, so colours stay aligned even when some fill values are
absent from the data.

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
