import { select } from 'd3';

import validateData from './metricDistribution/validateData.js';
import validateSpec from './metricDistribution/validateSpec.js';
import mergeSpec from './metricDistribution/mergeSpec.js';
import normalizeResult from './metricDistribution/normalizeResult.js';
import structureData from './metricDistribution/structureData.js';
import makeHeader from './metricDistribution/makeHeader.js';
import makeSection, {
    appendMessage,
} from './metricDistribution/makeSection.js';
import { MESSAGES, TEXT_COLORS } from './metricDistribution/defaults.js';

const ROOT_CLASS = 'metric-distribution';

function resolveElement(element) {
    if (typeof element !== 'string') return element;
    const el = document.querySelector(element);
    if (!el) {
        throw new Error(
            `metricDistribution: could not find element matching "${element}"`
        );
    }
    return el;
}

/**
 * Display one metric's categorical breakdowns (Reporting_Distributions) as
 * horizontal bars, under the metric overview header (the metric's name,
 * value, and numerator / denominator). Nothing is aggregated: the rows must already be
 * one metric at one group.
 *
 * @param {(Node|string)} element - DOM element or CSS selector
 * @param {Object} data - widget data
 * @param {Array} [data.distributions] - Reporting_Distributions rows; absent
 *  for the missing state
 * @param {Object} data.metric - the metric's Reporting_Metrics row
 * @param {Object} [data.result] - the metric's Reporting_Results row for the
 *  same group
 * @param {Object} [spec] - widget specification
 *
 * @returns {Node} the widget root element
 */
export default function metricDistribution(
    element = 'body',
    data = {},
    spec = {}
) {
    validateData(data);
    validateSpec(spec);

    const el = resolveElement(element);
    const display = { ...data, result: normalizeResult(data.result) };
    const header = makeHeader(display, spec.header);
    const model = structureData(display, mergeSpec(spec));

    [...el.children]
        .filter((child) => child.classList.contains(ROOT_CLASS))
        .forEach((child) => child.remove());

    const root = select(el)
        .append('div')
        .classed(ROOT_CLASS, true)
        .attr('role', 'group')
        .attr('aria-label', `${data.metric.Metric} breakdowns`)
        .attr('data-state', model.state)
        .style('display', 'flex')
        .style('flex-direction', 'column')
        .style('gap', '12px')
        .style('color', TEXT_COLORS.primary)
        .node();

    root.append(header);

    if (model.state === 'ok') {
        model.sections.forEach((section) => makeSection(root, section));
    } else {
        appendMessage(select(root), MESSAGES[model.state]);
    }

    return root;
}
