/**
 * @jest-environment jsdom
 */

import metricOverview from '../../src/metricOverview.js';
import gsmViz from '../../src/main.js';

const metric = {
    MetricID: 'qtl0006',
    GroupLevel: 'Study',
    Metric: 'Study Discontinuation Rate',
    Numerator: 'Subjects Discontinued - Study',
    Denominator: 'Total Subjects',
};
const results = [
    {
        StudyID: 'Study 01',
        GroupLevel: 'Study',
        GroupID: 'Study 01',
        MetricID: 'qtl0006',
        Numerator: '1',
        Denominator: '40',
        Metric: '0.025',
        Score: '0.000632745',
        Flag: '0',
        SnapshotDate: '2024-03-01',
    },
    {
        StudyID: 'Study 01',
        GroupLevel: 'Study',
        GroupID: 'Study 01',
        MetricID: 'qtl0006',
        Numerator: '1',
        Denominator: '19',
        Metric: '0.052631579',
        Score: '0.001331629',
        Flag: '0',
        SnapshotDate: '2024-02-01',
    },
];
const data = { results, metric };
const latest = { snapshotDate: '2024-03-01' };

const values = (root) =>
    [...root.querySelectorAll('.gsm-metric-overview__field')].map((item) => [
        item.querySelector('dt').textContent,
        item.querySelector('dd').textContent,
    ]);

describe('metricOverview entry point', () => {
    let container;

    beforeEach(() => {
        container = document.createElement('div');
        container.id = 'overview';
        document.body.appendChild(container);
    });

    afterEach(() => {
        document.body.innerHTML = '';
    });

    test('is exported on the gsmViz object', () => {
        expect(gsmViz.metricOverview).toBe(metricOverview);
    });

    test('renders the default list into an element and returns its root', () => {
        const root = metricOverview(container, data, latest);

        expect(root.parentNode).toBe(container);
        expect(root.className).toBe('gsm-metric-overview');
        expect(root.dataset.layout).toBe('list');
        expect(root.dataset.state).toBe('ok');
        expect(root.getAttribute('role')).toBe('group');
        expect(root.getAttribute('aria-label')).toBe(
            'Study Discontinuation Rate'
        );
        expect(values(root)).toEqual([
            ['Study Discontinuation Rate', '2.5%'],
            ['Subjects Discontinued - Study', '1'],
            ['Total Subjects', '40'],
        ]);
    });

    test('accepts a CSS selector', () => {
        const root = metricOverview('#overview', data, latest);

        expect(root.parentNode).toBe(container);
    });

    test('throws when the selector matches nothing', () => {
        expect(() => metricOverview('#missing', data, latest)).toThrow(
            'metricOverview: could not find element matching "#missing"'
        );
    });

    test('renders into the body by default and accepts an omitted spec', () => {
        const root = metricOverview(undefined, {
            results: [results[0]],
            metric,
        });

        expect(root.parentNode).toBe(document.body);
        expect(values(root)[0]).toEqual(['Study Discontinuation Rate', '2.5%']);
    });

    test('validates before rendering anything', () => {
        expect(() =>
            metricOverview(container, data, { layout: 'grid' })
        ).toThrow("spec.layout must be 'list' or 'header'");
        expect(() => metricOverview(container, data, {})).toThrow(
            '2 results rows match'
        );
        expect(container.childNodes).toHaveLength(0);
    });

    test('renders the header layout', () => {
        const root = metricOverview(container, data, {
            ...latest,
            layout: 'header',
        });
        const header = root.querySelector('.gsm-metric-header');

        expect(root.dataset.layout).toBe('header');
        expect(root.hasAttribute('role')).toBe(false);
        expect(root.children).toHaveLength(1);
        expect(header.textContent).toBe(
            'Study Discontinuation Rate 2.5% 1 / 40'
        );
    });

    test.each(['list', 'header'])(
        'renders the empty state in the %s layout when no row matches',
        (layout) => {
            const root = metricOverview(container, data, {
                snapshotDate: '2023-01-01',
                layout,
                unavailable: { empty: 'No results for this snapshot' },
            });

            expect(root.dataset.state).toBe('empty');
            expect(root.textContent).toContain('No results for this snapshot');
        }
    );

    test('shows the row of the requested study and group level when group IDs overlap', () => {
        const shared = {
            ...results[0],
            GroupID: 'AA-1',
            Numerator: '3',
            Denominator: '30',
            Metric: '0.1',
        };
        const overlapping = [
            { ...shared, StudyID: 'AA-1', GroupLevel: 'Study' },
            { ...shared, StudyID: 'AA-1', GroupLevel: 'Site', Metric: '0.2' },
            { ...shared, StudyID: 'BB-2', GroupLevel: 'Site', Metric: '0.3' },
        ];
        const show = (spec) =>
            metricOverview(
                container,
                { results: overlapping, metric },
                { ...latest, groupId: 'AA-1', layout: 'header', ...spec }
            ).querySelector('.gsm-metric-header__value').textContent;

        expect(show({ studyId: 'AA-1', groupLevel: 'Study' })).toBe('10.0%');
        expect(show({ studyId: 'AA-1', groupLevel: 'Site' })).toBe('20.0%');
        expect(show({ studyId: 'BB-2', groupLevel: 'Site' })).toBe('30.0%');
        expect(() => show({ groupLevel: 'Site' })).toThrow(
            '2 results rows match'
        );
    });

    test('renders the empty state when there are no results', () => {
        const root = metricOverview(container, { results: [], metric });

        expect(root.dataset.state).toBe('empty');
        expect(root.textContent).toBe('No data');
        expect(root.getAttribute('aria-label')).toBe(
            'Study Discontinuation Rate'
        );
    });

    test('replaces its previous overview and leaves other content alone', () => {
        const note = document.createElement('p');
        container.append(note);
        metricOverview(container, data, latest);
        const root = metricOverview(container, data, {
            snapshotDate: '2024-02-01',
            layout: 'header',
        });

        expect(container.querySelectorAll('.gsm-metric-overview')).toHaveLength(
            1
        );
        expect(container.firstChild).toBe(note);
        expect(container.lastChild).toBe(root);
        expect(root.textContent).toBe('Study Discontinuation Rate 5.3% 1 / 19');
    });

    test('does not change its inputs', () => {
        const input = JSON.parse(JSON.stringify(data));
        const spec = { ...latest, fields: ['Metric'], labels: { Metric: 'x' } };
        const specCopy = JSON.parse(JSON.stringify(spec));
        metricOverview(container, input, spec);

        expect(input).toEqual(data);
        expect(spec).toEqual(specCopy);
    });
});
