# NEWS

## gsm.viz 2.5.0 (Development)

### New: `points` Module

- Add the generic `points(element, data, spec)` entry point with strict numeric x/y mappings, optional stable row keys, responsive Chart.js scatter rendering, linear axis labels, chart title/caption labels, and an accessible canvas text alternative (#559, #567, #568, #569).
- Add ordered categorical color mappings, named and fallback palettes, legend titles, stable empty ordered groups, and a neutral missing-value level to `points` (#570).
- Add linear/logarithmic point axes with fixed ranges, automatic begin-at-zero behavior, explicit breaks and labels, and strict positive log-domain validation (#571).
- Add row-aware tooltip templates and formatters, Chart.js tooltip callback precedence, and point-only click/hover callbacks with source-row payloads (#572).
- Add continuous point size and opacity mappings with area-correct radius scaling, clamped alpha ranges, equal-domain handling, and deterministic hover radii (#573).
- Add discrete point shapes, named and ordered shape scales, actual color/shape combination legends, neutral missing markers, and encoded-value accessibility text (#574).
- Add x/y reference lines and strict external auxiliary line layers with grouped styling, automatic-domain participation, and interaction-safe legend controls (#575).
- Add selective point labels with source-field text, static/field/predicate filtering, formatter payloads, and configurable positioning and typography (#576).
- Add keyed point and color-group selection with click/multiple modes, programmatic helpers, persistent tooltip identity, undimmed legends, and keyboard/live-status accessibility (#577).
- Add in-place `updateData` and deep partial `updateSpec` helpers with full-pipeline rebuilds, typed hidden-group restoration, dynamic plugin/keyboard lifecycle handling, and deliberate stale-selection cleanup (#578).
- Add optional x/y zoom and pan controls plus an opaque PNG export helper with deterministic title- or axis-derived filenames to `points` (#579).

## gsm.viz 2.4.0 (Release Candidate)

### New: `bars` Module

A brand-new ggplot2-aligned declarative bar chart module (`bars`) that reproduces disparate bar chart implementations across the `gsm` ecosystem, including most functionality in the existing, KRI-specific `barChart` module (#502, #482). Highlights include:

- **Spec-driven API** — define charts with a declarative `spec` object (fill, position, scales, labels, theme, tooltip, etc.)
- **Position modes** — `stack` (default), `fill` (within-category percentage normalization), `dodge` (side-by-side), and layered positioning
- **Stat modes** — `count` (default) and `percent`
- **Dynamic category axis** — legend-driven axis subsetting that hides categories with no visible data (#503)
- **Dynamic sizing** — automatically adjusts chart height based on category count
- **Dense legend** — compact legend with tooltip on hover (#494)
- **Zoom support** — optional `chartjs-plugin-zoom` integration (#524)
- **Tick truncation & rotation** — automatic categorical tick label truncation and rotation for long labels (#531)
- **Selection & highlight API** — programmatic selection/highlight with `selectCategories()`, `highlightCategories()`, and `clearSelection()` methods
- **Click & hover callbacks** — `onClick` and `onHover` hooks for interactive workflows (#488)
- **Reference lines** — generic annotation-based reference lines with customizable styles (#498)
- **Label annotations** — in-bar segment labels, total labels, and dynamic contrast coloring (#487)
- **Top-N limiting** — `spec.nCategories` to show only the top N categories (#493)
- **Captions** — user-defined chart footnotes via `labels.captions` and `labels.captionsOptions`
- **Export to PNG** — `exportImage()` helper for one-click PNG download (#499)
- **Tooltip formatting** — `tooltip.format` and `tooltip.formatter` convenience API with template string support (#489, #515)
- **Custom fill colors** — `scales.fill.colors` named color map (#496)
- **`updateData` / `updateSpec`** — update chart data or spec without full re-render

### New: `facetBars` Module

A new faceting layer for `bars` that renders multiple linked sub-charts (#492):

- **Faceted layout** — split data by a facet variable into separate sub-charts
- **Linked interactions** — hover highlight syncs across all facets
- **Configurable scales** — `facet.scales.x.free` toggles between constant and free category domains
- **Per-facet ordering** — function-based x-axis order per facet panel
- **Chart height control** — `facet.chartHeight` option for sub-chart sizing
- **Selection sync** — selection state synchronized across faceted charts
- **Global category computation** — consistent category ordering across facets

### New: Bar Chart Builder

An interactive UI for constructing `bars` specifications:

- Visual controls for position, fill, sort, scales, tooltip, and export
- Live spec preview with JSON export
- Zoom control integration

### New: Documentation Site

- Docsify-based documentation deployed to gh-pages
- Collapsible navigation sidebar across all example pages
- Module documentation differentiating between metric and generic chart modules

### Enhancements

- **scatterPlot**: Generate scatter bounds on demand with backwards compatibility (#473)
- **examples**: KRI Facet, Retention, and Prevalence chart demonstrations
- **examples**: Side-by-side hover table and click-to-scatter workflows

### Bug Fixes

- **bars**: Preserve legend colors during selection
- **bars**: Harden `truncateLabel` against negative/NaN `maxLength`
- **bars**: Filter unknown fill values when `fill.order` is provided
- **bars**: Coerce labels to string in `reorderDatasets` for type-safe fill ordering
- **bars**: Disable dynamic contrast color for `segment.placement='end'`
- **bars**: Empty dataset data on hide to prevent CategoryScale re-adding labels
- **bars**: Reset container dimensions on every render for `dynamicSizing`
- **facetBars**: Guard `setActiveElements` against undefined chart elements
- **facetBars**: Re-apply `chartHeight` after `bars()` clears container height
- **facetBars**: Restore key variable in `computeGlobalCategories` function-order loop
- **facetBars**: Pin category axis min/max for constant x domain
- **facetBars**: Resolve function `scales.x.order` in `computeGlobalScales`
- **facetBars**: Skip global category injection when `dynamicCategoryAxis` is true
- **scatterPlot**: Generate scatter bounds on demand with backwards compatibility (#473)
- Remove stray `console.log` calls

### Infrastructure & Chores

- Add Husky pre-commit hook to rebundle on every commit
- OS/platform-agnostic npm scripts in `package.json`
- AI agent framework with TDD-first skills (`.agent/`)
- Issue templates for GitHub
- Remove unused React dependencies
- Dependency updates: lodash 4.18.1, esbuild 0.28.1, form-data 4.0.6, picomatch 2.3.2, minimatch 3.1.5, js-yaml 3.14.2, csvtojson 2.0.13, @babel/plugin-transform-modules-systemjs 7.29.4
