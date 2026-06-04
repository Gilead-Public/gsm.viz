# timeSeries

Renders a time-series chart showing metric trends across snapshot dates.  
Supports continuous (score/numerator) and discrete (flag/risk-count) data
types, optional confidence-interval bands, threshold annotations, box-plot
or violin distribution overlays, and per-group line highlighting.

---

## Signature

```js
gsmViz.timeSeries(element, results, config, thresholds, intervals, groupMetadata)
```

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `element` | `Node \| string` | — | DOM element or CSS selector in which to render the chart |
| `results` | `Array` | — | Analysis results — one object per group ID per snapshot date |
| `config` | `Object` | `null` | Chart configuration (see [Config options](#config-options)) |
| `thresholds` | `Array` | `null` | Optional threshold annotation values (may vary by snapshot date) |
| `intervals` | `Array` | `null` | Optional confidence-interval data |
| `groupMetadata` | `Array` | `null` | Optional group-level metadata |

**Returns** a Chart.js chart instance.

---

## Config options

All properties are optional and merged with the defaults shown below.

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `x` | `string` | `'SnapshotDate'` | Data field mapped to the x-axis |
| `xType` | `string` | `'category'` | Scale type for x-axis |
| `xLabel` | `string` | `'Snapshot Date'` | x-axis label |
| `y` | `string` | `'Score'` | Data field mapped to the y-axis (`'Score'`, `'Numerator'`, `'Metric'`, or flag/risk fields) |
| `yType` | `string` | `'linear'` | Scale type for y-axis |
| `yLabel` | `string` | *(derived from `y` and `dataType`)* | y-axis label |
| `color` | `string` | `'Flag'` | Data field used to colour lines |
| `dataType` | `string` | *(derived)* | `'continuous'` or `'discrete'` — auto-detected from `y` field |
| `distributionDisplay` | `string` | `'boxplot'` | Aggregate distribution overlay: `'boxplot'` or `'violin'` |
| `discreteUnit` | `string\|null` | `null` | Unit label for discrete data (`'Metric'` or `'Site'`) |
| `aggregateLabel` | `string` | `'Study'` | Label for the study-level aggregate series |
| `annotateThreshold` | `boolean` | *(true when thresholds provided)* | Draw threshold annotation lines |
| `GroupLevel` | `string` | `'Site'` | Group level label |
| `groupLabelKey` | `string` | `'InvestigatorLastName'` | Field used as the group display label |
| `groupParticipantCountKey` | `string` | `'ParticipantCount'` | Field holding participant count |
| `groupTooltipKeys` | `Array\|null` | `null` | Extra fields shown in the group tooltip |
| `resultTooltipKeys` | `Array` | `['Score','Metric','Numerator','Denominator']` | Fields shown in the result tooltip |
| `selectedGroupIDs` | `string\|Array\|null` | `null` | Pre-selected group ID(s) to highlight |
| `displayTitle` | `boolean` | `false` | Show the auto-generated chart title |
| `maintainAspectRatio` | `boolean` | `false` | Passed to Chart.js |

### Callbacks

| Key | Signature | Default behaviour |
|-----|-----------|-------------------|
| `hoverCallback` | `(datum) => void` | no-op |
| `clickCallback` | `(datum) => void` | `console.log(datum)` |

---

## Helper methods

After instantiation the chart exposes `chart.helpers`:

| Method | Description |
|--------|-------------|
| `updateData(results, config, thresholds, intervals, groupMetadata)` | Replace the underlying data and re-render |
| `updateSelectedGroupIDs(groupIDs)` | Highlight one or more groups without a full data reload |

---

## Usage

```html
<script src="https://d3js.org/d3.v7.min.js"></script>
<script src="path/to/index.js"></script>

<div id="chart"></div>

<script>
    d3.csv('results.csv').then(function (results) {
        const chart = gsmViz.default.timeSeries(
            document.getElementById('chart'),
            results,
            {
                y: 'Score',
                displayTitle: true,
                clickCallback: function (datum) {
                    console.log('Clicked group:', datum.GroupID);
                },
            }
        );
    });
</script>
```

### Updating the chart

```js
// Highlight a specific site
chart.helpers.updateSelectedGroupIDs('SITE-007');

// Reload with new snapshot data
chart.helpers.updateData(
    newResults,
    chart.data.config,
    newThresholds,
    null,
    groupMetadata
);
```

---

## Live examples

- [Time Series (continuous)](../timeSeriesContinuous/ ':ignore')
- [Time Series (with confidence intervals)](../timeSeriesWithCI/ ':ignore')
