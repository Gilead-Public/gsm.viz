---
name: frontend-ui-engineering
description: Builds production-quality UIs. Use when building or modifying user-facing interfaces. Use when creating components, implementing chart layouts, managing state, or when the output needs to look and feel production-quality.
---

# Frontend UI Engineering

## Overview

Build production-quality user interfaces that are accessible, performant, and visually consistent. For gsm.viz, this means React components wrapping Chart.js and D3 visualizations for clinical trial data, with proper accessibility and responsive behavior.

## When to Use

- Building new chart components or visualization modules
- Modifying existing user-facing chart interfaces
- Implementing responsive layouts for charts
- Adding interactivity or state management to visualizations
- Fixing visual or UX issues in chart rendering

## gsm.viz Component Patterns

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

### Component Architecture

gsm.viz uses React 18 with Chart.js via react-chartjs-2:

```jsx
// Separate data processing from rendering
function processChartData(rawData, options) {
  // Pure function - easy to test
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

// React component handles rendering
function MyChart({ data, options }) {
  const chartData = processChartData(data, options);
  const chartOptions = buildChartOptions(options);

  return <Bar data={chartData} options={chartOptions} />;
}
```

### TDD for Components

Write tests before building components:

```javascript
// RED: Write failing test first
describe("ScatterPlot", () => {
  it("renders without errors when given valid data", () => {
    const data = [{ x: 1, y: 2, site: "Site A" }];
    // Test that component renders (jest-canvas-mock handles canvas)
    expect(() => render(<ScatterPlot data={data} />)).not.toThrow();
  });

  it("displays correct number of data points", () => {
    const data = [
      { x: 1, y: 2 },
      { x: 3, y: 4 },
    ];
    const config = buildScatterConfig(data);
    expect(config.data.datasets[0].data).toHaveLength(2);
  });
});
```

## State Management

For gsm.viz, prefer the simplest approach:

```
Local state (useState)           → Chart-specific UI state (tooltips, zoom)
Props                            → Data passed from parent/host application
D3 selections                    → Direct DOM manipulation for D3 charts
```

## Accessibility

Chart accessibility requirements:

- Provide text alternatives for chart data (aria-label, data tables)
- Ensure keyboard navigation for interactive elements
- Use sufficient color contrast (4.5:1 minimum)
- Don't rely solely on color to convey information (use patterns, labels)
- Include chart titles and axis labels

```jsx
function AccessibleChart({ data, title, description }) {
  return (
    <div role="img" aria-label={description}>
      <h3>{title}</h3>
      <Bar data={data} options={options} />
      {/* Optional: hidden data table for screen readers */}
      <table className="sr-only">
        <caption>{title}</caption>
        {/* table rows with chart data */}
      </table>
    </div>
  );
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

## Loading and Error States

```jsx
function ChartContainer({ data, isLoading, error }) {
  if (isLoading) return <div aria-busy="true">Loading chart data...</div>;
  if (error)
    return <div role="alert">Failed to load chart: {error.message}</div>;
  if (!data || data.length === 0) return <div>No data available</div>;

  return <MyChart data={data} />;
}
```

## Common Rationalizations

| Rationalization                                   | Reality                                                                                      |
| ------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| "Accessibility doesn't matter for internal tools" | Clinical trial dashboards are used by diverse teams. Accessibility is a quality standard.    |
| "We'll make it responsive later"                  | Retrofitting responsive design is 3x harder than building it from the start.                 |
| "Chart.js handles accessibility"                  | Chart.js renders to canvas which is inherently inaccessible. You must add text alternatives. |

## Red Flags

- Components with more than 200 lines (split them)
- Missing error states or empty states for charts
- No keyboard navigation for interactive chart elements
- Color as the sole indicator of state (red/green without text or icons)
- Hard-coded dimensions instead of responsive sizing

## Verification

After building UI:

- [ ] Failing tests were written before implementation (TDD)
- [ ] Component renders without console errors
- [ ] Chart has accessible text alternative (aria-label or data table)
- [ ] Responsive: chart resizes appropriately
- [ ] Loading, error, and empty states all handled
- [ ] All tests pass: `npm test`
