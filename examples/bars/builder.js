/**
 * Bar Chart Builder for the bars / facetBars API.
 *
 * Loads any pre-built dataset (or a user-supplied CSV), auto-detects column
 * types, and surfaces all bars/facetBars spec options as interactive controls
 * so analysts can build charts without writing code.
 */

// ── Constants ─────────────────────────────────────────────────────────────────

const DATASETS = [
    { label: 'Retention', file: 'retention.csv' },
    { label: 'Metric Results', file: 'results.csv' },
    { label: 'Penguins (size)', file: 'penguins_size.csv' },
    { label: 'Penguins (full)', file: 'penguins_lter.csv' },
    { label: 'Titanic', file: 'titanic.csv' },
    { label: 'Gapminder', file: 'gapminder_data_graphs.csv' },
    { label: 'World Gini Index', file: 'WB_WDI_SI_POV_GINI.csv' },
    { label: 'World Gini (wide format)', file: 'WB_WDI_SI_POV_GINI_WIDEF.csv' },
];

// Values treated as missing when detecting column types.
const MISSING = new Set(['', 'na', 'n/a', 'null', 'nan', 'undefined']);

// ── Module state ──────────────────────────────────────────────────────────────

let rawData = [];
let colTypes = { categoricalCols: [], numericCols: [] };
let currentChart = null;
let currentFacetResult = null;

// ── Column type detection ─────────────────────────────────────────────────────

/**
 * Classify each column in the dataset as numeric or categorical.
 * A column is numeric when every non-missing value parses as a finite number.
 *
 * @param {Object[]} data
 * @returns {{ categoricalCols: string[], numericCols: string[] }}
 */
function detectColumnTypes(data) {
    if (!data.length) return { categoricalCols: [], numericCols: [] };

    const columns = Object.keys(data[0]);
    const categoricalCols = [];
    const numericCols = [];

    for (const col of columns) {
        const nonMissing = data
            .map((d) => String(d[col]).trim())
            .filter((v) => !MISSING.has(v.toLowerCase()));

        const allNumeric =
            nonMissing.length > 0 &&
            nonMissing.every((v) => Number.isFinite(Number(v))) &&
            // Exclude columns with low cardinality that happen to be numeric.
            new Set(nonMissing).size > 10;

        if (allNumeric) {
            numericCols.push(col);
        } else {
            categoricalCols.push(col);
        }
    }

    return { categoricalCols, numericCols };
}

// ── Dataset loading ───────────────────────────────────────────────────────────

async function fetchCsv(filepath) {
    const response = await fetch(filepath);
    if (!response.ok) {
        throw new Error(`HTTP ${response.status} loading ${filepath}`);
    }
    const text = await response.text();
    return d3.csvParse(text);
}

function onDatasetLoaded(data, label) {
    rawData = data;
    colTypes = detectColumnTypes(data);
    setStatus(
        `${label} — ${data.length.toLocaleString()} rows, ${
            Object.keys(data[0] || {}).length
        } columns`
    );
    renderMappingControls();
    // Sync control disabled states after mapping controls repopulate.
    document.getElementById('settings-y-agg').disabled = !getVal('mapping-y');
    const facetKey = getVal('mapping-facet');
    document.getElementById('settings-facet-ncol').disabled = !facetKey;
    document.getElementById('settings-facet-height').disabled = !facetKey;
    document.getElementById('settings-facet-y-scale').disabled = !facetKey;
    document.getElementById('settings-facet-x-scale').disabled = !facetKey;
    renderFillOrder();
    renderFilters();
    render();
}

// ── Mapping controls ──────────────────────────────────────────────────────────

/**
 * Repopulate a <select> from an array of option values, preserving the
 * current selection when the column still exists in the new data.
 *
 * @param {string}   id          - element ID
 * @param {string[]} options     - option values to add
 * @param {boolean}  includeNone - prepend a "(none)" option with value ""
 */
function populateSelect(id, options, includeNone = false) {
    const el = document.getElementById(id);
    const prev = el.value;
    el.innerHTML = '';

    if (includeNone) {
        const opt = document.createElement('option');
        opt.value = '';
        opt.textContent = '(none)';
        el.appendChild(opt);
    }

    for (const col of options) {
        const opt = document.createElement('option');
        opt.value = col;
        opt.textContent = col;
        el.appendChild(opt);
    }

    if ([...el.options].some((o) => o.value === prev)) {
        el.value = prev;
    }
}

function renderMappingControls() {
    const { categoricalCols, numericCols } = colTypes;

    populateSelect('mapping-x', categoricalCols, false);

    // y: "(count)" sentinel + numeric columns
    const ySelect = document.getElementById('mapping-y');
    const prevY = ySelect.value;
    ySelect.innerHTML = '<option value="">(count)</option>';
    for (const col of numericCols) {
        const opt = document.createElement('option');
        opt.value = col;
        opt.textContent = col;
        ySelect.appendChild(opt);
    }
    if ([...ySelect.options].some((o) => o.value === prevY)) {
        ySelect.value = prevY;
    }

    populateSelect('mapping-fill', categoricalCols, true);
    populateSelect('mapping-facet', categoricalCols, true);
}

// ── Fill order (drag-and-drop) ──────────────────────────────────────────────────

/**
 * Unique values of a column in data-encounter order — the same order the bars
 * library uses by default for fill groups. Building the reorder list from the
 * full (unfiltered) rawData means the resulting `scales.fill.order` allowlist
 * always contains every possible value, so values re-included by a later filter
 * change are never silently dropped.
 *
 * @param {string} col
 * @returns {string[]}
 */
function getUniqueValues(col) {
    const seen = new Set();
    const values = [];
    for (const row of rawData) {
        const v = String(row[col]);
        if (!seen.has(v)) {
            seen.add(v);
            values.push(v);
        }
    }
    return values;
}

/**
 * Wire native HTML5 drag-and-drop reordering onto a fill-order <ul>. Reordering
 * the DOM is the source of truth; getFillOrder() reads it back at render time.
 *
 * @param {HTMLUListElement} list
 */
function attachFillOrderDnd(list) {
    let dragItem = null;

    list.addEventListener('dragstart', (e) => {
        const item = e.target.closest('.fill-order-item');
        if (!item) return;
        dragItem = item;
        item.classList.add('dragging');
        e.dataTransfer.effectAllowed = 'move';
        // Firefox requires data to be set for the drag to begin.
        e.dataTransfer.setData('text/plain', item.dataset.value);
    });

    list.addEventListener('dragend', () => {
        if (dragItem) dragItem.classList.remove('dragging');
        list.querySelectorAll('.drag-over').forEach((el) =>
            el.classList.remove('drag-over')
        );
        dragItem = null;
    });

    list.addEventListener('dragover', (e) => {
        e.preventDefault();
        const target = e.target.closest('.fill-order-item');
        if (!target || target === dragItem) return;
        e.dataTransfer.dropEffect = 'move';
        list.querySelectorAll('.drag-over').forEach((el) =>
            el.classList.remove('drag-over')
        );
        target.classList.add('drag-over');
    });

    list.addEventListener('drop', (e) => {
        e.preventDefault();
        const target = e.target.closest('.fill-order-item');
        if (!target || !dragItem || target === dragItem) return;
        target.classList.remove('drag-over');
        // Insert before or after the target based on pointer position.
        const rect = target.getBoundingClientRect();
        const after = e.clientY > rect.top + rect.height / 2;
        list.insertBefore(dragItem, after ? target.nextSibling : target);
        render();
    });
}

/**
 * (Re)build the fill-order list to match the currently selected fill column.
 * Shows a hint when no fill column is selected.
 */
function renderFillOrder() {
    const container = document.getElementById('fill-order-container');
    container.innerHTML = '';

    const fillKey = getVal('mapping-fill');
    if (!fillKey) {
        const hint = document.createElement('div');
        hint.className = 'fill-order-empty';
        hint.textContent = 'Select a Fill variable to reorder its values.';
        container.appendChild(hint);
        return;
    }

    const list = document.createElement('ul');
    list.className = 'fill-order-list';

    for (const val of getUniqueValues(fillKey)) {
        const item = document.createElement('li');
        item.className = 'fill-order-item';
        item.draggable = true;
        item.dataset.value = val;

        const handle = document.createElement('span');
        handle.className = 'fill-order-handle';
        handle.textContent = '⠿';
        item.appendChild(handle);

        const label = document.createElement('span');
        label.className = 'fill-order-label';
        label.textContent = val;
        item.appendChild(label);

        list.appendChild(item);
    }

    attachFillOrderDnd(list);
    container.appendChild(list);
}

/**
 * Read the current fill order from the DOM list (top-to-bottom).
 * @returns {string[]}
 */
function getFillOrder() {
    const items = document.querySelectorAll(
        '#fill-order-container .fill-order-item'
    );
    return [...items].map((el) => el.dataset.value);
}

// ── Dynamic filters ───────────────────────────────────────────────────────────

/**
 * Sanitize a column name into a valid HTML-attribute–safe string for use in
 * element IDs (replace non-alphanumeric characters with underscores).
 *
 * @param {string} col
 * @returns {string}
 */
function colToId(col) {
    return col.replace(/[^a-zA-Z0-9]/g, '_');
}

function renderFilters() {
    const container = document.getElementById('filters-container');
    container.innerHTML = '';

    const { categoricalCols, numericCols } = colTypes;

    for (const col of categoricalCols) {
        const uniqueVals = [
            ...new Set(rawData.map((d) => String(d[col]))),
        ].sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));

        const fieldset = document.createElement('fieldset');
        fieldset.className = 'filter-fieldset';

        const legend = document.createElement('legend');
        legend.textContent = col;
        fieldset.appendChild(legend);

        const sel = document.createElement('select');
        sel.multiple = true;
        sel.id = `filter-cat-${colToId(col)}`;
        sel.dataset.col = col;
        sel.className = 'filter-multiselect';
        sel.size = Math.min(uniqueVals.length, 5);

        for (const val of uniqueVals) {
            const opt = document.createElement('option');
            opt.value = val;
            opt.textContent = val;
            opt.selected = true;
            sel.appendChild(opt);
        }

        sel.addEventListener('change', render);
        fieldset.appendChild(sel);
        container.appendChild(fieldset);
    }

    for (const col of numericCols) {
        const vals = rawData
            .map((d) => Number(d[col]))
            .filter((v) => Number.isFinite(v));

        if (!vals.length) continue;

        let dataMin = Infinity;
        let dataMax = -Infinity;
        for (const v of vals) {
            if (v < dataMin) dataMin = v;
            if (v > dataMax) dataMax = v;
        }

        const fieldset = document.createElement('fieldset');
        fieldset.className = 'filter-fieldset';

        const legend = document.createElement('legend');
        legend.textContent = col;
        fieldset.appendChild(legend);

        const display = document.createElement('div');
        display.className = 'range-display';
        display.id = `filter-display-${colToId(col)}`;
        fieldset.appendChild(display);

        function makeRangeInput(role, initValue) {
            const input = document.createElement('input');
            input.type = 'range';
            input.id = `filter-${role}-${colToId(col)}`;
            input.dataset.col = col;
            input.dataset.role = role;
            input.min = dataMin;
            input.max = dataMax;
            input.step = dataMax > dataMin ? (dataMax - dataMin) / 200 : 1;
            input.value = initValue;
            input.className = 'range-slider';
            return input;
        }

        const minInput = makeRangeInput('min', dataMin);
        const maxInput = makeRangeInput('max', dataMax);

        function updateDisplay() {
            const lo = Math.min(Number(minInput.value), Number(maxInput.value));
            const hi = Math.max(Number(minInput.value), Number(maxInput.value));
            const fmt = (v) => (Number.isInteger(v) ? v : v.toPrecision(4));
            display.textContent = `${fmt(lo)} – ${fmt(hi)}`;
        }

        updateDisplay();

        minInput.addEventListener('input', () => {
            updateDisplay();
            render();
        });
        maxInput.addEventListener('input', () => {
            updateDisplay();
            render();
        });

        fieldset.appendChild(minInput);
        fieldset.appendChild(maxInput);
        container.appendChild(fieldset);
    }
}

// ── Filter application ────────────────────────────────────────────────────────

function applyFilters(data) {
    let filtered = data;
    const { categoricalCols, numericCols } = colTypes;

    for (const col of categoricalCols) {
        const sel = document.getElementById(`filter-cat-${colToId(col)}`);
        if (!sel) continue;
        const selected = new Set([...sel.selectedOptions].map((o) => o.value));
        if (selected.size < sel.options.length) {
            filtered = filtered.filter((d) => selected.has(String(d[col])));
        }
        if (filtered.length === 0)
            console.warn(`Filter on column "${col}" excluded all data.`);
    }

    for (const col of numericCols) {
        const minEl = document.getElementById(`filter-min-${colToId(col)}`);
        const maxEl = document.getElementById(`filter-max-${colToId(col)}`);
        if (!minEl || !maxEl) continue;
        const lo = Math.min(Number(minEl.value), Number(maxEl.value));
        const hi = Math.max(Number(minEl.value), Number(maxEl.value));
        // Skip filtering when sliders are at their full range — avoids
        // inadvertently dropping rows with missing/non-numeric values in
        // columns the user hasn't explicitly filtered.
        const atFullRange = lo <= Number(minEl.min) && hi >= Number(maxEl.max);
        if (atFullRange) continue;
        filtered = filtered.filter((d) => {
            const v = Number(d[col]);
            return Number.isFinite(v) && v >= lo && v <= hi;
        });
        if (filtered.length === 0)
            console.warn(`Filter on column "${col}" excluded all data.`);
    }

    return filtered;
}

// ── Aggregation ───────────────────────────────────────────────────────────────

const AGG_FNS = {
    mean: (vals) => vals.reduce((a, b) => a + b, 0) / vals.length,
    min: (vals) => Math.min(...vals),
    max: (vals) => Math.max(...vals),
    median: (vals) => {
        const sorted = [...vals].sort((a, b) => a - b);
        const mid = Math.floor(sorted.length / 2);
        return sorted.length % 2 !== 0
            ? sorted[mid]
            : (sorted[mid - 1] + sorted[mid]) / 2;
    },
    sd: (vals) => {
        const mean = vals.reduce((a, b) => a + b, 0) / vals.length;
        const variance =
            vals.reduce((sum, v) => sum + (v - mean) ** 2, 0) / vals.length;
        return Math.sqrt(variance);
    },
};

/**
 * Pre-aggregate data by (x, fill) groups using the given aggregation function.
 * Returns one synthetic row per group with the aggregated y value.
 *
 * @param {Object[]} data
 * @param {string}   xKey
 * @param {string}   yKey
 * @param {string|undefined} fillKey
 * @param {Function} aggFn
 * @returns {Object[]}
 */
function aggregateData(data, xKey, yKey, fillKey, aggFn) {
    const groups = new Map();

    for (const row of data) {
        const xVal = String(row[xKey]);
        const fillVal = fillKey ? String(row[fillKey]) : null;
        const key = fillVal !== null ? `${xVal}\x00${fillVal}` : xVal;

        if (!groups.has(key)) {
            groups.set(key, { xVal, fillVal, values: [] });
        }
        const v = Number(row[yKey]);
        if (Number.isFinite(v)) {
            groups.get(key).values.push(v);
        }
    }

    return [...groups.values()]
        .filter((g) => g.values.length > 0)
        .map((g) => {
            const row = { [xKey]: g.xVal, [yKey]: aggFn(g.values) };
            if (fillKey && g.fillVal !== null) row[fillKey] = g.fillVal;
            return row;
        });
}

function getVal(id) {
    return document.getElementById(id).value;
}

function getText(id) {
    return document.getElementById(id).value.trim();
}

function getBool(id) {
    return getVal(id) === 'yes';
}

function getNCategories() {
    const raw = getVal('settings-n-categories');
    const val = Number(raw);
    return Number.isInteger(val) && val >= 1 ? val : undefined;
}

function getPositiveInt(id) {
    const raw = document.getElementById(id).value;
    const val = parseInt(raw, 10);
    return Number.isInteger(val) && val >= 1 ? val : undefined;
}

function getFiniteNumber(id) {
    const raw = document.getElementById(id).value;
    const val = Number(raw);
    return raw !== '' && Number.isFinite(val) ? val : undefined;
}

// ── Spec builders ─────────────────────────────────────────────────────────────

function buildAnnotations(mode, barLabelMode) {
    const segmentOverrides = buildBarLabelOverride(barLabelMode);
    const segmentLabel = segmentOverrides
        ? { display: true, ...segmentOverrides }
        : null;

    const base = (() => {
        if (mode === 'none') return {};
        if (mode === 'total-outside')
            return {
                labels: { total: { display: true, placement: 'outside' } },
            };
        if (mode === 'total-inside')
            return {
                labels: { total: { display: true, placement: 'inside' } },
            };
        if (mode === 'segment-outside')
            return {
                labels: { segment: { display: true, placement: 'end' } },
            };
        if (mode === 'segment-inside')
            return {
                labels: { segment: { display: true, placement: 'center' } },
            };
        return {};
    })();

    if (segmentLabel) {
        base.labels = base.labels || {};
        base.labels.segment = {
            ...(base.labels.segment || {}),
            ...segmentLabel,
        };
    }

    return base;
}

function buildBarLabelOverride(mode) {
    if (mode === 'count') return { value: 'raw' };
    if (mode === 'percent') return { value: 'percent' };
    if (mode === 'fill') return { formatter: '{fill}' };
    if (mode === 'category') return { formatter: '{category}' };
    if (mode === 'custom') return { formatter: '{fill}: {value} ({percent})' };
    return null;
}

function buildSpec(xKey, yKey, fillKey, facetKey) {
    const orientation = getVal('settings-orientation');
    const position = getVal('settings-position');
    const dynamicSizing = getBool('settings-dynamic-sizing');
    const dynamicCategoryAxis = getBool('settings-dynamic-category-axis');
    const annotationsMode = getVal('settings-annotations');
    const barLabelMode = getVal('settings-bar-label');
    const nCategories = getNCategories();
    const xSort = getVal('settings-x-sort') || undefined;
    const xSortDir = getVal('settings-x-sort-dir') || undefined;
    const tooltipFormat = getVal('settings-tooltip-format') || undefined;
    const yMin = getFiniteNumber('settings-y-min');
    const yMax = getFiniteNumber('settings-y-max');
    const title = getText('label-title');
    const caption = getText('label-caption');
    const xLabel = getText('label-x');
    const yLabel = getText('label-y');
    const legendLabel = getText('label-legend');

    const spec = {
        mapping: { x: xKey },
        orientation,
        position,
        nCategories,
        scales: {
            x: {
                ...(xSort ? { sort: xSort } : {}),
                ...(xSortDir ? { sortDir: xSortDir } : {}),
                ...(xLabel ? { label: xLabel } : {}),
            },
            y: {
                ...(yMin !== undefined ? { min: yMin } : {}),
                ...(yMax !== undefined ? { max: yMax } : {}),
                ...(yLabel ? { label: yLabel } : {}),
            },
        },
        theme: { dynamicSizing, dynamicCategoryAxis },
        annotations: buildAnnotations(annotationsMode, barLabelMode),
        ...(tooltipFormat ? { tooltip: { format: tooltipFormat } } : {}),
    };

    if (yKey) spec.mapping.y = yKey;
    if (fillKey) {
        spec.mapping.fill = fillKey;
        // Explicit fill order (matches the library default until reordered);
        // also acts as an allowlist, so it must list every value.
        const fillOrder = getFillOrder();
        spec.scales.fill = {
            ...(fillOrder.length ? { order: fillOrder } : {}),
            ...(legendLabel ? { label: legendLabel } : {}),
        };
    }

    const labels = {
        ...(title ? { title } : {}),
        ...(caption ? { captions: caption } : {}),
    };
    if (Object.keys(labels).length) spec.labels = labels;

    if (facetKey) {
        const legendMode = getVal('settings-legend-position');
        const yFree = getVal('settings-facet-y-scale') === 'free';
        const xFree = getVal('settings-facet-x-scale') === 'free';
        spec.facet = {
            field: facetKey,
            nCol: getPositiveInt('settings-facet-ncol'),
            chartHeight: getPositiveInt('settings-facet-height'),
            legend: { display: legendMode !== 'none' },
            scales: { y: { free: yFree }, x: { free: xFree } },
        };
    }

    return spec;
}

// ── Chart lifecycle ───────────────────────────────────────────────────────────

function destroyCurrentChart() {
    if (currentChart) {
        currentChart.destroy();
        currentChart = null;
    }
    if (currentFacetResult) {
        currentFacetResult.charts.forEach((c) => c.destroy());
        currentFacetResult = null;
    }
    const container = document.getElementById('chart-container');
    container.innerHTML = '';
    // Reset any inline dimensions applied by bars.js dynamic sizing
    // so the CSS default (height: 500px) takes over cleanly.
    container.style.height = '';
    container.style.width = '';
}

function render() {
    updateSpecDisplay();

    const xKey = getVal('mapping-x');
    if (!xKey) return;

    const yKey = getVal('mapping-y') || undefined;
    const fillKey = getVal('mapping-fill') || undefined;
    const facetKey = getVal('mapping-facet') || undefined;
    const aggMode = yKey ? getVal('settings-y-agg') : undefined;

    let filtered = applyFilters(rawData);
    const container = document.getElementById('chart-container');

    if (!filtered.length) {
        destroyCurrentChart();
        container.innerHTML =
            '<p class="builder-error">No data matches the current filters.</p>';
        return;
    }

    if (yKey && aggMode && aggMode !== 'identity') {
        filtered = aggregateData(
            filtered,
            xKey,
            yKey,
            fillKey,
            AGG_FNS[aggMode]
        );
    }

    const spec = buildSpec(xKey, yKey, fillKey, facetKey);
    destroyCurrentChart();

    try {
        if (facetKey) {
            currentFacetResult = gsmViz.default.facetBars(
                container,
                filtered,
                spec
            );
        } else {
            currentChart = gsmViz.default.bars(container, filtered, spec);
        }
        applyLegendSettings();
    } catch (e) {
        const errEl = document.createElement('p');
        errEl.className = 'builder-error';
        errEl.textContent = `Render error: ${e.message}`;
        container.innerHTML = '';
        container.appendChild(errEl);
        console.error(e);
    }
}

// ── Legend position (post-render) ─────────────────────────────────────────────

/**
 * Apply the legend position/display setting to the rendered chart(s) after
 * the spec has been applied. This is handled post-render because the bars
 * spec does not expose a legend display/position option directly.
 */
function applyLegendSettings() {
    const legendMode = getVal('settings-legend-position');
    const fillKey = getVal('mapping-fill') || undefined;
    const display = legendMode !== 'none' && !!fillKey;
    const position = display ? legendMode : 'top';

    if (currentChart) {
        currentChart.options.plugins.legend.display = display;
        if (display) currentChart.options.plugins.legend.position = position;
        currentChart.update('none');
    } else if (currentFacetResult) {
        currentFacetResult.charts.forEach((chart) => {
            if (chart.options.plugins.legend.display) {
                chart.options.plugins.legend.position = position;
                chart.update('none');
            }
        });
    }
}

// ── Export ────────────────────────────────────────────────────────────────────

function handleExport() {
    if (currentChart) {
        currentChart.helpers.exportImage(currentChart, 'bar-chart.png');
    } else if (currentFacetResult) {
        currentFacetResult.charts.forEach((chart, i) => {
            chart.helpers.exportImage(chart, `bar-chart-facet-${i + 1}.png`);
        });
    }
}

function cleanSpec(obj) {
    if (obj == null || typeof obj !== 'object') return obj;
    if (Array.isArray(obj)) return obj;

    const cleaned = {};
    for (const [k, v] of Object.entries(obj)) {
        // Only drop undefined. `false` is meaningful in exported specs (e.g.
        // facet.legend.display: false overriding a default of true), so it must
        // be preserved for the export to reproduce the current UI state.
        if (v === undefined) continue;
        const cv =
            typeof v === 'object' && !Array.isArray(v) ? cleanSpec(v) : v;
        if (
            typeof cv === 'object' &&
            cv !== null &&
            !Array.isArray(cv) &&
            Object.keys(cv).length === 0
        )
            continue;
        cleaned[k] = cv;
    }
    return cleaned;
}

/**
 * Build the `gsmViz.bars(...)`/`gsmViz.facetBars(...)` source string for the
 * current control state. Shared by the Export Spec button and the live spec
 * display panel so both always reflect the same code.
 */
function buildSpecText(xKey, yKey, fillKey, facetKey) {
    const spec = cleanSpec(buildSpec(xKey, yKey, fillKey, facetKey));
    const facetCall = facetKey ? 'facetBars' : 'bars';
    return `gsmViz.${facetCall}(element, data, ${JSON.stringify(
        spec,
        null,
        4
    )});`;
}

/**
 * Refresh the live spec display panel to match the current chart. Called on
 * every render so the displayed code stays in sync with the rendered chart.
 */
function updateSpecDisplay() {
    const el = document.getElementById('spec-display');
    if (!el) return;

    const xKey = getVal('mapping-x');
    if (!xKey) {
        el.textContent = '// Select an X (category) variable to build a spec.';
        return;
    }

    const yKey = getVal('mapping-y') || undefined;
    const fillKey = getVal('mapping-fill') || undefined;
    const facetKey = getVal('mapping-facet') || undefined;
    el.textContent = buildSpecText(xKey, yKey, fillKey, facetKey);
}

function handleExportSpec() {
    const xKey = getVal('mapping-x');
    if (!xKey) return;

    const yKey = getVal('mapping-y') || undefined;
    const fillKey = getVal('mapping-fill') || undefined;
    const facetKey = getVal('mapping-facet') || undefined;
    const text = buildSpecText(xKey, yKey, fillKey, facetKey);

    navigator.clipboard.writeText(text).then(() => {
        const btn = document.getElementById('export-spec-btn');
        btn.textContent = 'Copied!';
        setTimeout(() => {
            btn.textContent = 'Export Spec';
        }, 1500);
    });
}

// ── Status bar ────────────────────────────────────────────────────────────────

function setStatus(text) {
    document.getElementById('builder-status').textContent = text;
}

// ── Initialization ────────────────────────────────────────────────────────────

// Populate dataset dropdown.
const datasetSelect = document.getElementById('dataset-select');
DATASETS.forEach(({ label, file }) => {
    const opt = document.createElement('option');
    opt.value = file;
    opt.textContent = label;
    datasetSelect.appendChild(opt);
});

datasetSelect.addEventListener('change', () => {
    const selected = DATASETS.find((d) => d.file === datasetSelect.value);
    fetchCsv(`data/${datasetSelect.value}`)
        .then((data) =>
            onDatasetLoaded(
                data,
                selected ? selected.label : datasetSelect.value
            )
        )
        .catch((e) => {
            setStatus(`Failed to load dataset: ${e.message}`);
            console.error(e);
        });
});

// CSV file import.
document.getElementById('csv-file-input').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
        const data = d3.csvParse(ev.target.result);
        onDatasetLoaded(data, file.name);
        // Reset so the same file can be re-loaded if needed.
        e.target.value = '';
    };
    reader.readAsText(file);
});

// Wire all static settings and mapping controls to re-render.
[
    'settings-orientation',
    'settings-position',
    'settings-dynamic-sizing',
    'settings-dynamic-category-axis',
    'settings-annotations',
    'settings-bar-label',
    'settings-n-categories',
    'settings-x-sort',
    'settings-x-sort-dir',
    'settings-tooltip-format',
    'settings-y-min',
    'settings-y-max',
    'settings-legend-position',
    'settings-facet-ncol',
    'settings-facet-height',
    'settings-facet-y-scale',
    'settings-facet-x-scale',
    'settings-y-agg',
    'mapping-x',
].forEach((id) => {
    document.getElementById(id).addEventListener('change', render);
});

// Label text inputs re-render live as the user types.
['label-title', 'label-caption', 'label-x', 'label-y', 'label-legend'].forEach(
    (id) => {
        document.getElementById(id).addEventListener('input', render);
    }
);

// Fill mapping: rebuild the fill-order list (so getFillOrder reads the new
// column's values) before re-rendering.
document.getElementById('mapping-fill').addEventListener('change', () => {
    renderFillOrder();
    render();
});

// Y mapping: enable/disable aggregation control and re-render.
document.getElementById('mapping-y').addEventListener('change', () => {
    const yKey = getVal('mapping-y');
    const aggEl = document.getElementById('settings-y-agg');
    aggEl.disabled = !yKey;
    render();
});

// Facet mapping: enable/disable facet-specific controls and re-render.
document.getElementById('mapping-facet').addEventListener('change', () => {
    const facetKey = getVal('mapping-facet');
    const facetDisabled = !facetKey;
    document.getElementById('settings-facet-ncol').disabled = facetDisabled;
    document.getElementById('settings-facet-height').disabled = facetDisabled;
    document.getElementById('settings-facet-y-scale').disabled = facetDisabled;
    document.getElementById('settings-facet-x-scale').disabled = facetDisabled;
    render();
});

document.getElementById('export-btn').addEventListener('click', handleExport);
document
    .getElementById('export-spec-btn')
    .addEventListener('click', handleExportSpec);

// Load default dataset on startup.
fetchCsv('data/retention.csv')
    .then((data) => onDatasetLoaded(data, 'Retention'))
    .catch((e) => {
        setStatus(`Failed to load default dataset: ${e.message}`);
        console.error(e);
    });
