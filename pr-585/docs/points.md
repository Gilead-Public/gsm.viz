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
    { exposure: 5, events: 1, site: 'Site 01' },
    { exposure: 12, events: 3, site: 'Site 02' },
    { exposure: 25, events: 6, site: 'Site 03' },
];

const chart = gsmViz.default.points(element, data, {
    mapping: {
        x: 'exposure',
        y: 'events',
        key: 'site',
    },
    scales: {
        x: { label: 'Participant exposure' },
        y: { label: 'Reported events' },
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

The initial renderer intentionally supports only ungrouped points on linear x/y
axes. Additional aesthetics, scales, annotations, and interactions are added as
separate reviewable features.

## Data rules

-   Values mapped to x and y must already be finite JavaScript numbers.
-   Numeric strings are not coerced.
-   Invalid rows throw a descriptive error; rows are never silently dropped.
-   Duplicate coordinates remain independent points.
-   `mapping.key`, when supplied, must resolve to a unique string or finite number
    for every row. Without it, the original row index is the local point key.
-   Each rendered point retains its original source row as `_datum`.
-   An empty data array renders a valid empty chart.

## Accessibility and responsive behavior

The canvas receives an image role and text alternative derived from the title,
description, axis mappings, and point count. `theme.maintainAspectRatio` controls
whether Chart.js preserves its aspect ratio as the container resizes.
