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

function render(data) {
    const root = document.createElement('div');
    makeHeader(root, data);
    return root.querySelector('.metric-distribution--header');
}

const text = (header, name) =>
    header.querySelector(`.metric-distribution--${name}`)?.textContent;

describe('makeHeader', () => {
    test('shows the metric name, its percent, and numerator / denominator', () => {
        const header = render({ metric, result });
        expect(text(header, 'name')).toBe('Study Discontinuation Rate');
        expect(text(header, 'percent')).toBe('24.7%');
        expect(text(header, 'fraction')).toBe('1,234 / 5,000');
    });

    test('displays the result’s metric value rather than recalculating it', () => {
        const header = render({
            metric,
            result: { Numerator: 1, Denominator: 4, Metric: 0.3 },
        });
        expect(text(header, 'percent')).toBe('30.0%');
    });

    test('names the counts with the metric’s business labels on hover', () => {
        const header = render({ metric, result });
        expect(
            header
                .querySelector('.metric-distribution--fraction')
                .getAttribute('title')
        ).toBe(
            'Subjects Discontinued - Study: 1,234; Enrolled Subjects: 5,000'
        );
    });

    test('shows dashes for unavailable result values', () => {
        const header = render({
            metric,
            result: { Numerator: 0, Denominator: 0, Metric: null },
        });
        expect(text(header, 'percent')).toBe('—');
        expect(text(header, 'fraction')).toBe('0 / 0');
    });

    test('shows the name alone without a result row', () => {
        const header = render({ metric });
        expect(text(header, 'name')).toBe('Study Discontinuation Rate');
        expect(
            header.querySelector('.metric-distribution--percent')
        ).toBeNull();
        expect(
            header.querySelector('.metric-distribution--fraction')
        ).toBeNull();
    });

    test('never shows the words "Numerator" or "Denominator"', () => {
        const header = render({
            metric: { Metric: 'Study Discontinuation Rate' },
            result,
        });
        expect(header.outerHTML).not.toMatch(/numerator|denominator/i);
    });
});
