import { select } from 'd3';

import configure from './groupOverviewSubset/configure.js';
import addFilter from './groupOverviewSubset/addFilter.js';
import getGroupIDs from './groupOverviewSubset/getGroupIDs.js';
import applyFilters from './groupOverviewSubset/applyFilters.js';
import attachEventListener from './groupOverviewSubset/attachEventListener.js';

import deriveGroupMetrics from './groupOverview/deriveGroupMetrics.js';
import structureGroupMetadata from './util/structureGroupMetadata.js';

/**
 * Add interactive filter controls to a groupOverview table.
 *
 * @param {Object} groupOverview - an initialized groupOverview table instance
 *                                 (returned by gsmViz.groupOverview())
 * @param {Object} [_config_]   - configuration
 * @param {Node|string|null}  [_config_.container]  - mount point for filter UI
 * @param {Object} [_config_.groupCharacteristics]  - { DisplayLabel: 'metadataParamKey' }
 * @param {Object} [_config_.initialSubset]          - initial filter values keyed by filter id
 * @param {Array}  [_config_.defaultFilters]          - default filter ids to render
 * @param {string} [_config_.rangeControl]            - 'inputs' or 'dualRange'
 *
 * @returns {Object} API: { applyFilters, getGroupIDs, setFilter, getFilterState, filters }
 */
export default function groupOverviewSubset(groupOverview, _config_) {
    // ── validate ─────────────────────────────────────────────────────
    if (!groupOverview || !groupOverview._context_) {
        throw new Error(
            'groupOverviewSubset: first argument must be an initialized groupOverview table with _context_.'
        );
    }

    const ctx = groupOverview._context_;
    const config = configure(_config_);

    // ── derive / cache group-level data ──────────────────────────────
    const groups = deriveGroupMetrics(
        ctx._groupMetadata_,
        ctx._results_,
        ctx.config
    );

    // Structured metadata (Map<GroupID, { Param: Value }>) — may be null.
    const structuredMeta = structureGroupMetadata(
        ctx._groupMetadata_,
        ctx.config
    );

    // Merge structured metadata onto group objects so characteristic
    // properties (e.g. country, status) are accessible alongside
    // derived metrics (nRedFlags, siteRiskScore, etc.).
    if (structuredMeta) {
        groups.forEach((g) => {
            const meta = structuredMeta.get(g.GroupID);
            if (meta) {
                Object.entries(meta).forEach(([key, value]) => {
                    if (!(key in g)) {
                        g[key] = value;
                    }
                });
            }
        });
    }

    // Parse common numeric fields that arrive as strings from CSV.
    groups.forEach((g) => {
        const pck = ctx.config.groupParticipantCountKey || 'ParticipantCount';
        if (g[pck] !== undefined) {
            g[pck] = Number(g[pck]);
        }
    });

    // ── resolve filter container ─────────────────────────────────────
    let containerNode;
    if (config.container) {
        containerNode =
            typeof config.container === 'string'
                ? document.querySelector(config.container)
                : config.container;
    }

    if (!containerNode) {
        // Create a container and insert it before the table.
        containerNode = document.createElement('div');
        containerNode.className = 'gsm-viz-filter-container';
        const tableNode = groupOverview.node();
        if (tableNode && tableNode.parentNode) {
            tableNode.parentNode.insertBefore(containerNode, tableNode);
        }
    }

    const container = select(containerNode);

    // ── build filter definitions ─────────────────────────────────────
    const filterDefs = [];
    const defaultFilters = config.defaultFilters || [];

    // — anyFlag —
    if (defaultFilters.includes('anyFlag')) {
        filterDefs.push({
            id: 'anyFlag',
            label: 'Flag Subset',
            property: 'anyFlag',
            type: 'categorical',
            options: ['red', 'amber', 'red-or-amber'],
        });
    }

    // — siteRiskScore — only when GroupLevel is Site and metric data exists.
    if (defaultFilters.includes('siteRiskScore')) {
        const hasScore = groups.some((g) => g.siteRiskScore !== undefined);
        if (ctx.config.GroupLevel === 'Site' && hasScore) {
            const scores = groups
                .filter((g) => g.siteRiskScore !== undefined)
                .map((g) => g.siteRiskScore);
            filterDefs.push({
                id: 'siteRiskScore',
                label: 'Site Risk Score',
                property: 'siteRiskScore',
                type: 'range',
                domain: {
                    min: Math.floor(Math.min(...scores)),
                    max: Math.ceil(Math.max(...scores)),
                },
            });
        }
    }

    // — numberEnrolled —
    if (defaultFilters.includes('numberEnrolled')) {
        const pck =
            ctx.config.groupParticipantCountKey || 'ParticipantCount';
        const counts = groups
            .filter((g) => g[pck] !== undefined && !isNaN(g[pck]))
            .map((g) => Number(g[pck]));

        if (counts.length > 0) {
            filterDefs.push({
                id: 'numberEnrolled',
                label: 'Number Enrolled',
                property: pck,
                type: 'range',
                domain: {
                    min: Math.floor(Math.min(...counts)),
                    max: Math.ceil(Math.max(...counts)),
                },
            });
        }
    }

    // — configurable group characteristics —
    if (config.groupCharacteristics) {
        Object.entries(config.groupCharacteristics).forEach(
            ([label, paramKey]) => {
                const values = [
                    ...new Set(
                        groups
                            .map((g) => g[paramKey])
                            .filter((v) => v !== undefined && v !== null)
                    ),
                ].sort();

                if (values.length > 0) {
                    filterDefs.push({
                        id: paramKey,
                        label,
                        property: paramKey,
                        type: 'categorical',
                        options: values,
                    });
                }
            }
        );
    }

    // ── render filter controls ───────────────────────────────────────
    const filters = filterDefs.map((def) => {
        const { element, getValue } = addFilter(
            container,
            def,
            config.rangeControl
        );
        return {
            id: def.id,
            property: def.property,
            type: def.type,
            element,
            getValue,
        };
    });

    // ── apply initialSubset ──────────────────────────────────────────
    if (config.initialSubset) {
        setInitialValues(filters, config.initialSubset);
    }

    // ── attach event listeners ───────────────────────────────────────
    attachEventListener(
        container,
        groupOverview,
        ctx._results_,
        groups,
        filters
    );

    // ── apply initial filter state (re-render) ───────────────────────
    const initialGroupIDs = applyFilters(
        groupOverview,
        ctx._results_,
        groups,
        filters
    );

    // ── return public API ────────────────────────────────────────────
    return {
        /** Re-evaluate all filters and re-render the table. */
        applyFilters: () =>
            applyFilters(groupOverview, ctx._results_, groups, filters),

        /** Get the current set of visible group IDs. */
        getGroupIDs: () => {
            const perFilter = filters.map((f) =>
                getGroupIDs(groups, f.property, f.getValue())
            );
            if (perFilter.length === 0) return groups.map((g) => g.GroupID);
            return perFilter.reduce((acc, ids) => {
                const s = new Set(ids);
                return acc.filter((id) => s.has(id));
            });
        },

        /** Programmatically set a filter value by filter id. */
        setFilter: (filterId, value) => {
            setInitialValues(
                filters,
                { [filterId]: value }
            );
            applyFilters(groupOverview, ctx._results_, groups, filters);
        },

        /** Get the current value of every filter. */
        getFilterState: () =>
            filters.reduce((acc, f) => {
                acc[f.id] = f.getValue();
                return acc;
            }, {}),

        /** The raw filter objects (for advanced use). */
        filters,
    };
}

// ── helpers ──────────────────────────────────────────────────────────

/**
 * Set DOM control values to match an initialSubset configuration.
 */
function setInitialValues(filters, initialSubset) {
    if (!initialSubset) return;

    filters.forEach((f) => {
        const val = initialSubset[f.id];
        if (val === undefined) return;

        const wrapper = select(f.element);

        if (f.type === 'categorical') {
            // Normalize to array.
            const arr = Array.isArray(val) ? val : [val];
            const selectEl = wrapper.select('select').node();
            if (selectEl) {
                const allowed = arr
                    .map(String)
                    .map((s) => s.toLowerCase());
                Array.from(selectEl.options).forEach((opt) => {
                    opt.selected = allowed.includes(
                        opt.value.toLowerCase()
                    );
                });
            }
        } else if (
            f.type === 'range' &&
            typeof val === 'object' &&
            !Array.isArray(val)
        ) {
            const minInput = wrapper
                .select(`#gsm-viz-filter--${f.id}--min`)
                .node();
            const maxInput = wrapper
                .select(`#gsm-viz-filter--${f.id}--max`)
                .node();
            if (minInput && val.min !== undefined) minInput.value = val.min;
            if (maxInput && val.max !== undefined) maxInput.value = val.max;
        } else if (f.type === 'range' && Array.isArray(val) && val.length === 2) {
            // Accept legacy [min, max] array syntax.
            const minInput = wrapper
                .select(`#gsm-viz-filter--${f.id}--min`)
                .node();
            const maxInput = wrapper
                .select(`#gsm-viz-filter--${f.id}--max`)
                .node();
            if (minInput) minInput.value = val[0];
            if (maxInput) maxInput.value = val[1];
        }
    });
}
