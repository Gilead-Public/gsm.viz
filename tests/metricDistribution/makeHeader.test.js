/**
 * @jest-environment jsdom
 */

import makeHeader from '../../src/metricDistribution/makeHeader.js';

const metric = {
    MetricID: 'kri0006',
    Metric: 'Study Discontinuation Rate',
    Numerator: 'Subjects Discontinued - Study',
    Denominator: 'Enrolled Subjects',
};
const result = { Numerator: 1234, Denominator: 5000, Metric: 0.2468 };

const part = (header, name) =>
    header.querySelector(`.gsm-metric-header__${name}`);
const text = (header, name) => part(header, name)?.textContent;

describe('makeHeader', () => {
    test('returns the metric overview in its header layout', () => {
        const header = makeHeader({ metric, result });
        expect(header.className).toBe('gsm-metric-overview');
        expect(header.dataset.layout).toBe('header');
        expect(header.dataset.state).toBe('ok');
    });

    test('shows the metric name, its percent, and numerator / denominator', () => {
        const header = makeHeader({ metric, result });
        expect(text(header, 'name')).toBe('Study Discontinuation Rate');
        expect(text(header, 'value')).toBe('24.7%');
        expect(text(header, 'fraction')).toBe('1,234 / 5,000');
    });

    test('displays the result’s metric value rather than recalculating it', () => {
        const header = makeHeader({
            metric,
            result: { Numerator: 1, Denominator: 4, Metric: 0.3 },
        });
        expect(text(header, 'value')).toBe('30.0%');
    });

    test('names the counts with the metric’s business labels on hover', () => {
        const header = makeHeader({ metric, result });
        expect(part(header, 'numerator').title).toBe(
            'Subjects Discontinued - Study'
        );
        expect(part(header, 'denominator').title).toBe('Enrolled Subjects');
    });

    test('shows dashes for unavailable result values', () => {
        const header = makeHeader({
            metric,
            result: { Numerator: 0, Denominator: 0, Metric: null },
        });
        expect(text(header, 'value')).toBe('—');
        expect(text(header, 'fraction')).toBe('0 / 0');
    });

    test('shows the name and the empty text without a result row', () => {
        [undefined, null].forEach((absent) => {
            const header = makeHeader({ metric, result: absent });
            expect(header.dataset.state).toBe('empty');
            expect(text(header, 'name')).toBe('Study Discontinuation Rate');
            expect(text(header, 'empty')).toBe('No data');
            expect(part(header, 'value')).toBeNull();
        });
    });

    test('takes labels, formats, and unavailable text from the header spec', () => {
        const header = makeHeader(
            { metric, result: { ...result, Denominator: null } },
            {
                labels: { Numerator: 'Discontinued' },
                format: { Metric: ',.3f' },
                unavailable: { value: 'n/a' },
            }
        );
        expect(text(header, 'value')).toBe('0.247');
        expect(part(header, 'numerator').title).toBe('Discontinued');
        expect(part(header, 'denominator').title).toBe('Enrolled Subjects');
        expect(text(header, 'denominator')).toBe('n/a');
    });

    test('never shows the words "Numerator" or "Denominator" when the metric row has no labels', () => {
        [
            { Metric: 'Study Discontinuation Rate' },
            { ...metric, Numerator: 'NA', Denominator: ' ' },
        ].forEach((unlabelled) => {
            const header = makeHeader({ metric: unlabelled, result });
            expect(
                [
                    header.textContent,
                    header.firstElementChild.getAttribute('aria-label'),
                ].join(' ')
            ).not.toMatch(/numerator|denominator/i);
            expect(part(header, 'numerator').title).toBe('n');
            expect(part(header, 'denominator').title).toBe('N');
        });
    });

    test('prefers a label from the header spec to the stand-in', () => {
        const header = makeHeader(
            { metric: { Metric: 'Study Discontinuation Rate' }, result },
            { labels: { Denominator: 'Enrolled' } }
        );
        expect(part(header, 'numerator').title).toBe('n');
        expect(part(header, 'denominator').title).toBe('Enrolled');
    });

    test('rejects header labels that are not a plain object, with or without stand-ins', () => {
        [metric, { Metric: 'Study Discontinuation Rate' }].forEach((row) => {
            [null, [], 42, 'Discontinued'].forEach((labels) => {
                expect(() =>
                    makeHeader({ metric: row, result }, { labels })
                ).toThrow('spec.header.labels must be a plain object');
            });
        });
    });

    test('reports an invalid header option under spec.header', () => {
        expect(() =>
            makeHeader({ metric, result }, { format: { Metric: 'zz' } })
        ).toThrow('spec.header.format.Metric must be a d3-format specifier');
    });
});
