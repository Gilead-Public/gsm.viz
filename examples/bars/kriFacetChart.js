const kriFacetDataFiles = [
    '../data/results.csv',
    '../data/metricMetadata.csv',
    '../data/groupMetadata.csv',
];

const kriFacetDataPromises = kriFacetDataFiles.map((dataFile) =>
    fetch(dataFile).then((response) => response.text())
);

// Traffic-light palette — matches kriSiteChart
const KRI_FACET_FLAG_PALETTE = ['#FF5859', '#FEAA02', '#3DAF06', '#FEAA02', '#FF5859'];
const KRI_FACET_FLAG_ORDER = ['-2', '-1', '0', '1', '2'];

// Metric ID sort order
const METRIC_PREFIX_ORDER = ['kri', 'cou', 'qtl', 'srs'];

/**
 * Convert a 6-digit hex colour to an rgba() string with the given alpha.
 *
 * @param {string} hex   - '#RRGGBB'
 * @param {number} alpha - 0–1
 * @returns {string}
 */
function hexToRgba(hex, alpha) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r},${g},${b},${alpha})`;
}

/**
 * Build Chart.js annotation plugin line objects from raw threshold values.
 * Returned objects are in the format expected by chartjs-plugin-annotation v2.
 *
 * @param {number[]} rawThresholds - numeric threshold values
 * @param {string}   orientation   - 'vertical' | 'horizontal'
 * @returns {Object[]}
 */
function buildKriFacetAnnotations(rawThresholds, orientation) {
    const values = [...new Set(rawThresholds)];
    const negatives = values.filter((v) => v < 0).sort((a, b) => b - a);
    const positives = values.filter((v) => v > 0).sort((a, b) => a - b);
    const isHorizontal = orientation === 'horizontal';
    const lines = [];

    negatives.forEach((val, i) => {
        const flag = -(i + 1);
        const color = flag === -1 ? '#FEAA02' : '#FF5859';
        const annotation = {
            type: 'line',
            adjustScaleRange: false,
            borderColor: color,
            borderWidth: 1,
            borderDash: [2],
        };
        if (isHorizontal) {
            annotation.xMin = val;
            annotation.xMax = val;
        } else {
            annotation.yMin = val;
            annotation.yMax = val;
        }
        lines.push(annotation);
    });

    positives.forEach((val, i) => {
        const flag = i + 1;
        const color = flag === 1 ? '#FEAA02' : '#FF5859';
        const annotation = {
            type: 'line',
            adjustScaleRange: false,
            borderColor: color,
            borderWidth: 1,
            borderDash: [2],
        };
        if (isHorizontal) {
            annotation.xMin = val;
            annotation.xMax = val;
        } else {
            annotation.yMin = val;
            annotation.yMax = val;
        }
        lines.push(annotation);
    });

    return lines;
}

/**
 * Compute site order sorted descending by total value for a given y-axis key.
 *
 * @param {Object[]} results - all results rows
 * @param {string}   yKey    - field to sort by
 * @returns {string[]}
 */
function getFacetSortedOrder(results, yKey) {
    const totals = new Map();
    for (const d of results) {
        const val = Number(d[yKey]) || 0;
        totals.set(d.GroupID, (totals.get(d.GroupID) || 0) + val);
    }
    return [...totals.entries()]
        .sort((a, b) => b[1] - a[1])
        .map(([groupID]) => groupID);
}

Promise.all(kriFacetDataPromises)
    .then((texts) => texts.map((text) => d3.csvParse(text)))
    .then((datasets) => {
        const SnapshotDate = d3.max(datasets[0], (d) => d.SnapshotDate);
        const allResults = datasets[0].filter(
            (d) => d.SnapshotDate === SnapshotDate
        );
        const metricMetadata = datasets[1];

        // Filter to KRI metrics only
        const kriResults = allResults.filter((d) => d.MetricID.startsWith('kri'));

        // Populate site dropdown from kri-filtered unique sites, sorted alphabetically.
        const siteDropdown = document.getElementById('kri-facet-site');
        const allSites = [...new Set(kriResults.map((d) => d.GroupID))].sort();
        for (const site of allSites) {
            const option = document.createElement('option');
            option.value = site;
            option.textContent = site;
            siteDropdown.appendChild(option);
        }

        // Derive the sorted list of MetricIDs (kri only) for facet ordering.
        const allMetrics = [...new Set(kriResults.map((d) => d.MetricID))].sort(
            (a, b) => {
                const aIdx = METRIC_PREFIX_ORDER.findIndex((p) => a.startsWith(p));
                const bIdx = METRIC_PREFIX_ORDER.findIndex((p) => b.startsWith(p));
                if (aIdx !== bIdx) return aIdx - bIdx;
                return a.localeCompare(b);
            }
        );

        const container = document.getElementById('kri-facet-container');
        const statusEl = document.getElementById('kri-facet-status');

        // Render state
        let currentResult = null;
        let lastHighlightedSite = null;

        // ── Helpers ──────────────────────────────────────────────────────────

        function getYAxis() {
            return document.getElementById('kri-facet-y-axis').value;
        }

        function getOrientation() {
            return document.getElementById('kri-facet-orientation').value;
        }

        function isThresholdChecked() {
            return document.getElementById('kri-facet-threshold').checked;
        }

        /**
         * Highlight one site across all facet charts by dimming all others.
         * Pass null or '' to clear and restore original colours.
         *
         * @param {string|null} siteID
         */
        function highlightSite(siteID) {
            if (!currentResult) return;
            lastHighlightedSite = siteID || null;

            currentResult.charts.forEach((chart) => {
                const labels = chart.data.labels;
                const siteIndex = siteID ? labels.indexOf(siteID) : -1;

                chart.data.datasets.forEach((ds) => {
                    // Store the original solid-colour string on first call.
                    const origBg =
                        ds._origBgColor ??
                        (typeof ds.backgroundColor === 'string'
                            ? ds.backgroundColor
                            : null);
                    const origBorder =
                        ds._origBorderColor ??
                        (typeof ds.borderColor === 'string'
                            ? ds.borderColor
                            : null);

                    if (!origBg) return;
                    ds._origBgColor = origBg;
                    if (origBorder) ds._origBorderColor = origBorder;

                    if (!siteID || siteIndex === -1) {
                        // Clear highlight — restore original single colour.
                        ds.backgroundColor = origBg;
                        if (origBorder) ds.borderColor = origBorder;
                    } else {
                        // Dim all sites except the selected one.
                        ds.backgroundColor = labels.map((_, i) =>
                            i === siteIndex ? origBg : hexToRgba(origBg, 0.15)
                        );
                        if (origBorder) {
                            ds.borderColor = labels.map((_, i) =>
                                i === siteIndex ? origBorder : hexToRgba(origBorder, 0.15)
                            );
                        }
                    }
                });

                chart.update('none');
            });
        }

        function getYScale() {
            const el = document.getElementById('kri-facet-y-scale');
            return el ? el.value : 'constant';
        }


        /* Called after every render when the threshold checkbox is checked.
         *
         * @param {string[]} facetValues - MetricIDs in the same order as currentResult.charts
         */
        function applyThresholdLines(facetValues) {
            if (!isThresholdChecked()) return;
            const yAxis = getYAxis();
            if (yAxis !== 'Score') return;

            const orientation = getOrientation();

            facetValues.forEach((metricID, i) => {
                const config = selectMetricID(metricMetadata, metricID);
                const rawStr = (config.Threshold || config.Thresholds || '');
                const rawValues = rawStr
                    .split(',')
                    .map((v) => v.trim())
                    .filter(Boolean)
                    .map(Number)
                    .filter((v) => !isNaN(v));

                if (rawValues.length === 0) return;

                const annotations = buildKriFacetAnnotations(rawValues, orientation);
                const chart = currentResult.charts[i];

                // chartjs-plugin-annotation accepts an array of annotation objects.
                chart.options.plugins.annotation.annotations = annotations;
                chart.update('none');
            });
        }

        // ── Render ───────────────────────────────────────────────────────────

        function render() {
            const yAxis = getYAxis();
            const orientation = getOrientation();
            const yFree = getYScale() === 'free';

            // Sort data so facets appear in metric ID order.
            const sortedResults = [...kriResults].sort((a, b) => {
                const ai = allMetrics.indexOf(a.MetricID);
                const bi = allMetrics.indexOf(b.MetricID);
                if (ai !== bi) return ai - bi;
                return 0;
            });

            currentResult = gsmViz.default.facetBars(
                container,
                sortedResults,
                {
                    mapping: {
                        x: 'GroupID',
                        y: yAxis,
                        fill: 'Flag',
                    },
                    orientation,
                    position: 'stack',
                    scales: {
                        x: {
                            label: 'Site',
                            order: (facetValue, facetData) =>
                                getFacetSortedOrder(facetData, yAxis),
                        },
                        y: {
                            label: yAxis,
                        },
                        fill: {
                            order: KRI_FACET_FLAG_ORDER,
                            palette: KRI_FACET_FLAG_PALETTE,
                            label: 'Flag',
                        },
                    },
                    facet: {
                        field: 'MetricID',
                        order: allMetrics,
                        nCol: 2,
                        label: { position: 'top' },
                        scales: { y: { free: yFree } },
                        legend: { display: false },
                    },
                    theme: {
                        dynamicSizing: false,
                        dynamicCategoryAxis: false,
                    },
                    callbacks: {
                        onClick: (point, facetValue, event) => {
                            const site =
                                orientation === 'horizontal' ? point.y : point.x;
                            siteDropdown.value = site;
                            highlightSite(site);
                            statusEl.textContent = `Selected: ${site}`;
                        },
                        onHover: (point, facetValue, event) => {
                            const site =
                                orientation === 'horizontal' ? point.y : point.x;
                            statusEl.textContent = `Hovering: ${site} — ${facetValue}`;
                        },
                    },
                }
            );

            // Disable category-axis tick labels on every facet chart.
            const categoryAxisKey = orientation === 'horizontal' ? 'y' : 'x';
            currentResult.charts.forEach((chart) => {
                chart.options.scales[categoryAxisKey].ticks = { display: false };
                chart.update('none');
            });

            // Apply per-metric threshold reference lines.
            applyThresholdLines(allMetrics);

            // Restore site highlight after re-render.
            if (lastHighlightedSite) {
                highlightSite(lastHighlightedSite);
            }
        }

        // Initial render.
        render();

        // ── Event listeners ──────────────────────────────────────────────────

        siteDropdown.addEventListener('change', () => {
            const site = siteDropdown.value;
            highlightSite(site || null);
            statusEl.textContent = site ? `Selected: ${site}` : '';
        });

        onAnyChange(
            ['kri-facet-y-axis', 'kri-facet-orientation', 'kri-facet-y-scale'],
            render
        );

        document
            .getElementById('kri-facet-threshold')
            .addEventListener('change', render);
    });
