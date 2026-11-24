import describeField from './describeField.js';
import makeElement from './makeElement.js';

const block = 'gsm-metric-overview';

/**
 * The list layout: one label and value per spec field, in spec order.
 *
 * @param {(Object|null)} row - the results row, or null for the empty state
 * @param {Object} metric - the metric's Reporting_Metrics row
 * @param {Object} spec - merged spec
 * @returns {Object} list model
 */
export function structureList(row, metric, spec) {
    const name = describeField('Metric', {}, metric, spec).label;

    if (row === null) {
        return {
            state: 'empty',
            name,
            emptyText: spec.unavailable.empty,
            fields: [],
        };
    }

    return {
        state: 'ok',
        name,
        fields: spec.fields.map((field) =>
            describeField(field, row, metric, spec)
        ),
    };
}

/**
 * Render a list model as a description list, or the empty message.
 *
 * @param {Object} list - output of structureList
 * @returns {HTMLElement}
 */
export function renderList(list) {
    if (list.state === 'empty') {
        return makeElement('p', `${block}__empty`, list.emptyText);
    }

    const dl = makeElement('dl', `${block}__fields`);
    list.fields.forEach(({ field, label, text, available }) => {
        const item = makeElement('div', `${block}__field`);
        item.dataset.field = field;
        if (!available) item.dataset.state = 'unavailable';
        item.append(
            makeElement('dt', `${block}__label`, label),
            makeElement('dd', `${block}__value`, text)
        );
        dl.append(item);
    });

    return dl;
}
