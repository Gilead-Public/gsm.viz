import validateSpec from './metricOverview/validateSpec.js';
import mergeSpec from './metricOverview/mergeSpec.js';
import selectRow from './metricOverview/selectRow.js';
import { renderHeader, structureHeader } from './metricOverview/header.js';
import { renderList, structureList } from './metricOverview/list.js';
import makeElement from './metricOverview/makeElement.js';

const block = 'gsm-metric-overview';

/**
 * Render one metric's overview for one group: its value, numerator and
 * denominator with the labels of its Reporting_Metrics row. Values are shown
 * as given, never recalculated.
 *
 * @param {(Node|string)} element - DOM element or CSS selector
 * @param {Object} data - inputs
 * @param {Array}  data.results - one metric's Reporting_Results rows
 * @param {Object} data.metric - the metric's Reporting_Metrics row
 * @param {Object} [spec] - overview specification
 * @param {(string|number)} [spec.studyId] - StudyID of the row to show
 * @param {(string|number)} [spec.groupLevel] - GroupLevel of the row to show
 * @param {(string|number)} [spec.groupId] - GroupID of the row to show
 * @param {(string|number)} [spec.snapshotDate] - SnapshotDate of the row to show
 * @param {string} [spec.layout='list'] - 'list' or 'header'
 * @param {Array}  [spec.fields] - Reporting_Results columns to list
 * @param {Object} [spec.labels] - label per column
 * @param {Object} [spec.format] - d3-format specifier per column
 * @param {Object} [spec.unavailable] - text for unavailable values and the empty state
 *
 * @returns {HTMLElement} root element of the overview
 */
export default function metricOverview(element = 'body', data, spec = {}) {
    validateSpec(data, spec);

    let el = element;
    if (typeof el === 'string') {
        el = document.querySelector(el);
        if (!el) {
            throw new Error(
                `metricOverview: could not find element matching "${element}"`
            );
        }
    }

    const merged = mergeSpec(spec);
    const row = selectRow(data.results, merged);

    const root = makeElement('div', block);
    root.dataset.layout = merged.layout;

    if (merged.layout === 'header') {
        const header = structureHeader(row, data.metric, merged);
        root.dataset.state = header.state;
        root.append(renderHeader(header));
    } else {
        const list = structureList(row, data.metric, merged);
        root.dataset.state = list.state;
        root.setAttribute('role', 'group');
        root.setAttribute('aria-label', list.name);
        root.append(renderList(list));
    }

    const previous = [...el.children].find((child) =>
        child.classList.contains(block)
    );
    if (previous) previous.replaceWith(root);
    else el.append(root);

    return root;
}
