import validateData from '../../src/metricDistribution/validateData.js';

const metric = {
    MetricID: 'kri0006',
    Metric: 'Study Discontinuation Rate',
    Numerator: 'Subjects Discontinued - Study',
    Denominator: 'Enrolled Subjects',
};

function row(overrides = {}) {
    return {
        GroupID: 'AA-AA-000-0000',
        GroupLevel: 'Study',
        Source: 'Numerator',
        Variable: 'compreas',
        Category: 'Lost to Follow-Up',
        Count: 4,
        Participants: 4,
        Total: 10,
        Percent: 0.4,
        MetricID: 'kri0006',
        SnapshotDate: '2026-11-01',
        StudyID: 'AA-AA-000-0000',
        ...overrides,
    };
}

const result = {
    GroupID: 'AA-AA-000-0000',
    GroupLevel: 'Study',
    MetricID: 'kri0006',
    Numerator: 10,
    Denominator: 200,
    Metric: 0.05,
    SnapshotDate: '2026-11-01',
    StudyID: 'AA-AA-000-0000',
};

describe('validateData', () => {
    test('accepts rows, a metric row, and a result row for one scope', () => {
        expect(() =>
            validateData({ distributions: [row()], metric, result })
        ).not.toThrow();
    });

    test('accepts absent distributions (the missing state)', () => {
        expect(() => validateData({ metric })).not.toThrow();
        expect(() =>
            validateData({ distributions: null, metric })
        ).not.toThrow();
    });

    test('accepts an empty distributions array (the empty state)', () => {
        expect(() => validateData({ distributions: [], metric })).not.toThrow();
    });

    test('requires data to be a plain object', () => {
        expect(() => validateData([row()])).toThrow(
            'data must be a plain object'
        );
        expect(() => validateData(null)).toThrow('data must be a plain object');
    });

    test('requires a metric row with a name', () => {
        expect(() => validateData({ distributions: [] })).toThrow(
            'data.metric must be a plain object'
        );
        expect(() =>
            validateData({ distributions: [], metric: { MetricID: 'x' } })
        ).toThrow('data.metric.Metric must be a non-empty string');
    });

    test('requires distributions to be an array when supplied', () => {
        expect(() => validateData({ distributions: {}, metric })).toThrow(
            'data.distributions must be an array'
        );
    });

    test('requires every row to be a plain object', () => {
        expect(() => validateData({ distributions: [null], metric })).toThrow(
            'data.distributions[0] must be a plain object'
        );
    });

    test('requires Source and Variable strings on every row', () => {
        expect(() =>
            validateData({ distributions: [row({ Source: '' })], metric })
        ).toThrow('data.distributions[0].Source must be a non-empty string');
        expect(() =>
            validateData({
                distributions: [row(), row({ Variable: 3, Category: 'x' })],
                metric,
            })
        ).toThrow('data.distributions[1].Variable must be a non-empty string');
    });

    test('accepts a null or absent Category as a blank value', () => {
        const blank = row({ Category: null });
        const absent = row({ Variable: 'disposition' });
        delete absent.Category;
        expect(() =>
            validateData({ distributions: [blank, absent], metric })
        ).not.toThrow();
    });

    test('rejects a non-string Category', () => {
        expect(() =>
            validateData({ distributions: [row({ Category: 7 })], metric })
        ).toThrow('data.distributions[0].Category must be a string or null');
    });

    test('requires non-negative finite Count and Total numbers', () => {
        expect(() =>
            validateData({ distributions: [row({ Count: '4' })], metric })
        ).toThrow(
            'data.distributions[0].Count must be a non-negative finite number'
        );
        expect(() =>
            validateData({ distributions: [row({ Total: -1 })], metric })
        ).toThrow(
            'data.distributions[0].Total must be a non-negative finite number'
        );
    });

    test('requires Percent to be a proportion between 0 and 1, or null', () => {
        expect(() =>
            validateData({ distributions: [row({ Percent: null })], metric })
        ).not.toThrow();
        expect(() =>
            validateData({ distributions: [row({ Percent: 40 })], metric })
        ).toThrow(
            'data.distributions[0].Percent must be a number between 0 and 1, or null'
        );
    });

    test('rejects more than one row per category, so the widget never sums rows', () => {
        expect(() =>
            validateData({
                distributions: [
                    row({ GroupID: '001', GroupLevel: 'Site' }),
                    row({ GroupID: '001', GroupLevel: 'Site' }),
                ],
                metric,
            })
        ).toThrow(
            'data.distributions has more than one row for Numerator / compreas / "Lost to Follow-Up"'
        );
        expect(() =>
            validateData({
                distributions: [
                    row({ Category: null }),
                    row({ Category: undefined }),
                ],
                metric,
            })
        ).toThrow('more than one row for Numerator / compreas / blank');
    });

    test('rejects rows from more than one group', () => {
        expect(() =>
            validateData({
                distributions: [
                    row({ GroupID: '001', GroupLevel: 'Site' }),
                    row({
                        GroupID: '002',
                        GroupLevel: 'Site',
                        Category: 'Death',
                    }),
                ],
                metric,
            })
        ).toThrow('data.distributions must contain rows for one group');
    });

    test('rejects rows from more than one metric', () => {
        expect(() =>
            validateData({
                distributions: [
                    row(),
                    row({ MetricID: 'kri0007', Category: 'Death' }),
                ],
                metric,
            })
        ).toThrow('data.distributions must contain rows for one metric');
    });

    test('rejects rows for a different metric than data.metric', () => {
        expect(() =>
            validateData({
                distributions: [row({ MetricID: 'kri0014' })],
                metric,
            })
        ).toThrow(
            'data.distributions rows are for kri0014 but data.metric is kri0006'
        );
    });

    test('rejects a Total that differs between rows of one section', () => {
        expect(() =>
            validateData({
                distributions: [row(), row({ Category: 'Death', Total: 11 })],
                metric,
            })
        ).toThrow(
            'data.distributions has more than one Total for Numerator / compreas'
        );
    });

    test('requires result to be a plain object when supplied', () => {
        expect(() =>
            validateData({ distributions: [], metric, result: [result] })
        ).toThrow('data.result must be a plain object');
    });

    test('accepts result values as numbers, numeric strings, or unavailable', () => {
        [
            { Metric: null },
            { Numerator: '10', Denominator: '200', Metric: '0.05' },
            { Numerator: 'NA', Denominator: '', Metric: ' ' },
        ].forEach((values) => {
            expect(() =>
                validateData({
                    distributions: [row()],
                    metric,
                    result: { ...result, ...values },
                })
            ).not.toThrow();
        });
    });

    test('rejects result values that are neither numeric nor unavailable', () => {
        [
            ['Denominator', 'many'],
            ['Numerator', Infinity],
            ['Metric', '5%'],
            ['Metric', true],
        ].forEach(([field, value]) => {
            expect(() =>
                validateData({
                    distributions: [],
                    metric,
                    result: { ...result, [field]: value },
                })
            ).toThrow(
                `data.result.${field} must be a finite number, a numeric string, or unavailable (null, '' or 'NA')`
            );
        });
    });

    test('rejects rows from more than one study', () => {
        expect(() =>
            validateData({
                distributions: [
                    row(),
                    row({ StudyID: 'BB-BB-000-0000', Category: 'Death' }),
                ],
                metric,
            })
        ).toThrow('data.distributions must contain rows for one study');
    });

    test('rejects rows from more than one snapshot, so snapshots are never combined', () => {
        expect(() =>
            validateData({
                distributions: [
                    row(),
                    row({ SnapshotDate: '2026-10-01', Category: 'Death' }),
                ],
                metric,
            })
        ).toThrow('data.distributions must contain rows for one snapshot');
    });

    test('rejects a result from a different snapshot or study than the rows', () => {
        expect(() =>
            validateData({
                distributions: [row()],
                metric,
                result: { ...result, SnapshotDate: '2026-10-01' },
            })
        ).toThrow(
            'data.result is for snapshot 2026-10-01 but the rows are for 2026-11-01'
        );
        expect(() =>
            validateData({
                distributions: [row()],
                metric,
                result: { ...result, StudyID: 'BB-BB-000-0000' },
            })
        ).toThrow(
            'data.result is for study BB-BB-000-0000 but the rows are for AA-AA-000-0000'
        );
    });

    test('rejects a result for a different metric than the rows when data.metric has no MetricID', () => {
        const { MetricID, ...unidentified } = metric;
        expect(() =>
            validateData({
                distributions: [row()],
                metric: unidentified,
                result: { ...result, MetricID: 'kri0014' },
            })
        ).toThrow(
            'data.result is for metric kri0014 but the rows are for kri0006'
        );
    });

    test('rejects a result for a different metric or group than the rows', () => {
        expect(() =>
            validateData({
                distributions: [row()],
                metric,
                result: { ...result, MetricID: 'kri0014' },
            })
        ).toThrow('data.result is for kri0014 but data.metric is kri0006');
        expect(() =>
            validateData({
                distributions: [row()],
                metric,
                result: { ...result, GroupLevel: 'Site', GroupID: '001' },
            })
        ).toThrow(
            'data.result is for group level Site but the rows are for Study'
        );
    });

    test('compares the result’s group level and group ID separately, each only when given', () => {
        const { GroupID, ...levelOnly } = result;
        const { GroupLevel, ...idOnly } = result;
        const check = (partial) => () =>
            validateData({ distributions: [row()], metric, result: partial });

        expect(check({ ...levelOnly, GroupLevel: 'Site' })).toThrow(
            'data.result is for group level Site but the rows are for Study'
        );
        expect(check({ ...idOnly, GroupID: '001' })).toThrow(
            'data.result is for group 001 but the rows are for AA-AA-000-0000'
        );
        expect(check(levelOnly)).not.toThrow();
        expect(check(idOnly)).not.toThrow();
    });

    test('compares the rows’ group level and group ID separately, each only when given', () => {
        const { GroupLevel, ...idOnly } = row({ Category: 'Death' });
        expect(() =>
            validateData({ distributions: [row(), idOnly], metric, result })
        ).not.toThrow();
        expect(() =>
            validateData({
                distributions: [row(), { ...idOnly, GroupID: '001' }],
                metric,
            })
        ).toThrow('data.distributions must contain rows for one group');
        expect(() =>
            validateData({
                distributions: [row(), { ...idOnly, GroupLevel: 'Site' }],
                metric,
            })
        ).toThrow('data.distributions must contain rows for one group');
    });
});
