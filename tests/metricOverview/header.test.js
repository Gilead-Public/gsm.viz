/**
 * @jest-environment jsdom
 */

import {
    renderHeader,
    structureHeader,
} from '../../src/metricOverview/header.js';
import mergeSpec from '../../src/metricOverview/mergeSpec.js';

const metric = {
    MetricID: 'kri0006',
    Metric: 'Study Discontinuation Rate',
    Numerator: 'Subjects Discontinued - Study',
    Denominator: 'Enrolled Subjects',
};
const row = {
    MetricID: 'kri0006',
    GroupID: 'Study 01',
    Numerator: 3,
    Denominator: 1250,
    Metric: 0.0024,
};

describe('metricOverview structureHeader', () => {
    test('takes the name, percent and numerator / denominator from the inputs', () => {
        const header = structureHeader(row, metric, mergeSpec({}));

        expect(header).toMatchObject({
            state: 'ok',
            name: 'Study Discontinuation Rate',
            value: { text: '0.2%', available: true },
            numerator: {
                label: 'Subjects Discontinued - Study',
                text: '3',
            },
            denominator: { label: 'Enrolled Subjects', text: '1,250' },
        });
        expect(header.label).toBe(
            'Study Discontinuation Rate: 0.2%; Subjects Discontinued - Study: 3; Enrolled Subjects: 1,250'
        );
    });

    test('shows the metric value as given, not recalculated from the counts', () => {
        const header = structureHeader(
            { ...row, Metric: 0.5 },
            metric,
            mergeSpec({})
        );

        expect(header.value.text).toBe('50.0%');
    });

    test('ignores spec.fields, so the header always has the same parts', () => {
        const header = structureHeader(
            row,
            metric,
            mergeSpec({ fields: ['GroupID'] })
        );

        expect(header.value.field).toBe('Metric');
        expect(header.numerator.field).toBe('Numerator');
        expect(header.denominator.field).toBe('Denominator');
    });

    test('uses spec labels and formats', () => {
        const header = structureHeader(
            row,
            metric,
            mergeSpec({
                labels: { Metric: 'Discontinued', Denominator: 'Enrolled' },
                format: { Metric: '.2%' },
            })
        );

        expect(header.name).toBe('Discontinued');
        expect(header.value.text).toBe('0.24%');
        expect(header.denominator.label).toBe('Enrolled');
    });

    test('marks unavailable parts', () => {
        const header = structureHeader(
            { ...row, Metric: 'NA', Denominator: null },
            metric,
            mergeSpec({})
        );

        expect(header.state).toBe('ok');
        expect(header.value).toMatchObject({ text: '—', available: false });
        expect(header.denominator).toMatchObject({
            text: '—',
            available: false,
        });
        expect(header.label).toBe(
            'Study Discontinuation Rate: —; Subjects Discontinued - Study: 3; Enrolled Subjects: —'
        );
    });

    test('is empty without a row', () => {
        const header = structureHeader(
            null,
            metric,
            mergeSpec({ unavailable: { empty: 'No results' } })
        );

        expect(header).toMatchObject({
            state: 'empty',
            name: 'Study Discontinuation Rate',
            emptyText: 'No results',
            label: 'Study Discontinuation Rate: No results',
        });
    });
});

describe('metricOverview renderHeader', () => {
    test('renders the name, value and numerator / denominator', () => {
        const el = renderHeader(structureHeader(row, metric, mergeSpec({})));

        expect(el.className).toBe('gsm-metric-header');
        expect(el.dataset.state).toBe('ok');
        expect(el.textContent).toBe(
            'Study Discontinuation Rate 0.2% 3 / 1,250 Subjects Discontinued - Study / Enrolled Subjects'
        );
        expect(el.querySelector('.gsm-metric-header__name').textContent).toBe(
            'Study Discontinuation Rate'
        );
        expect(el.querySelector('.gsm-metric-header__value').textContent).toBe(
            '0.2%'
        );
        expect(
            el.querySelector('.gsm-metric-header__fraction').textContent
        ).toBe('3 / 1,250');
    });

    test('names the numerator and denominator in tooltips and the accessible label', () => {
        const el = renderHeader(structureHeader(row, metric, mergeSpec({})));

        expect(el.querySelector('.gsm-metric-header__numerator').title).toBe(
            'Subjects Discontinued - Study'
        );
        expect(el.querySelector('.gsm-metric-header__denominator').title).toBe(
            'Enrolled Subjects'
        );
        expect(el.getAttribute('role')).toBe('img');
        expect(el.getAttribute('aria-label')).toBe(
            'Study Discontinuation Rate: 0.2%; Subjects Discontinued - Study: 3; Enrolled Subjects: 1,250'
        );
    });

    test('shows the numerator and denominator labels while the header has focus', () => {
        const el = renderHeader(structureHeader(row, metric, mergeSpec({})));
        const labels = el.querySelector('.gsm-metric-header__labels');

        expect(el.getAttribute('tabindex')).toBe('0');
        expect(labels.textContent).toBe(
            'Subjects Discontinued - Study / Enrolled Subjects'
        );
        expect(labels.style.position).toBe('absolute');
        expect(labels.style.clip).toBe('rect(0px, 0px, 0px, 0px)');

        el.dispatchEvent(new FocusEvent('focus'));
        expect(labels.getAttribute('style') || '').toBe('');

        el.dispatchEvent(new FocusEvent('blur'));
        expect(labels.style.position).toBe('absolute');
        expect(labels.style.clip).toBe('rect(0px, 0px, 0px, 0px)');
    });

    test('flags unavailable parts for styling', () => {
        const el = renderHeader(
            structureHeader({ ...row, Numerator: 'NA' }, metric, mergeSpec({}))
        );
        const numerator = el.querySelector('.gsm-metric-header__numerator');

        expect(numerator.textContent).toBe('—');
        expect(numerator.dataset.state).toBe('unavailable');
        expect(
            el.querySelector('.gsm-metric-header__value').dataset.state
        ).toBeUndefined();
    });

    test('renders the empty state', () => {
        const el = renderHeader(structureHeader(null, metric, mergeSpec({})));

        expect(el.dataset.state).toBe('empty');
        expect(el.textContent).toBe('Study Discontinuation Rate No data');
        expect(el.querySelector('.gsm-metric-header__empty').textContent).toBe(
            'No data'
        );
        expect(el.querySelector('.gsm-metric-header__value')).toBeNull();
        expect(el.querySelector('.gsm-metric-header__labels')).toBeNull();
        expect(el.hasAttribute('tabindex')).toBe(false);
        expect(el.getAttribute('aria-label')).toBe(
            'Study Discontinuation Rate: No data'
        );
    });

    test('sets labels as text, not markup', () => {
        const el = renderHeader(
            structureHeader(
                row,
                { ...metric, Metric: '<b>Rate</b>' },
                mergeSpec({})
            )
        );

        expect(el.querySelector('b')).toBeNull();
        expect(el.querySelector('.gsm-metric-header__name').textContent).toBe(
            '<b>Rate</b>'
        );
    });
});
