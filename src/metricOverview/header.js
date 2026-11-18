import describeField from './describeField.js';
import makeElement from './makeElement.js';

const block = 'gsm-metric-header';

/**
 * The bar-chart header: metric name, percent, and numerator / denominator.
 * Exported separately so other widgets can reuse it.
 *
 * @param {(Object|null)} row - the results row, or null for the empty state
 * @param {Object} metric - the metric's Reporting_Metrics row
 * @param {Object} spec - merged spec; fields is ignored
 * @returns {Object} header model
 */
export function structureHeader(row, metric, spec) {
    const value = describeField('Metric', row ?? {}, metric, spec);
    const name = value.label;

    if (row === null) {
        const emptyText = spec.unavailable.empty;
        return {
            state: 'empty',
            name,
            emptyText,
            label: `${name}: ${emptyText}`,
        };
    }

    const numerator = describeField('Numerator', row, metric, spec);
    const denominator = describeField('Denominator', row, metric, spec);

    return {
        state: 'ok',
        name,
        value,
        numerator,
        denominator,
        label: [value, numerator, denominator]
            .map((part) => `${part.label}: ${part.text}`)
            .join('; '),
    };
}

function part(element, described, title) {
    const el = makeElement('span', `${block}__${element}`, described.text);
    if (title !== undefined) el.title = title;
    if (!described.available) el.dataset.state = 'unavailable';
    return el;
}

/**
 * Render a header model. Text is set as text content, never as markup.
 *
 * @param {Object} header - output of structureHeader
 * @returns {HTMLElement}
 */
export function renderHeader(header) {
    const el = makeElement('div', block);
    el.dataset.state = header.state;
    el.setAttribute('role', 'img');
    el.setAttribute('aria-label', header.label);
    el.append(makeElement('span', `${block}__name`, header.name), ' ');

    if (header.state === 'empty') {
        el.append(makeElement('span', `${block}__empty`, header.emptyText));
        return el;
    }

    const fraction = makeElement('span', `${block}__fraction`);
    fraction.append(
        part('numerator', header.numerator, header.numerator.label),
        ' / ',
        part('denominator', header.denominator, header.denominator.label)
    );
    el.append(part('value', header.value), ' ', fraction);

    return el;
}
