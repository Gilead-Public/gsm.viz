import structureData from '../../src/metricDistribution/structureData.js';
import mergeSpec from '../../src/metricDistribution/mergeSpec.js';

const metric = {
    MetricID: 'kri0006',
    Metric: 'Study Discontinuation Rate',
    Numerator: 'Subjects Discontinued - Study',
    Denominator: 'Enrolled Subjects',
};

function row(Source, Variable, Category, Count, Total) {
    return { Source, Variable, Category, Count, Total, Percent: Count / Total };
}

const distributions = [
    row('Denominator', 'disposition', 'Ongoing', 30, 40),
    row('Denominator', 'disposition', 'Discontinued', 10, 40),
    row('Numerator', 'compreas', 'Death', 4, 10),
    row('Numerator', 'compreas', 'Lost to Follow-Up', 6, 10),
    row('Numerator', 'aeterm', 'Headache', 2, 10),
];

function build(data, spec = {}) {
    return structureData({ metric, ...data }, mergeSpec(spec));
}

describe('structureData', () => {
    test('is in the missing state without distributions', () => {
        expect(build({})).toEqual({ state: 'missing', sections: [] });
        expect(build({ distributions: null })).toEqual({
            state: 'missing',
            sections: [],
        });
    });

    test('is in the empty state with no rows', () => {
        expect(build({ distributions: [] })).toEqual({
            state: 'empty',
            sections: [],
        });
    });

    test('is in the empty state when no requested section has rows', () => {
        expect(
            build(
                { distributions },
                { sections: [{ source: 'Numerator', variable: 'sf_reason' }] }
            )
        ).toEqual({ state: 'empty', sections: [] });
    });

    test('shows every section by default, numerator sections first', () => {
        const { state, sections } = build({ distributions });
        expect(state).toBe('ok');
        expect(sections.map((s) => `${s.source}/${s.variable}`)).toEqual([
            'Numerator/compreas',
            'Numerator/aeterm',
            'Denominator/disposition',
        ]);
    });

    test('puts sections from other sources last, in order of appearance', () => {
        const { sections } = build({
            distributions: [
                row('Other', 'site_status', 'Active', 1, 1),
                ...distributions,
            ],
        });
        expect(sections.map((s) => `${s.source}/${s.variable}`)).toEqual([
            'Numerator/compreas',
            'Numerator/aeterm',
            'Denominator/disposition',
            'Other/site_status',
        ]);
    });

    test('shows only the requested sections, in the requested order', () => {
        const { sections } = build(
            { distributions },
            {
                sections: [
                    { source: 'Denominator', variable: 'disposition' },
                    { source: 'Numerator', variable: 'compreas' },
                ],
            }
        );
        expect(sections.map((s) => `${s.source}/${s.variable}`)).toEqual([
            'Denominator/disposition',
            'Numerator/compreas',
        ]);
    });

    test('keeps a requested section without rows as an empty section', () => {
        const { state, sections } = build(
            { distributions },
            {
                sections: [
                    { source: 'Numerator', variable: 'compreas' },
                    { source: 'Numerator', variable: 'sf_reason' },
                ],
            }
        );
        expect(state).toBe('ok');
        expect(sections[1]).toMatchObject({
            variable: 'sf_reason',
            empty: true,
        });
    });

    test('passes section options and only that section’s rows through', () => {
        const { sections } = build(
            { distributions },
            {
                sections: [
                    {
                        source: 'Numerator',
                        variable: 'compreas',
                        title: 'Reasons for study discontinuation',
                        topN: 1,
                    },
                ],
            }
        );
        expect(sections[0].title).toBe('Reasons for study discontinuation');
        expect(sections[0].bars.map((bar) => bar.label)).toEqual([
            'Lost to Follow-Up',
            '+ 1 more',
        ]);
    });
});
