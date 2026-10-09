# scatterPlot

Renders a scatter plot suited for clinical-trial risk-based monitoring.  
Each data point represents one group (site, country, etc.) positioned by two
numeric axes and coloured by flag status. Interactive tooltips, click/hover
callbacks, and programmatic update helpers are built in.

---

## Signature

```js
gsmViz.scatterPlot(element, results, config, bounds, groupMetadata);
```

| Parameter       | Type             | Default  | Description                                                 |
| --------------- | ---------------- | -------- | ----------------------------------------------------------- |
| `element`       | `Node \| string` | `'body'` | DOM element or CSS selector in which to render the chart    |
| `results`       | `Array`          | `[]`     | Analysis results — one object per group ID                  |
| `config`        | `Object`         | `null`   | Chart configuration (see [Config options](#config-options)) |
| `bounds`        | `Array`          | `null`   | Optional predicted-bounds data                              |
| `groupMetadata` | `Array`          | `null`   | Optional group-level metadata                               |

**Returns** a Chart.js chart instance.

---

## Config options

All properties are optional and merged with the defaults shown below.

| Key                        | Type                  | Default                                        | Description                                           |
| -------------------------- | --------------------- | ---------------------------------------------- | ----------------------------------------------------- |
| `x`                        | `string`              | `'Denominator'`                                | Data field mapped to the x-axis                       |
| `xType`                    | `string`              | `'logarithmic'`                                | Scale type for x-axis (`'logarithmic'` or `'linear'`) |
| `xLabel`                   | `string`              | _(derived from `x`)_                           | x-axis label                                          |
| `y`                        | `string`              | `'Numerator'`                                  | Data field mapped to the y-axis                       |
| `yType`                    | `string`              | `'linear'`                                     | Scale type for y-axis                                 |
| `yLabel`                   | `string`              | _(derived from `y`)_                           | y-axis label                                          |
| `color`                    | `string`              | `'Flag'`                                       | Data field used to colour points                      |
| `GroupLevel`               | `string`              | `'Site'`                                       | Group level label (e.g. `'Site'`, `'Country'`)        |
| `groupLabelKey`            | `string`              | `'InvestigatorLastName'`                       | Field used as the group display label                 |
| `groupParticipantCountKey` | `string`              | `'ParticipantCount'`                           | Field holding participant count                       |
| `groupTooltipKeys`         | `Array\|null`         | `null`                                         | Extra fields shown in the group tooltip               |
| `resultTooltipKeys`        | `Array`               | `['Score','Metric','Numerator','Denominator']` | Fields shown in the result tooltip                    |
| `selectedGroupIDs`         | `string\|Array\|null` | `null`                                         | Pre-selected group ID(s) to highlight                 |
| `displayTitle`             | `boolean`             | `false`                                        | Show the auto-generated chart title                   |
| `displayLegend`            | `boolean`             | `true`                                         | Show the chart legend                                 |
| `displayTrendLine`         | `boolean`             | `false`                                        | Overlay a linear trend line                           |
| `maintainAspectRatio`      | `boolean`             | `false`                                        | Passed to Chart.js                                    |

### Callbacks

| Key             | Signature         | Default behaviour    |
| --------------- | ----------------- | -------------------- |
| `hoverCallback` | `(datum) => void` | no-op                |
| `clickCallback` | `(datum) => void` | `console.log(datum)` |

---

## Helper methods

After instantiation the chart exposes `chart.helpers`:

| Method                                                      | Description                                              |
| ----------------------------------------------------------- | -------------------------------------------------------- |
| `updateConfig(chart, config)`                               | Rebuild the chart with a new config object               |
| `updateData(chart, results, config, bounds, groupMetadata)` | Replace the underlying data and re-render                |
| `updateOption(chart, key, value)`                           | Update a single Chart.js option and re-render            |
| `triggerTooltip(chart)`                                     | Programmatically show the tooltip for the selected group |

---

## Usage

```html
<script src="https://d3js.org/d3.v7.min.js"></script>
<script src="path/to/index.js"></script>

<div id="chart"></div>

<script>
    d3.csv('results.csv').then(function (results) {
        const chart = gsmViz.default.scatterPlot(
            document.getElementById('chart'),
            results,
            {
                x: 'Denominator',
                y: 'Numerator',
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
// Change x-axis type after initial render
chart.helpers.updateOption(chart, 'scales.x.type', 'linear');

// Highlight a specific group
chart.data.config.selectedGroupIDs = 'SITE-042';
chart.helpers.updateConfig(chart, chart.data.config);
```

---

## Live example

[Open interactive example](../scatterPlot/ ':ignore')
