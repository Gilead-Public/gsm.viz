/**
 * @jest-environment jsdom
 */

import makeSection from '../../src/metricDistribution/makeSection.js';

function model(overrides = {}) {
    return {
        source: 'Numerator',
        variable: 'compreas',
        title: 'Reasons for study discontinuation',
        total: 40,
        empty: false,
        columns: [
            { value: 'count', label: 'n' },
            { value: 'percent', label: '% Discontinued' },
            { value: 'percentOfDenominator', label: '% Enrolled' },
        ],
        bars: [
            {
                kind: 'category',
                label: 'Withdrawal by Participant',
                count: 1800,
                percent: 0.45,
                percentOfDenominator: 0.045,
                color: '#4e79a7',
                width: 1,
                tooltip: 'Withdrawal by Participant: 1,800 of 4,000',
            },
            {
                kind: 'more',
                label: '+ 2 more',
                count: 900,
                percent: 0.225,
                percentOfDenominator: null,
                color: '#bab0ac',
                width: 0.5,
                tooltip: '+ 2 more: 900 of 4,000 (Death: 600, Other: 300)',
            },
            {
                kind: 'notRecorded',
                label: 'Not recorded',
                count: 40,
                percent: 0.01,
                percentOfDenominator: 0.001,
                color: '#bab0ac',
                width: 0.0222,
                tooltip: 'Not recorded: 40 of 4,000',
            },
        ],
        footnotes: ['Not recorded: the source value was blank.'],
        ...overrides,
    };
}

function render(section) {
    const root = document.createElement('div');
    makeSection(root, section);
    return root.querySelector('.metric-distribution--section');
}

const rows = (el) => [...el.querySelectorAll('tbody tr')];

describe('makeSection', () => {
    test('identifies the section by source and variable', () => {
        const el = render(model());
        expect(el.dataset.source).toBe('Numerator');
        expect(el.dataset.variable).toBe('compreas');
    });

    test('titles the section and names its table', () => {
        const el = render(model());
        expect(
            el.querySelector('.metric-distribution--title').textContent
        ).toBe('Reasons for study discontinuation');
        expect(el.querySelector('table').getAttribute('aria-label')).toBe(
            'Reasons for study discontinuation'
        );
    });

    test('heads each value column with its label', () => {
        const headers = [
            ...render(model()).querySelectorAll('thead th[scope="col"]'),
        ].map((th) => th.textContent);
        expect(headers).toEqual(['', 'n', '% Discontinued', '% Enrolled']);
    });

    test('draws one row per bar, in model order, with the label as row header', () => {
        const labels = rows(render(model())).map(
            (tr) => tr.querySelector('th[scope="row"]').textContent
        );
        expect(labels).toEqual([
            'Withdrawal by Participant',
            '+ 2 more',
            'Not recorded',
        ]);
    });

    test('formats each displayed value in its column', () => {
        const values = rows(render(model())).map((tr) =>
            [...tr.querySelectorAll('td')].map((td) => [
                td.dataset.value,
                td.textContent,
            ])
        );
        expect(values).toEqual([
            [
                ['count', '1,800'],
                ['percent', '45.0%'],
                ['percentOfDenominator', '4.5%'],
            ],
            [
                ['count', '900'],
                ['percent', '22.5%'],
                ['percentOfDenominator', '—'],
            ],
            [
                ['count', '40'],
                ['percent', '1.0%'],
                ['percentOfDenominator', '0.1%'],
            ],
        ]);
    });

    test('shows only the configured values', () => {
        const el = render(
            model({ columns: [{ value: 'percent', label: '% Enrolled' }] })
        );
        expect(
            rows(el).map((tr) => tr.querySelector('td').textContent)
        ).toEqual(['45.0%', '22.5%', '1.0%']);
        expect(rows(el)[0].querySelectorAll('td')).toHaveLength(1);
    });

    test('sizes and colours each bar from the model', () => {
        const bars = [
            ...render(model()).querySelectorAll('.metric-distribution--bar'),
        ];
        expect(bars.map((bar) => bar.style.width)).toEqual([
            '100%',
            '50%',
            '2.22%',
        ]);
        expect(bars[0].style.backgroundColor).toBe('rgb(78, 121, 167)');
        expect(bars[1].style.backgroundColor).toBe('rgb(186, 176, 172)');
    });

    test('hides bars from assistive technology', () => {
        const tracks = render(model()).querySelectorAll(
            '.metric-distribution--track'
        );
        tracks.forEach((track) =>
            expect(track.getAttribute('aria-hidden')).toBe('true')
        );
    });

    test('marks each row with its kind and carries the tooltip', () => {
        const [category, more, notRecorded] = rows(render(model()));
        expect(category.dataset.kind).toBe('category');
        expect(more.dataset.kind).toBe('more');
        expect(notRecorded.dataset.kind).toBe('notRecorded');
        expect(more.getAttribute('title')).toBe(
            '+ 2 more: 900 of 4,000 (Death: 600, Other: 300)'
        );
    });

    test('italicises the "+ k more" and "Not recorded" labels', () => {
        const [category, more, notRecorded] = rows(render(model())).map(
            (tr) => tr.querySelector('th').style.fontStyle
        );
        expect(category).toBe('');
        expect(more).toBe('italic');
        expect(notRecorded).toBe('italic');
    });

    test('adds the footnotes below the table', () => {
        const notes = [
            ...render(model()).querySelectorAll(
                '.metric-distribution--footnote'
            ),
        ].map((p) => p.textContent);
        expect(notes).toEqual(['Not recorded: the source value was blank.']);
    });

    test('has no total row', () => {
        const el = render(model());
        expect(el.querySelector('tfoot')).toBeNull();
        expect(rows(el)).toHaveLength(3);
    });

    test('shows a message in place of the table for an empty section', () => {
        const el = render(
            model({ empty: true, bars: [], footnotes: [], total: null })
        );
        expect(el.querySelector('table')).toBeNull();
        expect(
            el.querySelector('.metric-distribution--message').textContent
        ).toBe('There are no records in this breakdown.');
    });
});
