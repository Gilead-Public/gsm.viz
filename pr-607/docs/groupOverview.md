# groupOverview

Renders a sortable, filterable HTML table that summarises metric results
across all groups (sites or countries). Each row is one group; each column is
one KRI metric. Cells are colour-coded by flag status and include sparkline
thumbnails. Clicking a cell or group row fires configurable callbacks.

---

## Signature

```js
gsmViz.groupOverview(element, results, config, groupMetadata, metricMetadata);
```

| Parameter        | Type             | Default  | Description                                                 |
| ---------------- | ---------------- | -------- | ----------------------------------------------------------- |
| `element`        | `Node \| string` | `'body'` | DOM element or CSS selector in which to render the table    |
| `results`        | `Array`          | `[]`     | Analysis results — one object per group ID per metric ID    |
| `config`         | `Object`         | `null`   | Table configuration (see [Config options](#config-options)) |
| `groupMetadata`  | `Array`          | `null`   | Optional group-level metadata (name, country, etc.)         |
| `metricMetadata` | `Array`          | `null`   | Optional metric-level metadata (label, description, etc.)   |

**Returns** an HTML table element with an `updateTable` method attached.

---

## Config options

All properties are optional and merged with the defaults shown below.

| Key                        | Type           | Default                                        | Description                                              |
| -------------------------- | -------------- | ---------------------------------------------- | -------------------------------------------------------- |
| `GroupLevel`               | `string`       | `'Site'`                                       | Group level label — drives table heading and row labels  |
| `groupLabelKey`            | `string\|null` | `null`                                         | Field in `groupMetadata` used as the group display label |
| `groupParticipantCountKey` | `string`       | `'ParticipantCount'`                           | Field holding participant count                          |
| `groupTooltipKeys`         | `Array\|null`  | `null`                                         | Extra fields shown in the group tooltip                  |
| `resultTooltipKeys`        | `Array`        | `['Score','Metric','Numerator','Denominator']` | Fields shown in the metric cell tooltip                  |
| `SiteRiskScoreMetricID`    | `string`       | `'Analysis_srs0001'`                           | Metric ID used to compute the site risk score column     |
| `SiteRiskScoreURL`         | `string`       | _(Gilead docs URL)_                            | Link target for the site risk score column header        |

### Callbacks

| Key                   | Signature         | Default behaviour    |
| --------------------- | ----------------- | -------------------- |
| `groupClickCallback`  | `(datum) => void` | `console.log(datum)` |
| `metricClickCallback` | `(datum) => void` | `console.log(datum)` |

---

## Helper methods

After instantiation the table exposes `table.updateTable`:

| Method                                                        | Description                                     |
| ------------------------------------------------------------- | ----------------------------------------------- |
| `updateTable(results, config, groupMetadata, metricMetadata)` | Re-render the table with updated data or config |

---

## Usage

```html
<script src="path/to/index.js"></script>

<div id="table"></div>

<script>
    const table = gsmViz.default.groupOverview(
        document.getElementById('table'),
        results,
        {
            GroupLevel: 'Site',
            groupClickCallback: function (datum) {
                console.log('Selected site:', datum.GroupID);
            },
            metricClickCallback: function (datum) {
                console.log('Selected metric cell:', datum);
            },
        },
        groupMetadata,
        metricMetadata
    );
</script>
```

### Updating the table

```js
// Re-render with a new snapshot of results
table.updateTable(newResults, table.config, groupMetadata, metricMetadata);
```

---

## Live examples

-   [Group Overview — Site](../groupOverview/site ':ignore')
-   [Group Overview — Country](../groupOverview/country ':ignore')
