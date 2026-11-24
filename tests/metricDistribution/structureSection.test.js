import structureSection from '../../src/metricDistribution/structureSection.js';
import mergeSpec from '../../src/metricDistribution/mergeSpec.js';

const metric = {
    MetricID: 'kri0006',
    Metric: 'Study Discontinuation Rate',
    Numerator: 'Subjects Discontinued - Study',
    Denominator: 'Enrolled Subjects',
};
const result = { Numerator: 40, Denominator: 400, Metric: 0.1 };

function reasonRows() {
    return [
        {
            Source: 'Numerator',
            Variable: 'compreas',
            Category: 'Death',
            Count: 6,
            Total: 40,
            Percent: 0.15,
        },
        {
            Source: 'Numerator',
            Variable: 'compreas',
            Category: 'Withdrawal by Participant',
            Count: 18,
            Total: 40,
            Percent: 0.45,
        },
        {
            Source: 'Numerator',
            Variable: 'compreas',
            Category: null,
            Count: 4,
            Total: 40,
            Percent: 0.1,
        },
        {
            Source: 'Numerator',
            Variable: 'compreas',
            Category: 'Lost to Follow-Up',
            Count: 12,
            Total: 40,
            Percent: 0.3,
        },
    ];
}

function statusRows() {
    return [
        {
            Source: 'Denominator',
            Variable: 'disposition',
            Category: 'Ongoing',
            Count: 300,
            Total: 400,
            Percent: 0.75,
        },
        {
            Source: 'Denominator',
            Variable: 'disposition',
            Category: 'Discontinued',
            Count: 40,
            Total: 400,
            Percent: 0.1,
        },
        {
            Source: 'Denominator',
            Variable: 'disposition',
            Category: 'Study Completion',
            Count: 60,
            Total: 400,
            Percent: 0.15,
        },
    ];
}

const reason = { source: 'Numerator', variable: 'compreas' };
const status = { source: 'Denominator', variable: 'disposition', status: true };

function build(rows, section, spec = {}, data = { metric, result }) {
    return structureSection(rows, section, mergeSpec(spec), data);
}

describe('structureSection', () => {
    test('orders bars by descending count with "Not recorded" last', () => {
        const { bars } = build(reasonRows(), reason);
        expect(bars.map((bar) => bar.label)).toEqual([
            'Withdrawal by Participant',
            'Lost to Follow-Up',
            'Death',
            'Not recorded',
        ]);
        expect(bars.map((bar) => bar.kind)).toEqual([
            'category',
            'category',
            'category',
            'notRecorded',
        ]);
    });

    test('displays the published Percent and the share of the metric population', () => {
        const [first] = build(reasonRows(), reason).bars;
        expect(first.count).toBe(18);
        expect(first.percent).toBe(0.45);
        expect(first.percentOfDenominator).toBeCloseTo(18 / 400, 12);
    });

    test('leaves the second percentage unavailable without a result row', () => {
        const [first] = build(reasonRows(), reason, {}, { metric }).bars;
        expect(first.percentOfDenominator).toBeNull();
    });

    test('leaves the second percentage unavailable for a zero denominator', () => {
        const [first] = build(
            reasonRows(),
            reason,
            {},
            {
                metric,
                result: { Numerator: 0, Denominator: 0, Metric: null },
            }
        ).bars;
        expect(first.percentOfDenominator).toBeNull();
    });

    test('scales bar widths to the largest count in the section', () => {
        const { bars } = build(reasonRows(), reason);
        expect(bars.map((bar) => bar.width)).toEqual([
            1,
            12 / 18,
            6 / 18,
            4 / 18,
        ]);
    });

    test('draws zero-width bars when every count is zero', () => {
        const rows = [
            {
                Source: 'Numerator',
                Variable: 'compreas',
                Category: 'Death',
                Count: 0,
                Total: 0,
                Percent: null,
            },
        ];
        expect(build(rows, reason).bars[0].width).toBe(0);
    });

    test('collapses categories beyond the top N into "+ k more"', () => {
        const { bars } = build(reasonRows(), { ...reason, topN: 1 });
        expect(bars.map((bar) => bar.label)).toEqual([
            'Withdrawal by Participant',
            '+ 2 more',
            'Not recorded',
        ]);
        const more = bars[1];
        expect(more.kind).toBe('more');
        expect(more.count).toBe(18);
        expect(more.percent).toBeCloseTo(0.45, 12);
        expect(more.percentOfDenominator).toBeCloseTo(18 / 400, 12);
        expect(more.description).toBe(
            '18 of 40 (Lost to Follow-Up: 12, Death: 6)'
        );
    });

    test('takes the top N from the spec when the section sets none', () => {
        const { bars } = build(reasonRows(), reason, { topN: 2 });
        expect(bars.map((bar) => bar.label)).toEqual([
            'Withdrawal by Participant',
            'Lost to Follow-Up',
            '+ 1 more',
            'Not recorded',
        ]);
    });

    test('leaves the collapsed percent unavailable when a collapsed Percent is', () => {
        const rows = reasonRows().map((row) => ({ ...row, Percent: null }));
        const { bars } = build(rows, { ...reason, topN: 1 });
        expect(bars[1].percent).toBeNull();
    });

    test('describes each bar as "n of N"', () => {
        const { bars } = build(reasonRows(), reason);
        expect(bars[0].description).toBe('18 of 40');
        expect(bars[3].description).toBe('4 of 40');
        expect(bars.some((bar) => 'tooltip' in bar)).toBe(false);
    });

    test('shows counts alone for a reason section by default', () => {
        expect(build(reasonRows(), reason).columns).toEqual([
            { value: 'count', label: 'n' },
        ]);
    });

    test('shows counts alone by default for a source other than the numerator or denominator', () => {
        const rows = reasonRows().map((row) => ({ ...row, Source: 'Other' }));
        expect(
            build(rows, { source: 'Other', variable: 'compreas' }).columns
        ).toEqual([{ value: 'count', label: 'n' }]);
    });

    test('names the population of a reason section’s percentages when they are requested', () => {
        expect(
            build(reasonRows(), {
                ...reason,
                values: ['percent', 'percentOfDenominator'],
            }).columns
        ).toEqual([
            { value: 'percent', label: '% of Subjects Discontinued - Study' },
            { value: 'percentOfDenominator', label: '% of Enrolled Subjects' },
        ]);
    });

    test('shows one percentage of the named population for a status section by default', () => {
        expect(build(statusRows(), status).columns).toEqual([
            { value: 'percent', label: '% of Enrolled Subjects' },
        ]);
    });

    test('falls back to a bare percent label without metric labels', () => {
        const { columns } = build(
            reasonRows(),
            reason,
            { values: ['percent', 'percentOfDenominator'] },
            {
                metric: { Metric: 'Study Discontinuation Rate' },
                result,
            }
        );
        expect(columns.map((column) => column.label)).toEqual(['%', '%']);
    });

    test('treats blank and NA metric labels as missing, so no column reads "% of NA"', () => {
        ['', '   ', 'NA'].forEach((label) => {
            const { columns } = build(
                reasonRows(),
                reason,
                { values: ['percent', 'percentOfDenominator'] },
                {
                    metric: { ...metric, Numerator: label, Denominator: label },
                    result,
                }
            );
            expect(columns.map((column) => column.label)).toEqual(['%', '%']);
        });
        expect(
            build(statusRows(), status, undefined, {
                metric: { ...metric, Denominator: 'NA' },
                result,
            }).columns
        ).toEqual([{ value: 'percent', label: '%' }]);
    });

    test('labels the section share "%" for a source other than the numerator or denominator', () => {
        const rows = reasonRows().map((row) => ({ ...row, Source: 'Other' }));
        const { columns } = build(rows, {
            source: 'Other',
            variable: 'compreas',
            values: ['percent', 'percentOfDenominator'],
        });
        expect(columns).toEqual([
            { value: 'percent', label: '%' },
            { value: 'percentOfDenominator', label: '% of Enrolled Subjects' },
        ]);
    });

    test('takes values and labels from the section, then the spec', () => {
        const { columns } = build(
            reasonRows(),
            { ...reason, labels: { percent: '% Discontinued' } },
            {
                values: ['count', 'percent', 'percentOfDenominator'],
                labels: { count: 'Participants', percent: 'unused' },
            }
        );
        expect(columns).toEqual([
            { value: 'count', label: 'Participants' },
            { value: 'percent', label: '% Discontinued' },
            { value: 'percentOfDenominator', label: '% of Enrolled Subjects' },
        ]);

        const sectionValues = build(
            reasonRows(),
            { ...reason, values: ['count'] },
            { values: ['percent'] }
        ).columns;
        expect(sectionValues).toEqual([{ value: 'count', label: 'n' }]);
    });

    test('never labels a column "Numerator" or "Denominator"', () => {
        const labels = [
            ...build(reasonRows(), reason, {
                values: ['count', 'percent', 'percentOfDenominator'],
            }).columns,
            ...build(statusRows(), status, {
                values: ['count', 'percent', 'percentOfDenominator'],
            }).columns,
        ].map((column) => column.label);
        labels.forEach((label) => {
            expect(label).not.toMatch(/numerator|denominator/i);
        });
    });

    test('uses the section title, or the variable name without one', () => {
        expect(build(reasonRows(), reason).title).toBe('compreas');
        expect(
            build(reasonRows(), {
                ...reason,
                title: 'Reasons for study discontinuation',
            }).title
        ).toBe('Reasons for study discontinuation');
    });

    test('colours status categories from the colour map', () => {
        const { bars } = build(statusRows(), status, {
            colors: { Ongoing: '#59a14f', 'Study Completion': '#4e79a7' },
        });
        expect(bars.map((bar) => [bar.label, bar.color])).toEqual([
            ['Ongoing', '#59a14f'],
            ['Study Completion', '#4e79a7'],
            ['Discontinued', '#bab0ac'],
        ]);
    });

    test('falls back to the neutral colour without a colour map', () => {
        const { bars } = build(statusRows(), status, {
            theme: { neutralColor: '#999999' },
        });
        expect(bars.every((bar) => bar.color === '#999999')).toBe(true);
    });

    test('ignores inherited object keys when looking up status colours', () => {
        const rows = [
            {
                Source: 'Denominator',
                Variable: 'disposition',
                Category: 'constructor',
                Count: 1,
                Total: 1,
                Percent: 1,
            },
        ];
        expect(build(rows, status).bars[0].color).toBe('#bab0ac');
    });

    test('does not colour reason categories, even when the map names them', () => {
        const { bars } = build(reasonRows(), reason, {
            colors: { Death: '#e15759' },
            theme: { barColor: '#123456' },
        });
        expect(bars.slice(0, 3).every((bar) => bar.color === '#123456')).toBe(
            true
        );
    });

    test('draws "+ k more" and "Not recorded" in the neutral colour', () => {
        const { bars } = build(reasonRows(), { ...reason, topN: 1 });
        expect(bars[1].color).toBe('#bab0ac');
        expect(bars[2].color).toBe('#bab0ac');
    });

    test('adds a footnote when counts add up to more than the total', () => {
        const rows = [
            {
                Source: 'Numerator',
                Variable: 'ietestcd_concat',
                Category: 'IN01',
                Count: 8,
                Total: 10,
                Percent: 0.8,
            },
            {
                Source: 'Numerator',
                Variable: 'ietestcd_concat',
                Category: 'EX03',
                Count: 5,
                Total: 10,
                Percent: 0.5,
            },
        ];
        expect(
            build(rows, { source: 'Numerator', variable: 'ietestcd_concat' })
                .footnotes
        ).toEqual([
            'Some records fall in more than one category, so the counts add up to more than 10.',
        ]);
    });

    test('adds no footnote when counts add up to the total', () => {
        expect(build(statusRows(), status).footnotes).toEqual([]);
    });

    test('adds a footnote when "Not recorded" is present', () => {
        expect(build(reasonRows(), reason).footnotes).toEqual([
            'Not recorded: the source value was blank.',
        ]);
    });

    test('counts collapsed and blank rows towards the multiple-category check', () => {
        const rows = [
            {
                Source: 'Numerator',
                Variable: 'v',
                Category: 'A',
                Count: 5,
                Total: 10,
                Percent: 0.5,
            },
            {
                Source: 'Numerator',
                Variable: 'v',
                Category: 'B',
                Count: 4,
                Total: 10,
                Percent: 0.4,
            },
            {
                Source: 'Numerator',
                Variable: 'v',
                Category: null,
                Count: 2,
                Total: 10,
                Percent: 0.2,
            },
        ];
        expect(
            build(rows, { source: 'Numerator', variable: 'v', topN: 1 })
                .footnotes
        ).toEqual([
            'Some records fall in more than one category, so the counts add up to more than 10.',
            'Not recorded: the source value was blank.',
        ]);
    });

    test('marks a section with no rows as empty', () => {
        const section = build([], reason);
        expect(section.empty).toBe(true);
        expect(section.bars).toEqual([]);
        expect(section.footnotes).toEqual([]);
        expect(section.total).toBeNull();
    });

    test('carries the section identity and total', () => {
        const section = build(reasonRows(), reason);
        expect(section).toMatchObject({
            source: 'Numerator',
            variable: 'compreas',
            total: 40,
            empty: false,
        });
    });
});
