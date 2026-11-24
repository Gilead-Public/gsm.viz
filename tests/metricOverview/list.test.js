/**
 * @jest-environment jsdom
 */

import { renderList, structureList } from '../../src/metricOverview/list.js';
import mergeSpec from '../../src/metricOverview/mergeSpec.js';

const metric = {
    MetricID: 'kri0001',
    Metric: 'Adverse Event Rate',
    Numerator: 'Adverse Events',
    Denominator: 'Days on Study',
    Score: 'Adjusted Z-Score',
};
const row = {
    MetricID: 'kri0001',
    GroupID: 'Site 01',
    Numerator: 12,
    Denominator: 32947,
    Metric: 0.000364221,
    Score: 1.158221208,
    Flag: 0,
};

describe('metricOverview structureList', () => {
    test('describes the default fields in order', () => {
        const list = structureList(row, metric, mergeSpec({}));

        expect(list.state).toBe('ok');
        expect(list.name).toBe('Adverse Event Rate');
        expect(list.fields.map(({ label, text }) => [label, text])).toEqual([
            ['Adverse Event Rate', '0.0%'],
            ['Adverse Events', '12'],
            ['Days on Study', '32,947'],
        ]);
    });

    test('describes the spec fields in the spec order', () => {
        const list = structureList(
            row,
            metric,
            mergeSpec({ fields: ['Score', 'GroupID', 'Flag'] })
        );

        expect(list.fields.map(({ field }) => field)).toEqual([
            'Score',
            'GroupID',
            'Flag',
        ]);
        expect(list.fields.map(({ text }) => text)).toEqual([
            '1.16',
            'Site 01',
            '0',
        ]);
    });

    test('names the metric even when the list leaves out the metric value', () => {
        const list = structureList(
            row,
            metric,
            mergeSpec({ fields: ['Numerator'], labels: { Metric: 'AE rate' } })
        );

        expect(list.name).toBe('AE rate');
    });

    test('is empty without a row', () => {
        expect(structureList(null, metric, mergeSpec({}))).toEqual({
            state: 'empty',
            name: 'Adverse Event Rate',
            emptyText: 'No data',
            fields: [],
        });
    });
});

describe('metricOverview renderList', () => {
    test('renders a description list of labels and values', () => {
        const el = renderList(structureList(row, metric, mergeSpec({})));
        const items = [...el.querySelectorAll('.gsm-metric-overview__field')];

        expect(el.tagName).toBe('DL');
        expect(el.className).toBe('gsm-metric-overview__fields');
        expect(items.map((item) => item.dataset.field)).toEqual([
            'Metric',
            'Numerator',
            'Denominator',
        ]);
        expect(
            items.map((item) => [
                item.querySelector('dt.gsm-metric-overview__label').textContent,
                item.querySelector('dd.gsm-metric-overview__value').textContent,
            ])
        ).toEqual([
            ['Adverse Event Rate', '0.0%'],
            ['Adverse Events', '12'],
            ['Days on Study', '32,947'],
        ]);
    });

    test('flags unavailable values for styling', () => {
        const el = renderList(
            structureList({ ...row, Numerator: null }, metric, mergeSpec({}))
        );

        expect(el.querySelector('[data-field="Numerator"]').dataset.state).toBe(
            'unavailable'
        );
        expect(
            el.querySelector('[data-field="Numerator"] dd').textContent
        ).toBe('—');
        expect(
            el.querySelector('[data-field="Metric"]').dataset.state
        ).toBeUndefined();
    });

    test('renders the empty state as a message', () => {
        const el = renderList(structureList(null, metric, mergeSpec({})));

        expect(el.tagName).toBe('P');
        expect(el.className).toBe('gsm-metric-overview__empty');
        expect(el.textContent).toBe('No data');
    });

    test('sets labels as text, not markup', () => {
        const el = renderList(
            structureList(
                row,
                { ...metric, Numerator: '<i>Events</i>' },
                mergeSpec({})
            )
        );

        expect(el.querySelector('i')).toBeNull();
        expect(
            el.querySelector('[data-field="Numerator"] dt').textContent
        ).toBe('<i>Events</i>');
    });
});
