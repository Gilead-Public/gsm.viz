# gsm.viz

**gsm.viz** is a data visualization library built with
[Chart.js](https://www.chartjs.org/) that features charts adapted for
[risk-based monitoring](https://www.fda.gov/media/121479/download) in clinical trials.

[![GitHub](https://img.shields.io/badge/GitHub-Gilead--Public%2Fgsm.viz-blue?logo=github)](https://github.com/Gilead-Public/gsm.viz)

---

## Modules

| Type    | Module                              | Description                                                      |
| ------- | ----------------------------------- | ---------------------------------------------------------------- |
| Generic | [bars](docs/bars)                   | ggplot2-inspired bar chart with flexible spec-based API          |
| Metrics | [barChart](docs/barChart)           | Bar chart of a single KRI metric across groups                   |
| Metrics | [groupOverview](docs/groupOverview) | Sortable summary table of all groups across all metrics          |
| Metrics | [scatterPlot](docs/scatterPlot)     | Scatter plot of two numeric KRI metrics, coloured by flag status |
| Metrics | [sparkline](docs/sparkline)         | Compact sparkline for embedding in tables and dashboards         |
| Metrics | [timeSeries](docs/timeSeries)       | Time-series chart of metric trends across snapshot dates         |

---

## Interactive Examples

-   Generics
    -   [Bar Chart](bars/ ':ignore')
    -   [Bar Chart Builder](bars/builder.html ':ignore')
-   Metrics
    -   [Bar Chart](barChart/ ':ignore')
    -   [Group Overview — Country](groupOverview/country ':ignore')
    -   [Group Overview — Site](groupOverview/site ':ignore')
    -   [Scatter Plot](scatterPlot/ ':ignore')
    -   [Sparkline](sparkline/ ':ignore')
    -   [Time Series](timeSeriesContinuous/ ':ignore')
    -   [Time Series (with CI)](timeSeriesWithCI/ ':ignore')

---

## Installation

`gsm.viz` is hosted on GitHub and accessible with `npm`:

```bash
npm install git+https://github.com/Gilead-Public/gsm.viz.git
```

---

## Quick Start

Include the bundled library and D3 in your HTML, then call any module:

```html
<script src="https://d3js.org/d3.v7.min.js"></script>
<script src="node_modules/gsm.viz/index.js"></script>

<div id="chart"></div>

<script>
    d3.csv('results.csv').then(function (results) {
        gsmViz.default.scatterPlot(document.getElementById('chart'), results, {
            displayTitle: true,
        });
    });
</script>
```

Each module follows the same call signature:

```
gsmViz.default.<module>(element, data, config, ...optional)
```

Returns a Chart.js chart instance (or an HTML table for `groupOverview`) with
`chart.helpers` methods for programmatic updates. See the **API Reference** in
the sidebar for full parameter and config documentation.

---

## Contributing

See the [repository README](https://github.com/Gilead-Public/gsm.viz#readme)
for contributor guidelines, development setup, and version-control conventions.
