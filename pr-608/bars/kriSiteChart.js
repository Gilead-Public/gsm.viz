const kriSiteDataFiles = [
    '../data/results.csv',
    '../data/metricMetadata.csv',
    '../data/groupMetadata.csv',
];

const kriSiteDataPromises = kriSiteDataFiles.map((dataFile) =>
    fetch(dataFile).then((response) => response.text())
);

// Traffic-light colors matching barChart's colorScheme.
const KRI_SITE_COLORS = {
    amber: '#FEAA02',
    red: '#FF5859',
};

// Symmetric traffic-light palette: Red, Amber, Green, Amber, Red
// Maps to flag order: -2, -1, 0, 1, 2
const KRI_SITE_FLAG_PALETTE = [
    '#FF5859',
    '#FEAA02',
    '#3DAF06',
    '#FEAA02',
    '#FF5859',
];
const KRI_SITE_FLAG_ORDER = ['-2', '-1', '0', '1', '2'];

const KRI_SITE_DEFAULT_METRIC = 'kri0001';

/**
 * Replicates barChart's mapThresholdsToFlags + annotations logic.
 * Returns an array of referenceLines config objects for bars.
 *
 * @param {number[]} rawThresholds - array of numeric threshold values
 * @returns {Object[]}
 */
function buildThresholdReferenceLines(rawThresholds) {
    const values = [...new Set(rawThresholds.map((v) => +v))];

    const negatives = values.filter((v) => v < 0).sort((a, b) => b - a); // descending
    const positives = values.filter((v) => v > 0).sort((a, b) => a - b); // ascending

    // Map negatives to flags -1, -2 (closest to 0 = -1, further = -2)
    const lines = [];

    negatives.forEach((val, i) => {
        const flag = -(i + 1);
        const color = flag === -1 ? KRI_SITE_COLORS.amber : KRI_SITE_COLORS.red;
        const label = flag === -1 ? '↓ Amber Flag' : '↓ Red Flag';
        lines.push({
            value: val,
            label,
            color,
            lineWidth: 1,
            lineDash: [2],
            labelPosition: 'start',
        });
    });

    positives.forEach((val, i) => {
        const flag = i + 1;
        const color = flag === 1 ? KRI_SITE_COLORS.amber : KRI_SITE_COLORS.red;
        const label = flag === 1 ? 'Amber Flag ↑' : 'Red Flag ↑';
        lines.push({
            value: val,
            label,
            color,
            lineWidth: 1,
            lineDash: [2],
            labelPosition: 'end',
        });
    });

    return lines;
}

/**
 * Compute the x-axis order for a given yKey, sorted descending by value.
 *
 * @param {Object[]} results - filtered results for the current metric
 * @param {string} yKey - field to sort by
 * @returns {string[]}
 */
function getSortedOrder(results, yKey) {
    const totals = new Map();
    for (const d of results) {
        const val = Number(d[yKey]) || 0;
        totals.set(d.GroupID, (totals.get(d.GroupID) || 0) + val);
    }
    return [...totals.entries()]
        .sort((a, b) => b[1] - a[1])
        .map(([groupID]) => groupID);
}

Promise.all(kriSiteDataPromises)
    .then((texts) => texts.map((text) => d3.csvParse(text)))
    .then((datasets) => {
        const SnapshotDate = d3.max(datasets[0], (d) => d.SnapshotDate);
        const allResults = datasets[0].filter(
            (d) => d.SnapshotDate === SnapshotDate
        );
        const metricMetadata = datasets[1];

        // Populate the metric dropdown.
        const metricDropdown = document.getElementById('kri-site-metric');
        const metrics = [...new Set(allResults.map((d) => d.MetricID))].sort(
            (a, b) => {
                const order = ['kri', 'cou', 'qtl', 'srs'];
                const aIdx = order.findIndex((p) => a.startsWith(p));
                const bIdx = order.findIndex((p) => b.startsWith(p));
                if (aIdx !== bIdx) return aIdx - bIdx;
                return a.localeCompare(b);
            }
        );
        for (const metricID of metrics) {
            const option = document.createElement('option');
            option.value = metricID;
            option.textContent = metricID;
            metricDropdown.appendChild(option);
        }
        metricDropdown.value = KRI_SITE_DEFAULT_METRIC;

        const container = document.getElementById('kri-site-container');

        function getSelectedMetricID() {
            return metricDropdown.value;
        }

        function getSelectedYAxis() {
            return document.getElementById('kri-site-y-axis').value;
        }

        function isThresholdChecked() {
            return document.getElementById('kri-site-threshold').checked;
        }

        function getOrientation() {
            return document.getElementById('kri-site-orientation').value;
        }

        function buildReferenceLines(config, yAxis, results) {
            if (!isThresholdChecked() || yAxis !== 'Score') return [];
            const raw = (config.Threshold || config.Thresholds || '')
                .split(',')
                .map((v) => v.trim())
                .filter((v) => v !== '')
                .map(Number)
                .filter((v) => !isNaN(v));
            return buildThresholdReferenceLines(raw);
        }

        function buildSpec(config, yAxis, results) {
            const metricID = getSelectedMetricID();
            return {
                mapping: {
                    x: 'GroupID',
                    y: yAxis,
                    fill: 'Flag',
                },
                orientation: getOrientation(),
                position: 'stack',
                scales: {
                    x: {
                        label: 'Site',
                        order: getSortedOrder(results, yAxis),
                    },
                    y: {
                        label: yAxis,
                    },
                    fill: {
                        order: KRI_SITE_FLAG_ORDER,
                        palette: KRI_SITE_FLAG_PALETTE,
                        label: 'Flag',
                    },
                },
                labels: {
                    title: `${metricID} — ${yAxis} by Site`,
                },
                annotations: {
                    referenceLines: buildReferenceLines(config, yAxis, results),
                },
                theme: {
                    dynamicSizing: false,
                    dynamicCategoryAxis: false,
                },
            };
        }

        function getResultsForMetric(metricID) {
            return filterOnMetricID(allResults, metricID);
        }

        function getConfig(metricID) {
            return selectMetricID(metricMetadata, metricID);
        }

        const initialMetricID = getSelectedMetricID();
        const initialYAxis = getSelectedYAxis();
        const initialConfig = getConfig(initialMetricID);
        const initialResults = getResultsForMetric(initialMetricID);

        let kriSiteInstance = gsmViz.default.bars(
            container,
            initialResults,
            buildSpec(initialConfig, initialYAxis, initialResults)
        );

        document
            .getElementById('kri-site-export-btn')
            .addEventListener('click', () =>
                kriSiteInstance.helpers.exportImage(
                    kriSiteInstance,
                    'kri-by-site.png'
                )
            );

        function rerender() {
            const metricID = getSelectedMetricID();
            const yAxis = getSelectedYAxis();
            const config = getConfig(metricID);
            const results = getResultsForMetric(metricID);
            kriSiteInstance.helpers.updateData(
                kriSiteInstance,
                results,
                buildSpec(config, yAxis, results)
            );
        }

        onAnyChange(
            ['kri-site-metric', 'kri-site-y-axis', 'kri-site-orientation'],
            rerender
        );

        document
            .getElementById('kri-site-threshold')
            .addEventListener('change', rerender);
    });
