# metricDistribution

Displays one metric's categorical breakdowns (`Reporting_Distributions`) as
horizontal bars, one section per `Source` × `Variable`, under the
[metricOverview](docs/metricOverview) header: the metric's name, value, and
numerator / denominator.

The widget only displays. It doesn't sum, filter, or recalculate rows: the
rows must already be one metric at one group (the study, or one site) in one
study snapshot. Summing
site rows to study level is a separate, tested step before the widget.

---

## Signature

```js
gsmViz.default.metricDistribution(element, data, spec);
```

| Parameter | Type             | Default  | Description                                               |
| --------- | ---------------- | -------- | --------------------------------------------------------- |
| `element` | `Node \| string` | `'body'` | DOM element or CSS selector in which to render the widget |
| `data`    | `Object`         | required | `{ distributions, metric, result }`; see [Data](#data)    |
| `spec`    | `Object`         | `{}`     | Widget specification; see [Spec](#spec)                   |

Returns the widget's root element (`div.metric-distribution`). Its
`data-state` attribute is `ok`, `empty`, or `missing`. Rendering again into
the same element replaces the previous widget.

---

## Basic example

```js
gsmViz.default.metricDistribution(
    '#distribution',
    { distributions, metric, result },
    {
        sections: [
            {
                source: 'Numerator',
                variable: 'compreas',
                title: 'Reasons for study discontinuation',
                labels: { count: 'Participants' },
            },
            {
                source: 'Denominator',
                variable: 'disposition',
                title: 'Study disposition',
                status: true,
                labels: { percent: '% Enrolled' },
            },
        ],
        colors: { Ongoing: '#59a14f', 'Study Completion': '#76b7b2' },
    }
);
```

---

## Data

| Property        | Type     | Required | Description                                                                                                     |
| --------------- | -------- | -------- | --------------------------------------------------------------------------------------------------------------- |
| `distributions` | `Array`  | no       | `Reporting_Distributions` rows for one metric at one group. Absent (`undefined` or `null`) is the missing state |
| `metric`        | `Object` | yes      | The metric's `Reporting_Metrics` row. `Metric` names the metric; `Numerator` and `Denominator` are its labels   |
| `result`        | `Object` | no       | The metric's `Reporting_Results` row for the same group. Supplies the header values and `percentOfDenominator`  |

### `distributions` rows

| Column                              | Type             | Use                                                     |
| ----------------------------------- | ---------------- | ------------------------------------------------------- |
| `Source`                            | `string`         | Section: `'Numerator'` or `'Denominator'`               |
| `Variable`                          | `string`         | Section: the breakdown variable                         |
| `Category`                          | `string \| null` | Bar label. `null` or absent is a blank: "Not recorded"  |
| `Count`                             | `number`         | Bar length and count value                              |
| `Total`                             | `number`         | The section's population; the same on every section row |
| `Percent`                           | `number \| null` | `Count / Total` as a proportion (0–1), displayed as is  |
| `MetricID`, `GroupLevel`, `GroupID` | `string`         | Checked: one metric and one group                       |
| `StudyID`, `SnapshotDate`           | any              | Checked, compared as text: one study and one snapshot   |
| `Participants`                      | any              | Not used                                                |

### `result`

`Numerator`, `Denominator`, and `Metric` are each a finite number, a numeric
string (as in `Reporting_Results` exports, e.g. `"412"`), or unavailable:
`null`, absent, `''`, or `'NA'`. An unavailable value is displayed as "—", never
as 0. `Metric` is displayed as the header percent; it isn't recalculated.

When the row carries `MetricID`, `GroupLevel` and `GroupID`, `StudyID`, or
`SnapshotDate`, each must match the `distributions` rows.

---

## Spec

| Option               | Type       | Default                   | Description                                                         |
| -------------------- | ---------- | ------------------------- | ------------------------------------------------------------------- |
| `sections`           | `Array`    | every section in the rows | Sections to show, in order. See [Sections](#sections)               |
| `values`             | `string[]` | by section source         | Values per bar: `'count'`, `'percent'`, `'percentOfDenominator'`    |
| `labels`             | `Object`   | from `metric`             | Column labels keyed by value                                        |
| `topN`               | `number`   | all categories            | Recorded categories to show before collapsing into "+ k more"       |
| `colors`             | `Object`   | `{}`                      | Status category → colour                                            |
| `header`             | `Object`   | `{}`                      | Header `labels`, `format`, and `unavailable`. See [Header](#header) |
| `theme.barColor`     | `string`   | `'#4e79a7'`               | Colour of reason (non-status) bars                                  |
| `theme.neutralColor` | `string`   | `'#bab0ac'`               | Fallback status colour; "+ k more" and "Not recorded" bars          |

Unknown options throw, so a misspelt option isn't silently ignored.

### Sections

Each entry is `{ source, variable }` plus optional overrides:

| Option   | Type       | Description                                              |
| -------- | ---------- | -------------------------------------------------------- |
| `title`  | `string`   | Section title. Defaults to the variable name             |
| `status` | `boolean`  | Colour the categories from `colors`. Defaults to `false` |
| `topN`   | `number`   | Overrides `spec.topN`                                    |
| `values` | `string[]` | Overrides `spec.values`                                  |
| `labels` | `Object`   | Overrides `spec.labels`                                  |

Without `sections`, every `Source` × `Variable` in the rows is shown: numerator
sections first, then denominator sections, otherwise in order of first
appearance. A requested section without rows shows "There are no records in
this breakdown."

### Values and labels

| Value                  | Displays                                       | Default label                                                                   |
| ---------------------- | ---------------------------------------------- | ------------------------------------------------------------------------------- |
| `count`                | `Count`                                        | `n`                                                                             |
| `percent`              | `Percent` (Count ÷ Total, the section's share) | `% of <metric.Numerator>` or `% of <metric.Denominator>`, by the section source |
| `percentOfDenominator` | Count ÷ `result.Denominator`                   | `% of <metric.Denominator>`                                                     |

By default each bar shows one value. Denominator sections are status
breakdowns and show `percent`, labelled with the population it is a share of
(e.g. "% of Enrolled Subjects"). Every other section is a reason breakdown and
shows `count`. Hovering a bar gives its count out of the section's total.

Setting `values` overrides the default. A bar's visible values shouldn't mix a
count with a percentage; choose one or the other per section.
`percentOfDenominator` is shown as "—" without a `result` or when its
denominator is 0 or unavailable. Only use it when the metric's denominator is
a population of participants.

Labels are business terms (e.g. "Participants", "% Enrolled"). The widget
never shows the words "Numerator" or "Denominator"; set labels in the spec if
the metric's own labels are absent (the default label is then "%").

---

## Bars

-   Recorded categories are sorted by descending `Count`; equal counts keep
    their input order.
-   With `topN`, the categories after the first N collapse into one
    "+ k more" bar, whose count is the sum of theirs, and whose `percent` is
    the sum of their `Percent` values. Its tooltip lists the collapsed
    categories.
-   "Not recorded" (a blank `Category`) is always last, never collapsed, and
    is left out when its count is 0. Categories with a count of 0 are shown.
-   Bar length is the count relative to the section's longest bar.
-   Hovering a bar shows its count out of the section's total ("n of N").
-   There is no total row; the header carries the metric's value.

## Colours

Status sections (`status: true`) colour each category from `colors`, falling
back to `theme.neutralColor`. Reason sections aren't coloured: every category
uses `theme.barColor`. "+ k more" and "Not recorded" always use
`theme.neutralColor`.

## Footnotes

Shown automatically below a section:

-   when the section's counts add up to more than its `Total` (a multi-value
    variable, where a record can fall in more than one category);
-   when "Not recorded" is shown.

## States

| State     | When                                          | Shows                                                      |
| --------- | --------------------------------------------- | ---------------------------------------------------------- |
| `missing` | `data.distributions` is `undefined` or `null` | Header and "Breakdowns are not available for this metric." |
| `empty`   | No section to show has rows                   | Header and "There are no records to break down."           |
| `ok`      | Otherwise                                     | Header and sections                                        |

## Header

The header is the [metricOverview](docs/metricOverview) widget in its `header`
layout, given `data.metric` and `data.result`. It shows `metric.Metric`,
`result.Metric` (as a percent by default), and
`result.Numerator / result.Denominator`; hovering a count names it with the
metric's label. Values are displayed as given, never recalculated. Without a
`result`, it shows the name and "No data".

`spec.header` passes these metricOverview options through:

| Option        | Type     | Description                                                                              |
| ------------- | -------- | ---------------------------------------------------------------------------------------- |
| `labels`      | `Object` | Label per `Reporting_Results` column, e.g. `{ Numerator: 'Discontinued' }`               |
| `format`      | `Object` | d3-format specifier per column. Set `format.Metric` for a metric that isn't a percentage |
| `unavailable` | `Object` | `value`: text for an unavailable value; `empty`: text shown without a `result`           |

```js
gsmViz.default.metricDistribution(
    el,
    { distributions, metric, result },
    {
        header: { format: { Metric: ',.2f' } },
    }
);
```

When the metric row has no `Numerator` or `Denominator` label, the header
names the counts "n" and "N" rather than showing the column names.

The header ships no styles of its own. It uses metricOverview's
`gsm-metric-overview` and `gsm-metric-header__*` classes; see the suggested
styles in [metricOverview](docs/metricOverview), which the
[example page](metricDistribution/ ':ignore') includes.

## Data rules

Invalid inputs throw a descriptive error before anything is rendered:

-   more than one row for the same `Source` × `Variable` × `Category` (rows
    must be summed to one group before display);
-   rows for more than one group, metric, study, or snapshot, or for a
    different metric than `data.metric`;
-   a `result` for a different metric (than `data.metric` or the rows), group,
    study, or snapshot;
-   different `Total` values within one section;
-   an invalid `spec.header` option;
-   `Count` or `Total` that isn't a non-negative number, a `Percent` outside
    0–1, or a `result` value that is neither numeric nor unavailable. `Count`,
    `Total`, and `Percent` are not coerced from strings.

## Accessibility

The widget root is a named group. Each section is a table named by its title,
with the category as row header and the values under their labelled column
headers, so screen readers read each value with its label. Bars are hidden from
assistive technology; the table carries the same values. Labels and values are
text, never colour alone.

## Qualification

`tests/metricDistribution/displayQualification.test.js` renders the simulated
inputs in `tests/metricDistribution/fixtures/simulatedDistributions.js` and
compares the displayed header, bars, values, colours, and footnotes with values
computed independently from the rows by the rules on this page.
