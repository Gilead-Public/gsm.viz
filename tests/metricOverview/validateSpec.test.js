import validateSpec from '../../src/metricOverview/validateSpec.js';

const metric = {
    MetricID: 'kri0006',
    Metric: 'Study Discontinuation Rate',
    Numerator: 'Subjects Discontinued - Study',
    Denominator: 'Enrolled Subjects',
};
const results = [
    {
        MetricID: 'kri0006',
        GroupLevel: 'Study',
        GroupID: 'Study 01',
        Numerator: 3,
        Denominator: 40,
        Metric: 0.075,
        SnapshotDate: '2024-01-01',
    },
];
const data = { results, metric };

describe('metricOverview validateSpec', () => {
    test('accepts data with an empty spec', () => {
        expect(() => validateSpec(data, {})).not.toThrow();
    });

    test('accepts empty results', () => {
        expect(() => validateSpec({ results: [], metric }, {})).not.toThrow();
    });

    test.each([
        [undefined, 'data must be a plain object with results and metric'],
        [null, 'data must be a plain object with results and metric'],
        [[], 'data must be a plain object with results and metric'],
        [{ metric }, 'data.results must be an array'],
        [{ results: {}, metric }, 'data.results must be an array'],
        [{ results }, 'data.metric must be a plain object'],
        [{ results, metric: [] }, 'data.metric must be a plain object'],
        [{ results: [null], metric }, 'data.results[0] must be a plain object'],
    ])('rejects malformed data %#', (input, message) => {
        expect(() => validateSpec(input, {})).toThrow(message);
    });

    test('rejects results that belong to another metric', () => {
        expect(() =>
            validateSpec(
                { results: [{ ...results[0], MetricID: 'kri0001' }], metric },
                {}
            )
        ).toThrow(
            'data.results and data.metric must describe one metric; found kri0006, kri0001'
        );
    });

    test('rejects results that mix metrics when the metric row has no MetricID', () => {
        expect(() =>
            validateSpec(
                {
                    results: [
                        results[0],
                        { ...results[0], MetricID: 'kri0001' },
                    ],
                    metric: { Metric: 'Study Discontinuation Rate' },
                },
                {}
            )
        ).toThrow('found kri0006, kri0001');
    });

    test('ignores missing MetricIDs when checking for one metric', () => {
        expect(() =>
            validateSpec(
                {
                    results: [{ ...results[0], MetricID: undefined }],
                    metric,
                },
                {}
            )
        ).not.toThrow();
    });

    test.each([
        [null, 'spec must be a plain object'],
        [[], 'spec must be a plain object'],
        [{ colour: 'red' }, 'spec.colour is not supported'],
        [{ layout: 'grid' }, "spec.layout must be 'list' or 'header'"],
        [{ fields: 'Metric' }, 'spec.fields must be a non-empty array'],
        [{ fields: [] }, 'spec.fields must be a non-empty array'],
        [
            { fields: ['Metrc'] },
            'spec.fields[0] must be a Reporting_Results column',
        ],
        [
            { fields: ['Metric', 'Metric'] },
            'spec.fields must not repeat a field',
        ],
        [{ labels: 'x' }, 'spec.labels must be a plain object'],
        [
            { labels: { Rate: 'Rate' } },
            'spec.labels.Rate must be a Reporting_Results column',
        ],
        [
            { labels: { Metric: '' } },
            'spec.labels.Metric must be a non-empty string',
        ],
        [{ format: [] }, 'spec.format must be a plain object'],
        [
            { format: { Rate: '.1%' } },
            'spec.format.Rate must be a Reporting_Results column',
        ],
        [
            { format: { Metric: 1 } },
            'spec.format.Metric must be a d3-format specifier',
        ],
        [
            { format: { Metric: 'percent' } },
            'spec.format.Metric must be a d3-format specifier',
        ],
        [{ unavailable: '—' }, 'spec.unavailable must be a plain object'],
        [
            { unavailable: { missing: '—' } },
            'spec.unavailable.missing is not supported',
        ],
        [
            { unavailable: { value: '' } },
            'spec.unavailable.value must be a non-empty string',
        ],
        [
            { unavailable: { empty: 3 } },
            'spec.unavailable.empty must be a non-empty string',
        ],
        [
            { groupId: '' },
            'spec.groupId must be a non-empty string or a number',
        ],
        [
            { groupId: {} },
            'spec.groupId must be a non-empty string or a number',
        ],
        [
            { snapshotDate: ' ' },
            'spec.snapshotDate must be a non-empty string or a number',
        ],
        [
            { studyId: '' },
            'spec.studyId must be a non-empty string or a number',
        ],
        [
            { groupLevel: [] },
            'spec.groupLevel must be a non-empty string or a number',
        ],
    ])('rejects invalid spec %#', (spec, message) => {
        expect(() => validateSpec(data, spec)).toThrow(message);
    });

    test('accepts every supported option', () => {
        expect(() =>
            validateSpec(data, {
                studyId: 'Study 01',
                groupLevel: 'Study',
                groupId: 'Study 01',
                snapshotDate: '2024-01-01',
                layout: 'header',
                fields: ['GroupID', 'Metric', 'Score', 'Flag'],
                labels: { Metric: 'Discontinued', GroupID: 'Study' },
                format: { Metric: '.2%', Score: '+.1f' },
                unavailable: { value: 'Not available', empty: 'No results' },
            })
        ).not.toThrow();
    });

    test('accepts a numeric groupId', () => {
        expect(() => validateSpec(data, { groupId: 101 })).not.toThrow();
    });
});
