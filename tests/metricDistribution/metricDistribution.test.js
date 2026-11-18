/**
 * @jest-environment jsdom
 */

import metricDistribution from '../../src/metricDistribution.js';
import gsmViz from '../../src/main.js';
import exampleResults from '../../examples/data/results.json';

const metric = {
    MetricID: 'kri0006',
    Metric: 'Study Discontinuation Rate',
    Numerator: 'Subjects Discontinued - Study',
    Denominator: 'Enrolled Subjects',
};
const result = {
    GroupLevel: 'Study',
    GroupID: 'AA-AA-000-0000',
    MetricID: 'kri0006',
    Numerator: 10,
    Denominator: 40,
    Metric: 0.25,
};

function row(Source, Variable, Category, Count, Total) {
    return {
        GroupLevel: 'Study',
        GroupID: 'AA-AA-000-0000',
        MetricID: 'kri0006',
        Source,
        Variable,
        Category,
        Count,
        Participants: Count,
        Total,
        Percent: Count / Total,
    };
}

const distributions = [
    row('Denominator', 'disposition', 'Ongoing', 30, 40),
    row('Denominator', 'disposition', 'Discontinued', 10, 40),
    row('Numerator', 'compreas', 'Death', 4, 10),
    row('Numerator', 'compreas', 'Lost to Follow-Up', 6, 10),
];

describe('metricDistribution', () => {
    let container;

    beforeEach(() => {
        container = document.createElement('div');
        container.id = 'distribution';
        document.body.appendChild(container);
    });

    afterEach(() => {
        container.remove();
    });

    test('is exported from the library entry point', () => {
        expect(gsmViz.metricDistribution).toBe(metricDistribution);
    });

    test('renders into a DOM node and returns the widget root', () => {
        const root = metricDistribution(container, {
            distributions,
            metric,
            result,
        });
        expect(root.parentNode).toBe(container);
        expect(root.classList.contains('metric-distribution')).toBe(true);
        expect(root.dataset.state).toBe('ok');
    });

    test('renders into an element found by CSS selector', () => {
        const root = metricDistribution('#distribution', {
            distributions,
            metric,
        });
        expect(root.parentNode).toBe(container);
    });

    test('throws when the selector matches nothing', () => {
        expect(() =>
            metricDistribution('#nowhere', { distributions, metric })
        ).toThrow(
            'metricDistribution: could not find element matching "#nowhere"'
        );
    });

    test('validates data and spec before rendering', () => {
        expect(() => metricDistribution(container, { distributions })).toThrow(
            'data.metric must be a plain object'
        );
        expect(() =>
            metricDistribution(
                container,
                { distributions, metric },
                { topN: -1 }
            )
        ).toThrow('spec.topN must be a positive integer');
        expect(container.children).toHaveLength(0);
    });

    test('names the widget for assistive technology', () => {
        const root = metricDistribution(container, { distributions, metric });
        expect(root.getAttribute('role')).toBe('group');
        expect(root.getAttribute('aria-label')).toBe(
            'Study Discontinuation Rate breakdowns'
        );
    });

    test('puts the header first, then the sections in display order', () => {
        const root = metricDistribution(container, {
            distributions,
            metric,
            result,
        });
        const children = [...root.children].map((child) => child.className);
        expect(children).toEqual([
            'metric-distribution--header',
            'metric-distribution--section',
            'metric-distribution--section',
        ]);
        expect(
            [...root.querySelectorAll('.metric-distribution--section')].map(
                (section) => section.dataset.variable
            )
        ).toEqual(['compreas', 'disposition']);
    });

    test('applies the spec to the rendered sections', () => {
        const root = metricDistribution(
            container,
            { distributions, metric, result },
            {
                sections: [
                    {
                        source: 'Numerator',
                        variable: 'compreas',
                        title: 'Reasons for study discontinuation',
                        values: ['percent', 'percentOfDenominator'],
                        labels: {
                            percent: '% Discontinued',
                            percentOfDenominator: '% Enrolled',
                        },
                    },
                ],
            }
        );
        const sections = root.querySelectorAll('.metric-distribution--section');
        expect(sections).toHaveLength(1);
        expect(
            [...sections[0].querySelectorAll('thead th')].map(
                (th) => th.textContent
            )
        ).toEqual(['', '% Discontinued', '% Enrolled']);
        expect(
            [...sections[0].querySelectorAll('tbody tr')].map((tr) =>
                [...tr.children].map((cell) => cell.textContent)
            )
        ).toEqual([
            ['Lost to Follow-Up', '60.0%', '15.0%'],
            ['Death', '40.0%', '10.0%'],
        ]);
    });

    test('shows one value per bar by default: counts for reasons, a named percentage for statuses', () => {
        const root = metricDistribution(container, {
            distributions,
            metric,
            result,
        });
        const shown = [
            ...root.querySelectorAll('.metric-distribution--section'),
        ].map((section) => ({
            head: [...section.querySelectorAll('thead th')].map(
                (th) => th.textContent
            ),
            rows: [...section.querySelectorAll('tbody tr')].map((tr) =>
                [...tr.children].map((cell) => cell.textContent)
            ),
        }));
        expect(shown).toEqual([
            {
                head: ['', 'n'],
                rows: [
                    ['Lost to Follow-Up', '6'],
                    ['Death', '4'],
                ],
            },
            {
                head: ['', '% of Enrolled Subjects'],
                rows: [
                    ['Ongoing', '75.0%'],
                    ['Discontinued', '25.0%'],
                ],
            },
        ]);
    });

    test('accepts a Reporting_Results row as the examples publish it, with numeric strings', () => {
        const published = exampleResults.find(
            (row) => row.MetricID === 'kri0006' && Number(row.Denominator) > 1
        );
        const scope = {
            StudyID: published.StudyID,
            SnapshotDate: published.SnapshotDate,
            GroupLevel: published.GroupLevel,
            GroupID: published.GroupID,
            MetricID: published.MetricID,
        };
        const total = Number(published.Denominator);
        const root = metricDistribution(
            container,
            {
                distributions: [
                    {
                        ...scope,
                        Source: 'Denominator',
                        Variable: 'disposition',
                        Category: 'Ongoing',
                        Count: 1,
                        Total: total,
                        Percent: 1 / total,
                    },
                ],
                metric,
                result: published,
            },
            { values: ['percentOfDenominator'] }
        );
        expect(typeof published.Denominator).toBe('string');
        expect(
            root.querySelector('.metric-distribution--fraction').textContent
        ).toBe(
            `${Number(published.Numerator).toLocaleString(
                'en-US'
            )} / ${total.toLocaleString('en-US')}`
        );
        expect(
            root.querySelector('.metric-distribution--percent').textContent
        ).toBe(`${(Number(published.Metric) * 100).toFixed(1)}%`);
        expect(root.querySelector('tbody td').textContent).toBe(
            `${((1 / total) * 100).toFixed(1)}%`
        );
    });

    test('shows unavailable result values as unavailable, not as zero', () => {
        const root = metricDistribution(container, {
            distributions,
            metric,
            result: {
                ...result,
                Numerator: 'NA',
                Denominator: '',
                Metric: 'NA',
            },
        });
        expect(
            root.querySelector('.metric-distribution--percent').textContent
        ).toBe('—');
        expect(
            root.querySelector('.metric-distribution--fraction').textContent
        ).toBe('— / —');
    });

    test('shows the header and a message in the missing state', () => {
        const root = metricDistribution(container, { metric, result });
        expect(root.dataset.state).toBe('missing');
        expect(
            root.querySelector('.metric-distribution--header')
        ).not.toBeNull();
        expect(root.querySelector('.metric-distribution--section')).toBeNull();
        expect(
            root.querySelector('.metric-distribution--message').textContent
        ).toBe('Breakdowns are not available for this metric.');
    });

    test('shows the header and a message in the empty state', () => {
        const root = metricDistribution(container, {
            distributions: [],
            metric,
            result,
        });
        expect(root.dataset.state).toBe('empty');
        expect(
            root.querySelector('.metric-distribution--header')
        ).not.toBeNull();
        expect(
            root.querySelector('.metric-distribution--message').textContent
        ).toBe('There are no records to break down.');
    });

    test('replaces its previous render and leaves other content alone', () => {
        const other = document.createElement('p');
        container.appendChild(other);
        metricDistribution(container, { distributions, metric });
        const root = metricDistribution(container, {
            distributions: [],
            metric,
        });
        expect(container.querySelectorAll('.metric-distribution')).toHaveLength(
            1
        );
        expect(container.querySelector('.metric-distribution')).toBe(root);
        expect(other.parentNode).toBe(container);
    });

    test('shows no "Numerator", "Denominator" or total row with default labels', () => {
        const root = metricDistribution(container, {
            distributions,
            metric,
            result,
        });
        expect(root.textContent).not.toMatch(/numerator|denominator/i);
        root.querySelectorAll('[title], [aria-label]').forEach((el) => {
            expect(el.getAttribute('title') ?? '').not.toMatch(
                /numerator|denominator/i
            );
            expect(el.getAttribute('aria-label') ?? '').not.toMatch(
                /numerator|denominator/i
            );
        });
        expect(root.querySelector('tfoot')).toBeNull();
    });
});
