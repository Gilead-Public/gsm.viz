# metricOverview

Renders one metric's overview for one group: its value, numerator and
denominator, labelled from the metric's `Reporting_Metrics` row. Values come
from the `Reporting_Results` row as given; nothing is recalculated. Study-level
site-flag counts are not shown.

---

## Signature

```js
gsmViz.default.metricOverview(element, data, spec);
```

| Parameter | Type             | Default  | Description                                                 |
| --------- | ---------------- | -------- | ----------------------------------------------------------- |
| `element` | `Node \| string` | `'body'` | DOM element or CSS selector in which to render the overview |
| `data`    | `Object`         | required | `{ results, metric }`, described below                      |
| `spec`    | `Object`         | `{}`     | Overview specification                                      |

Returns the overview's root element. Rendering again into the same element
replaces the previous overview and leaves other content alone.

### `data`

| Key       | Type     | Description                                                  |
| --------- | -------- | ------------------------------------------------------------ |
| `results` | `Array`  | One metric's `Reporting_Results` rows                        |
| `metric`  | `Object` | The metric's `Reporting_Metrics` row (names and unit labels) |

Every row must belong to one metric: a second `MetricID` among the rows and the
metric row throws. Numbers may be numbers or numeric strings.

---

## Basic example

```js
const metric = {
    MetricID: 'qtl0006',
    Metric: 'Study Discontinuation Rate',
    Numerator: 'Subjects Discontinued - Study',
    Denominator: 'Total Subjects',
};
const results = [
    {
        GroupLevel: 'Study',
        GroupID: 'AA-AA-000-0000',
        MetricID: 'qtl0006',
        Numerator: 1,
        Denominator: 40,
        Metric: 0.025,
        SnapshotDate: '2004-06-01',
    },
];

gsmViz.default.metricOverview(element, { results, metric });
```

| Shows                         |      |
| ----------------------------- | ---: |
| Study Discontinuation Rate    | 2.5% |
| Subjects Discontinued - Study |    1 |
| Total Subjects                |   40 |

---

## Spec

| Key            | Default                                  | Description                                                      |
| -------------- | ---------------------------------------- | ---------------------------------------------------------------- |
| `studyId`      | `undefined`                              | `StudyID` of the row to show                                     |
| `groupLevel`   | `undefined`                              | `GroupLevel` of the row to show                                  |
| `groupId`      | `undefined`                              | `GroupID` of the row to show                                     |
| `snapshotDate` | `undefined`                              | `SnapshotDate` of the row to show                                |
| `layout`       | `'list'`                                 | `'list'` or `'header'`                                           |
| `fields`       | `['Metric', 'Numerator', 'Denominator']` | `Reporting_Results` columns to list, in order (list layout only) |
| `labels`       | `{}`                                     | Label per column, overriding the metric row                      |
| `format`       | see below                                | [d3-format](https://d3js.org/d3-format) specifier per column     |
| `unavailable`  | `{ value: '—', empty: 'No data' }`       | Text for an unavailable value, and for the empty state           |

Unknown keys, unknown columns and invalid specifiers throw a descriptive error
before anything is rendered.

### Choosing the row

The overview shows exactly one row. `studyId`, `groupLevel`, `groupId` and
`snapshotDate` keep the rows whose `StudyID`, `GroupLevel`, `GroupID` and
`SnapshotDate` match (compared as text, so `101` matches `'101'`). A `GroupID`
can repeat across group levels or studies, so set `studyId` and `groupLevel`
whenever the rows could span more than one. If more than one row is left, the
overview throws rather than choose one; if none is left, it shows the empty
state.

```js
gsmViz.default.metricOverview(
    element,
    { results: siteRows, metric },
    {
        studyId: 'AA-AA-000-0000',
        groupLevel: 'Site',
        groupId: '61',
        snapshotDate: '2019-12-01',
    }
);
```

### Labels

| Column                                        | Label, in order of precedence                            |
| --------------------------------------------- | -------------------------------------------------------- |
| `Metric`, `Numerator`, `Denominator`, `Score` | `spec.labels`, the metric row's same-named column, title |
| Any other column                              | `spec.labels`, title                                     |

The title is the column's title in the `Reporting_Results` data dictionary
(`Group ID`, `Snapshot Date`, `Flag Status`, `Metric Value`, …). A metric-row
label that is missing, blank or `'NA'` falls back to the title.

### Number format

Columns with a format are read as numbers; the others are shown as text.

| Column        | Default  | Example output |
| ------------- | -------- | -------------- |
| `Metric`      | `',.1%'` | `2.5%`         |
| `Numerator`   | `','`    | `1,860`        |
| `Denominator` | `','`    | `32,947`       |
| `Score`       | `',.2f'` | `−0.81`        |
| `Flag`        | `','`    | `−2`           |

The metric reads as a percent by default. For a rate that is not a proportion,
such as events per day of exposure, set a format, for example
`format: { Metric: ',.4f' }`. Negative numbers use the minus sign (`−`), and a
value that rounds to zero has no sign.

### Unavailable values and the empty state

| State       | When                                                                           | Shows               |
| ----------- | ------------------------------------------------------------------------------ | ------------------- |
| Unavailable | A formatted column is absent, `null`, blank, `'NA'` or not a finite number     | `unavailable.value` |
| Unavailable | A text column is absent, `null` or blank (`'NA'` is kept: it can be a real ID) | `unavailable.value` |
| Empty       | `results` is empty, or no row matches the row selectors                        | `unavailable.empty` |

Zero is a value, not an unavailable one.

---

## Layouts

### `list` (default)

A description list of `fields`: one label (`dt`) and value (`dd`) per column.

### `header`

The bar-chart header from the design review: metric name, percent, and
numerator / denominator, on one line. `fields` does not apply. The numerator
and denominator labels are in the accessible label, in tooltips, and in a
`__labels` element that is visually hidden until the header has keyboard or
touch focus.

```js
gsmViz.default.metricOverview(
    element,
    { results, metric },
    {
        layout: 'header',
    }
);
// Study Discontinuation Rate 2.5% 1 / 40
// With focus: … 1 / 40 Subjects Discontinued - Study / Total Subjects
```

Other gsm.viz widgets can build the same header directly from
`src/metricOverview/header.js`:

```js
import mergeSpec from './metricOverview/mergeSpec.js';
import { renderHeader, structureHeader } from './metricOverview/header.js';

const header = structureHeader(row, metric, mergeSpec(spec)); // row may be null
element.append(renderHeader(header));
```

`structureHeader` returns a plain model (`state`, `name`, `value`, `numerator`,
`denominator`, `label`); `renderHeader` turns it into an element.

---

## Markup and styling

The module adds no styles, apart from the inline ones that hide the header's
`__labels` element until the header has focus. Text is set as text, never as
markup. Suggested
styles are in [`examples/metricOverview/style.css`](https://github.com/Gilead-Public/gsm.viz/blob/dev/examples/metricOverview/style.css).

| Element                                                          | Notes                                                         |
| ---------------------------------------------------------------- | ------------------------------------------------------------- |
| `div.gsm-metric-overview`                                        | Root. `data-layout` and `data-state` (`ok` or `empty`)        |
| `dl.gsm-metric-overview__fields`                                 | List layout                                                   |
| `div.gsm-metric-overview__field`                                 | One per field. `data-field`; `data-state="unavailable"` if so |
| `dt.gsm-metric-overview__label`, `dd.gsm-metric-overview__value` | Label and value                                               |
| `p.gsm-metric-overview__empty`                                   | Empty state in the list layout                                |
| `div.gsm-metric-header`                                          | Header layout. `data-state`                                   |
| `span.gsm-metric-header__name`, `__value`, `__fraction`          | Name, value, and numerator / denominator                      |
| `span.gsm-metric-header__numerator`, `__denominator`             | Inside the fraction. `data-state="unavailable"` if so         |
| `span.gsm-metric-header__labels`                                 | Numerator / denominator labels, shown while focused           |
| `span.gsm-metric-header__empty`                                  | Empty state in the header layout                              |

### Accessibility

The list layout is a `role="group"` named after the metric, with a native
description list inside. The header is a `role="img"` whose accessible label
reads, for example, "Study Discontinuation Rate: 2.5%; Subjects Discontinued -
Study: 1; Total Subjects: 40". A header with a value takes keyboard focus
(`tabindex="0"`) and shows the numerator and denominator labels while focused,
so they do not depend on a mouse tooltip. Unavailable values use the `unavailable.value`
text; set it to words, such as `'Not available'`, if the dash should be read
aloud.

---

## Qualification

`tests/metricOverview/displayQualification.test.js` double-programs the
display: it computes the expected labels and text for every study-level and
country-level row and every site-level row of the latest snapshot in
`examples/data/results.json`, plus simulated rows for unavailable values and a
metric value that differs from numerator / denominator, without using the
module's code, and compares them with what both layouts render.
