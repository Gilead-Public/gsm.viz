# barChart

Renders a vertical or horizontal bar chart for risk-based monitoring.  
Each bar represents one group (site, country, etc.) and bars are coloured by
flag status. Threshold annotations, interactive tooltips, click/hover
callbacks, and programmatic update helpers are built in.

---

## Signature

```js
gsmViz.barChart(element, results, config, thresholds, groupMetadata);
```

| Parameter       | Type             | Default  | Description                                                 |
| --------------- | ---------------- | -------- | ----------------------------------------------------------- |
| `element`       | `Node \| string` | `'body'` | DOM element or CSS selector in which to render the chart    |
| `results`       | `Array`          | `[]`     | Analysis results — one object per group ID                  |
| `config`        | `Object`         | `null`   | Chart configuration (see [Config options](#config-options)) |
| `thresholds`    | `Array`          | `null`   | Optional threshold annotation values                        |
| `groupMetadata` | `Array`          | `null`   | Optional group-level metadata                               |

**Returns** a Chart.js chart instance.

---

## Config options

All properties are optional and merged with the defaults shown below.

| Key                        | Type                  | Default                                        | Description                                                               |
| -------------------------- | --------------------- | ---------------------------------------------- | ------------------------------------------------------------------------- |
| `x`                        | `string`              | `'GroupID'`                                    | Data field mapped to the x-axis (category axis)                           |
| `xType`                    | `string`              | `'category'`                                   | Scale type for x-axis                                                     |
| `xLabel`                   | `string`              | `'Group'`                                      | x-axis label                                                              |
| `y`                        | `string`              | `'Score'`                                      | Data field mapped to the y-axis (`'Score'`, `'Numerator'`, or `'Metric'`) |
| `yType`                    | `string`              | `'linear'`                                     | Scale type for y-axis                                                     |
| `yLabel`                   | `string`              | _(derived from `y`)_                           | y-axis label                                                              |
| `color`                    | `string`              | `'Flag'`                                       | Data field used to colour bars                                            |
| `GroupLevel`               | `string`              | `'Site'`                                       | Group level label                                                         |
| `groupLabelKey`            | `string`              | `'InvestigatorLastName'`                       | Field used as the group display label                                     |
| `groupParticipantCountKey` | `string`              | `'ParticipantCount'`                           | Field holding participant count                                           |
| `groupTooltipKeys`         | `Array\|null`         | `null`                                         | Extra fields shown in the group tooltip                                   |
| `resultTooltipKeys`        | `Array`               | `['Score','Metric','Numerator','Denominator']` | Fields shown in the result tooltip                                        |
| `selectedGroupIDs`         | `string\|Array\|null` | `null`                                         | Pre-selected group ID(s) to highlight                                     |
| `displayTitle`             | `boolean`             | `false`                                        | Show the auto-generated chart title                                       |
| `maintainAspectRatio`      | `boolean`             | `false`                                        | Passed to Chart.js                                                        |

### Callbacks

| Key             | Signature         | Default behaviour    |
| --------------- | ----------------- | -------------------- |
| `hoverCallback` | `(datum) => void` | no-op                |
| `clickCallback` | `(datum) => void` | `console.log(datum)` |

---

## Helper methods

After instantiation the chart exposes `chart.helpers`:

| Method                                                          | Description                                              |
| --------------------------------------------------------------- | -------------------------------------------------------- |
| `updateConfig(chart, config)`                                   | Rebuild the chart with a new config object               |
| `updateData(chart, results, config, thresholds, groupMetadata)` | Replace the underlying data and re-render                |
| `updateOption(chart, key, value)`                               | Update a single Chart.js option and re-render            |
| `triggerTooltip(chart)`                                         | Programmatically show the tooltip for the selected group |

---

## Usage

```html
<script src="https://d3js.org/d3.v7.min.js"></script>
<script src="path/to/index.js"></script>

<div id="chart"></div>

<script>
    d3.csv('results.csv').then(function (results) {
        const chart = gsmViz.default.barChart(
            document.getElementById('chart'),
            results,
            {
                y: 'Score',
                displayTitle: true,
                clickCallback: function (datum) {
                    console.log('Clicked:', datum.GroupID);
                },
            }
        );
    });
</script>
```

### Updating the chart

```js
// Switch y-axis to Numerator
chart.data.config.y = 'Numerator';
chart.helpers.updateConfig(chart, chart.data.config);

// Reload with new data
chart.helpers.updateData(chart, newResults, chart.data.config);
```

---

## Live example

[Open interactive example](../barChart/ ':ignore')
