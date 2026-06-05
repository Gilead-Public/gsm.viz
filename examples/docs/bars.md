# bars

Renders a bar chart using a **ggplot2-inspired spec** object. Introduced in
v2.4.0, `bars` is a lower-level, more composable alternative to `barChart`.
It accepts an aesthetic-mapping spec (x, y, fill) and supports vertical /
horizontal orientation, stacked / grouped positioning, custom colour palettes,
and per-axis scale configuration.

---

## Signature

```js
gsmViz.bars(element, data, spec);
```

| Parameter | Type             | Default  | Description                                              |
| --------- | ---------------- | -------- | -------------------------------------------------------- |
| `element` | `Node \| string` | `'body'` | DOM element or CSS selector in which to render the chart |
| `data`    | `Array`          | `[]`     | Array of plain data objects                              |
| `spec`    | `Object`         | `{}`     | Chart specification (see [Spec](#spec))                  |

**Returns** a Chart.js chart instance.

---

## Spec

The spec mirrors ggplot2's `aes()` + `geom_bar()` + `scale_*` + `labs()` + `theme()` pattern.

```js
{
    mapping: {           // required
        x: 'fieldName',
        y: 'fieldName',
        fill: 'fieldName',   // optional — groups bars by colour
    },
    orientation: 'vertical',   // 'vertical' | 'horizontal'
    position: 'stack',         // 'stack' | 'dodge' | 'identity'
    scales: {
        x: {
            type: 'category',  // Chart.js scale type
            label: undefined,  // axis label string
        },
        y: {
            type: 'linear',
            label: undefined,
        },
        fill: {
            palette: [ /* array of hex colour strings */ ],
        },
    },
    labels: {
        title: undefined,
        subtitle: undefined,
    },
    theme: {
        maintainAspectRatio: false,
        animation: false,
        dynamicSizing: false,   // set canvas height (horizontal) or width (vertical) to fit all categories
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
