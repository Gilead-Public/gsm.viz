import { select } from 'd3';

/**
 * Add a single filter control to the filter container.
 *
 * @param {d3.selection} container     - d3 selection wrapping the filter container element
 * @param {Object}       filterDef     - filter definition
 * @param {string}       filterDef.id  - unique filter identifier (e.g. 'anyFlag', 'country')
 * @param {string}       filterDef.label   - display label
 * @param {string}       filterDef.type    - 'categorical' | 'range'
 * @param {Array}        [filterDef.options]  - for categorical: array of unique option strings
 * @param {Object}       [filterDef.domain]   - for range: { min, max }
 * @param {string}       rangeControl  - 'inputs' or 'dualRange'
 *
 * @returns {Object} { element, getValue }
 *   element  — the wrapper DOM node for the control
 *   getValue — function that returns the current filter value
 */
export default function addFilter(container, filterDef, rangeControl) {
    const wrapper = container
        .append('fieldset')
        .attr('class', 'gsm-viz-filter')
        .attr('data-filter-id', filterDef.id);

    wrapper.append('legend').text(filterDef.label);

    if (filterDef.type === 'categorical') {
        return addCategoricalFilter(wrapper, filterDef);
    }

    if (filterDef.type === 'range') {
        return rangeControl === 'dualRange'
            ? addDualRangeFilter(wrapper, filterDef)
            : addNumericInputFilter(wrapper, filterDef);
    }

    // Fallback — should not happen.
    return { element: wrapper.node(), getValue: () => null };
}

// ── Categorical ──────────────────────────────────────────────────────

function addCategoricalFilter(wrapper, filterDef) {
    const selectEl = wrapper
        .append('select')
        .attr('id', `gsm-viz-filter--${filterDef.id}`)
        .attr('multiple', true);

    // "All" option sits first.
    selectEl
        .append('option')
        .attr('value', 'all')
        .property('selected', true)
        .text('All');

    (filterDef.options || []).forEach((opt) => {
        selectEl.append('option').attr('value', opt).text(opt);
    });

    const getValue = () => {
        const selected = Array.from(selectEl.node().selectedOptions).map(
            (o) => o.value
        );

        // When "All" is among the selected options treat as unfiltered.
        if (selected.includes('all') || selected.length === 0) {
            return null;
        }

        return selected;
    };

    return { element: wrapper.node(), getValue };
}

// ── Numeric inputs (default range control) ───────────────────────────

function addNumericInputFilter(wrapper, filterDef) {
    const domain = filterDef.domain || { min: 0, max: 100 };

    const minLabel = wrapper.append('label').text('Min ');
    const minInput = minLabel
        .append('input')
        .attr('type', 'number')
        .attr('id', `gsm-viz-filter--${filterDef.id}--min`)
        .attr('min', domain.min)
        .attr('max', domain.max)
        .attr('step', 'any')
        .property('value', domain.min);

    const maxLabel = wrapper.append('label').text(' Max ');
    const maxInput = maxLabel
        .append('input')
        .attr('type', 'number')
        .attr('id', `gsm-viz-filter--${filterDef.id}--max`)
        .attr('min', domain.min)
        .attr('max', domain.max)
        .attr('step', 'any')
        .property('value', domain.max);

    const getValue = () => {
        const min = parseFloat(minInput.property('value'));
        const max = parseFloat(maxInput.property('value'));

        // Treat full-range selection as "no filter".
        if (min <= domain.min && max >= domain.max) {
            return null;
        }

        return {
            min: isNaN(min) ? domain.min : min,
            max: isNaN(max) ? domain.max : max,
        };
    };

    return { element: wrapper.node(), getValue };
}

// ── Dual range sliders (optional) ────────────────────────────────────

function addDualRangeFilter(wrapper, filterDef) {
    const domain = filterDef.domain || { min: 0, max: 100 };

    const minLabel = wrapper.append('label').text('Min ');
    const minInput = minLabel
        .append('input')
        .attr('type', 'range')
        .attr('id', `gsm-viz-filter--${filterDef.id}--min`)
        .attr('min', domain.min)
        .attr('max', domain.max)
        .attr('step', 'any')
        .property('value', domain.min);

    const minDisplay = wrapper.append('span').attr('class', 'gsm-viz-filter--value').text(domain.min);

    const maxLabel = wrapper.append('label').text(' Max ');
    const maxInput = maxLabel
        .append('input')
        .attr('type', 'range')
        .attr('id', `gsm-viz-filter--${filterDef.id}--max`)
        .attr('min', domain.min)
        .attr('max', domain.max)
        .attr('step', 'any')
        .property('value', domain.max);

    const maxDisplay = wrapper.append('span').attr('class', 'gsm-viz-filter--value').text(domain.max);

    // Clamp so min <= max.
    minInput.on('input.clamp', function () {
        const v = parseFloat(this.value);
        const curMax = parseFloat(maxInput.property('value'));
        if (v > curMax) this.value = curMax;
        minDisplay.text(this.value);
    });
    maxInput.on('input.clamp', function () {
        const v = parseFloat(this.value);
        const curMin = parseFloat(minInput.property('value'));
        if (v < curMin) this.value = curMin;
        maxDisplay.text(this.value);
    });

    const getValue = () => {
        const min = parseFloat(minInput.property('value'));
        const max = parseFloat(maxInput.property('value'));

        if (min <= domain.min && max >= domain.max) {
            return null;
        }

        return {
            min: isNaN(min) ? domain.min : min,
            max: isNaN(max) ? domain.max : max,
        };
    };

    return { element: wrapper.node(), getValue };
}
