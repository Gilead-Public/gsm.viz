# points

Renders a two-dimensional point chart using a **ggplot2-inspired spec** object.
`points` is the generic, data-agnostic counterpart to the KRI-specific
`scatterPlot` module.

---

## Signature

```js
gsmViz.default.points(element, data, spec);
```

| Parameter | Type             | Default  | Description                                              |
| --------- | ---------------- | -------- | -------------------------------------------------------- |
| `element` | `Node \| string` | `'body'` | DOM element or CSS selector in which to render the chart |
| `data`    | `Array`          | `[]`     | Array of source rows                                     |
| `spec`    | `Object`         | required | Point chart specification                                |

Returns a Chart.js chart instance.

---

## Basic example

```js
const data = [
    { exposure: 5, events: 1, site: 'Site 01', arm: 'Control' },
    { exposure: 12, events: 3, site: 'Site 02', arm: 'Treatment' },
    { exposure: 25, events: 6, site: 'Site 03', arm: null },
];

const chart = gsmViz.default.points(element, data, {
    mapping: {
        x: 'exposure',
        y: 'events',
        key: 'site',
        color: 'arm',
    },
    scales: {
        x: { label: 'Participant exposure' },
        y: { label: 'Reported events' },
        color: {
            colors: {
                Control: '#4e79a7',
                Treatment: '#f28e2b',
            },
            order: ['Control', 'Treatment', '(Missing)'],
            label: 'Treatment arm',
        },
    },
    labels: {
        title: 'Events by exposure',
        caption: 'Simulated data',
        description:
            'Each point represents one site and compares exposure with reported events.',
    },
});
```

## Initial spec

```js
{
    mapping: {
        x: 'xField',       // required
        y: 'yField',       // required
        key: 'idField',    // optional stable point identity
        color: 'groupField', // optional categorical grouping
    },
    scales: {
        x: {
            type: 'linear',
            label: undefined, // defaults to mapping.x; '' hides the title
        },
        y: {
            type: 'linear',
            label: undefined, // defaults to mapping.y; '' hides the title
        },
        color: {
            colors: {},       // level-to-CSS-color map
            palette: [/* default categorical colors */],
            order: [],        // explicit legend/domain order
            label: undefined, // defaults to mapping.color
        },
    },
    labels: {
        title: undefined,
        caption: undefined,
        description: undefined,
    },
    theme: {
        maintainAspectRatio: false,
        animation: false,
    },
}
```

The renderer supports ungrouped points or a categorical color mapping on linear
x/y axes. Additional aesthetics, scales, annotations, and interactions are added
as separate reviewable features.

## Categorical color

Set `mapping.color` to create one dataset and legend entry per categorical level.
Levels use first-seen order unless `scales.color.order` is provided. Ordered
levels with no matching rows remain as empty datasets so legend identity and
palette positions stay stable as data changes; new observed levels are appended.

`scales.color.colors` maps level names to CSS colors. Levels without a named
color use the default palette, or the non-empty `scales.color.palette` supplied by
the caller. Set `scales.color.label` to customize the legend title; `null` or `''`
hides the title. Null, undefined, blank, and `NaN` color values share a neutral
gray `"(Missing)"` level rather than dropping rows.

## Data rules

-   Values mapped to x and y must already be finite JavaScript numbers.
-   Numeric strings are not coerced.
-   Invalid rows throw a descriptive error; rows are never silently dropped.
-   Duplicate coordinates remain independent points.
-   `mapping.key`, when supplied, must resolve to a unique string or finite number
    for every row. Without it, the original row index is the local point key.
-   Each rendered point retains its original source row as `_datum`.
-   Color-mapped points retain their resolved categorical value as `_color`.
-   An empty data array renders a valid empty chart.

## Accessibility and responsive behavior

The canvas receives an image role and text alternative derived from the title,
description, axis mappings, and point count. `theme.maintainAspectRatio` controls
whether Chart.js preserves its aspect ratio as the container resizes.
