# sparkline

Renders a compact sparkline chart showing a single group's metric trend over
snapshot dates. Designed to be embedded in tables or dashboards alongside
other elements. Threshold annotations, data labels, and programmatic update
helpers are included.

---

## Signature

```js
gsmViz.sparkline(element, results, config, thresholds);
```

| Parameter    | Type             | Default  | Description                                                        |
| ------------ | ---------------- | -------- | ------------------------------------------------------------------ |
| `element`    | `Node \| string` | `'body'` | DOM element or CSS selector in which to render the chart           |
| `results`    | `Array`          | `[]`     | Analysis results — one object per snapshot date for a single group |
| `config`     | `Object`         | `null`   | Chart configuration (see [Config options](#config-options))        |
| `thresholds` | `Array`          | `null`   | Optional threshold annotation values                               |

**Returns** a Chart.js chart instance.

---

## Config options

All properties are optional and merged with the defaults shown below.

| Key                   | Type      | Default              | Description                                                                            |
| --------------------- | --------- | -------------------- | -------------------------------------------------------------------------------------- |
| `x`                   | `string`  | `'SnapshotDate'`     | Data field mapped to the x-axis                                                        |
| `xType`               | `string`  | `'category'`         | Scale type for x-axis                                                                  |
| `xLabel`              | `string`  | `'Snapshot Date'`    | x-axis label                                                                           |
| `y`                   | `string`  | `'Score'`            | Data field mapped to the y-axis (`'Score'`, `'Numerator'`, `'Metric'`, or flag fields) |
| `yType`               | `string`  | `'linear'`           | Scale type for y-axis                                                                  |
| `yLabel`              | `string`  | _(derived from `y`)_ | y-axis label                                                                           |
| `color`               | `string`  | `'Flag'`             | Data field used to colour the line                                                     |
| `dataType`            | `string`  | _(derived)_          | `'continuous'` or `'discrete'` — auto-detected from `y` field                          |
| `annotation`          | `string`  | _(derived)_          | Field shown as inline data labels                                                      |
| `nSnapshots`          | `number`  | `5`                  | Number of most-recent snapshots to display                                             |
| `displayThresholds`   | `boolean` | `false`              | Draw threshold annotation lines                                                        |
| `maintainAspectRatio` | `boolean` | `false`              | Passed to Chart.js                                                                     |

### Callbacks

| Key             | Signature         | Default behaviour    |
| --------------- | ----------------- | -------------------- |
| `hoverCallback` | `(datum) => void` | no-op                |
| `clickCallback` | `(datum) => void` | `console.log(datum)` |

---

## Helper methods

After instantiation the chart exposes `chart.helpers`:

| Method                                           | Description                                   |
| ------------------------------------------------ | --------------------------------------------- |
| `updateConfig(chart, config)`                    | Rebuild the chart with a new config object    |
| `updateData(chart, results, config, thresholds)` | Replace the underlying data and re-render     |
| `updateOption(chart, key, value)`                | Update a single Chart.js option and re-render |

---

## Usage

```html
<script src="path/to/index.js"></script>

<div id="sparkline"></div>

<script>
    // results is filtered to a single GroupID
    const chart = gsmViz.default.sparkline(
        document.getElementById('sparkline'),
        results,
        {
            y: 'Score',
            nSnapshots: 6,
            displayThresholds: true,
        },
        thresholds
    );
</script>
```

### Updating the chart

```js
// Switch to Numerator view
chart.data.config.y = 'Numerator';
chart.helpers.updateConfig(chart, chart.data.config);

// Load new data
chart.helpers.updateData(chart, newResults, chart.data.config);
```

---

## Live example

[Open interactive example](../sparkline/ ':ignore')
