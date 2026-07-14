---
name: frontend-ui-engineering
description: Builds production-quality chart UIs. Use when building or modifying user-facing visualizations. Use when creating chart modules, implementing layouts, or when the output needs to look and feel production-quality.
---

# Frontend UI Engineering

## Overview

Build production-quality user interfaces that are accessible, performant, and visually consistent. For gsm.viz, this means Chart.js and D3 visualizations for clinical trial data rendered to canvas and SVG, with proper accessibility and responsive behavior.

## When to Use

- Building new chart modules or visualization types
- Modifying existing user-facing chart interfaces
- Implementing responsive layouts for charts
- Adding interactivity (tooltips, zoom, click handlers)
- Fixing visual or UX issues in chart rendering

## gsm.viz Module Patterns

### Module Structure

Follow existing conventions in `src/`:

```
src/
  barChart/          → Bar chart module
  scatterPlot/       → Scatter plot module
  timeSeries/        → Time series module
  sparkline/         → Sparkline module
  groupOverview/     → Group overview module
  data/              → Data handling utilities
  util/              → Shared utilities
```

### Architecture

Separate data processing from chart rendering:

```javascript
// Pure function — easy to test
function processChartData(rawData, options) {
  return {
    labels: rawData.map((d) => d.label),
    datasets: [
      {
        data: rawData.map((d) => d.value),
        backgroundColor: options.colors || defaultColors,
      },
    ],
  };
}

// Chart configuration builder — easy to test
function buildChartOptions(options) {
  return {
    responsive: true,
    scales: {
      x: { title: { display: true, text: options.xLabel } },
      y: { title: { display: true, text: options.yLabel } },
    },
  };
}

// Renderer — creates the Chart.js instance on a canvas element
function renderChart(container, data, options) {
  const canvas = document.createElement("canvas");
  container.appendChild(canvas);

  const chartData = processChartData(data, options);
  const chartOptions = buildChartOptions(options);

  return new Chart(canvas, {
    type: "bar",
    data: chartData,
    options: chartOptions,
  });
}
```

### TDD for Chart Modules

Write tests before building chart logic:

```javascript
// RED: Write failing test first
describe("buildScatterConfig", () => {
  it("maps data points to Chart.js scatter format", () => {
    const data = [
      { site: "Site A", metric: 1.5, baseline: 1.0 },
      { site: "Site B", metric: 2.0, baseline: 1.5 },
    ];
    const config = buildScatterConfig(data);
    expect(config.data.datasets[0].data).toHaveLength(2);
  });

  it("adds annotation line at threshold value", () => {
    const data = [{ site: "Site A", metric: 1.5, baseline: 1.0 }];
    const config = buildScatterConfig(data, { threshold: 2.0 });
    expect(config.options.plugins.annotation.annotations).toBeDefined();
  });
});
```

## Accessibility

Chart accessibility requirements — canvas and SVG are inherently inaccessible, so you must provide alternatives:

- Provide text alternatives for chart data (`aria-label`, data tables)
- Ensure keyboard navigation for interactive elements
- Use sufficient color contrast (4.5:1 minimum)
- Don't rely solely on color to convey information (use patterns, labels, shapes)
- Include chart titles and axis labels

```javascript
// Wrap charts in accessible containers
function renderAccessibleChart(container, data, options) {
  const wrapper = document.createElement("div");
  wrapper.setAttribute("role", "img");
  wrapper.setAttribute("aria-label", options.description);

  const title = document.createElement("h3");
  title.textContent = options.title;
  wrapper.appendChild(title);

  // Render the chart
  renderChart(wrapper, data, options);

  // Add a hidden data table for screen readers
  const table = buildDataTable(data, options);
  table.classList.add("sr-only");
  wrapper.appendChild(table);

  container.appendChild(wrapper);
}
```

## Responsive Design

Charts should resize appropriately:

```javascript
const chartOptions = {
  responsive: true,
  maintainAspectRatio: false, // Allow container to control size
  plugins: {
    legend: {
      display: true,
      position: "bottom", // Better for narrow containers
    },
  },
};
```

## Error and Empty States

Handle missing or invalid data gracefully:

```javascript
function renderChart(container, data, options) {
  if (!data || data.length === 0) {
    container.textContent = "No data available";
    return null;
  }

  try {
    return createChartInstance(container, data, options);
  } catch (error) {
    console.error("Chart render failed:", error);
    container.textContent = "Unable to display chart";
    return null;
  }
}
```

## D3 Visualizations

For D3-based charts (sparklines, etc.):

```javascript
function renderSparkline(container, data, options) {
  const { width = 200, height = 50 } = options;

  const svg = d3
    .select(container)
    .append("svg")
    .attr("width", width)
    .attr("height", height)
    .attr("role", "img")
    .attr("aria-label", options.description || "Sparkline chart");

  // ... bindings and drawing
}
```

## Common Rationalizations

| Rationalization                                   | Reality                                                                                      |
| ------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| "Accessibility doesn't matter for internal tools" | Clinical trial dashboards are used by diverse teams. Accessibility is a quality standard.    |
| "We'll make it responsive later"                  | Retrofitting responsive design is 3x harder than building it from the start.                 |
| "Chart.js handles accessibility"                  | Chart.js renders to canvas which is inherently inaccessible. You must add text alternatives. |

## Red Flags

- Modules with more than 200 lines in a single file (split them)
- Missing error states or empty states for charts
- No keyboard navigation for interactive chart elements
- Color as the sole indicator of state (red/green without text or icons)
- Hard-coded dimensions instead of responsive sizing
- Data processing mixed into rendering functions

## Verification

After building UI:

- [ ] Failing tests were written before implementation (TDD)
- [ ] Chart renders without console errors
- [ ] Chart has accessible text alternative (aria-label or data table)
- [ ] Responsive: chart resizes appropriately
- [ ] Error and empty states handled
- [ ] All tests pass: `npm test`
