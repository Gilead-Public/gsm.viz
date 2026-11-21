import describeField from '../../src/metricOverview/describeField.js';
import mergeSpec from '../../src/metricOverview/mergeSpec.js';

const metric = {
    MetricID: 'kri0001',
    Metric: 'Adverse Event Rate',
    Numerator: 'Adverse Events',
    Denominator: 'Days on Study',
    Score: 'Adjusted Z-Score',
    Flag: '-2,-1,0,1,2',
};
const row = {
    StudyID: 'Study 01',
    GroupLevel: 'Site',
    GroupID: 'Site 01',
    MetricID: 'kri0001',
    Numerator: 12,
    Denominator: 32947,
    Metric: 0.000364221,
    Score: -0.81149469,
    Flag: -2,
    SnapshotDate: '2024-01-01',
};
const spec = mergeSpec({});

const describe1 = (field, overrides = {}, userSpec = {}, metricRow = metric) =>
    describeField(
        field,
        { ...row, ...overrides },
        metricRow,
        mergeSpec(userSpec)
    );

describe('metricOverview describeField labels', () => {
    test.each([
        ['Metric', 'Adverse Event Rate'],
        ['Numerator', 'Adverse Events'],
        ['Denominator', 'Days on Study'],
        ['Score', 'Adjusted Z-Score'],
    ])('labels %s with the metric row', (field, label) => {
        expect(describe1(field).label).toBe(label);
    });

    test.each([
        ['Flag', 'Flag Status'],
        ['GroupID', 'Group ID'],
        ['SnapshotDate', 'Snapshot Date'],
    ])(
        'labels %s, which the metric row does not name, with its column title',
        (field, label) => {
            expect(describe1(field).label).toBe(label);
        }
    );

    test('prefers a spec label over the metric row', () => {
        expect(
            describe1('Numerator', {}, { labels: { Numerator: 'Events' } })
                .label
        ).toBe('Events');
    });

    test.each([undefined, null, '', '  ', 'NA', 7])(
        'falls back to the column title when the metric label is %p',
        (value) => {
            expect(
                describe1(
                    'Denominator',
                    {},
                    {},
                    { ...metric, Denominator: value }
                ).label
            ).toBe('Denominator');
            expect(
                describe1('Metric', {}, {}, { ...metric, Metric: value }).label
            ).toBe('Metric Value');
        }
    );
});

describe('metricOverview describeField values', () => {
    test('formats the metric as a percent with one decimal', () => {
        expect(describe1('Metric', { Metric: 0.075 })).toEqual({
            field: 'Metric',
            label: 'Adverse Event Rate',
            text: '7.5%',
            available: true,
        });
    });

    test('groups thousands in percents and scores', () => {
        expect(describe1('Metric', { Metric: 16 }).text).toBe('1,600.0%');
        expect(describe1('Score', { Score: -1234.567 }).text).toBe('−1,234.57');
    });

    test('drops the sign of a value that rounds to zero', () => {
        expect(describe1('Score', { Score: -0.001 }).text).toBe('0.00');
    });

    test('formats counts with thousands separators and keeps decimals', () => {
        expect(describe1('Denominator').text).toBe('32,947');
        expect(describe1('Denominator', { Denominator: 1234.5 }).text).toBe(
            '1,234.5'
        );
    });

    test('formats scores with two decimals and flags as signed integers', () => {
        expect(describe1('Score').text).toBe('−0.81');
        expect(describe1('Flag').text).toBe('−2');
        expect(describe1('Flag', { Flag: 0 }).text).toBe('0');
    });

    test('reads numbers stored as text', () => {
        expect(describe1('Metric', { Metric: '0.075' }).text).toBe('7.5%');
        expect(describe1('Numerator', { Numerator: ' 1860 ' }).text).toBe(
            '1,860'
        );
    });

    test('applies a spec format', () => {
        expect(
            describe1(
                'Metric',
                { Metric: 0.075 },
                { format: { Metric: '.3f' } }
            ).text
        ).toBe('0.075');
    });

    test('shows text columns as given', () => {
        expect(describe1('GroupID').text).toBe('Site 01');
        expect(describe1('SnapshotDate').text).toBe('2024-01-01');
        expect(describe1('GroupID', { GroupID: 101 }).text).toBe('101');
    });

    test('keeps "NA" in text columns, where it can be a real ID', () => {
        expect(describe1('GroupID', { GroupID: 'NA' })).toMatchObject({
            text: 'NA',
            available: true,
        });
    });
});

describe('metricOverview describeField missing and unavailable values', () => {
    test('treats an absent column as missing', () => {
        const { Metric, ...withoutMetric } = row;
        expect(describeField('Metric', withoutMetric, metric, spec)).toEqual({
            field: 'Metric',
            label: 'Adverse Event Rate',
            text: '—',
            available: false,
        });
    });

    test.each([
        undefined,
        null,
        '',
        '   ',
        'NA',
        'NaN',
        NaN,
        Infinity,
        'twelve',
        true,
        [],
        {},
    ])('shows the unavailable text for a numeric value of %p', (value) => {
        expect(describe1('Numerator', { Numerator: value })).toMatchObject({
            text: '—',
            available: false,
        });
    });

    test.each([undefined, null, '', '  ', NaN, {}])(
        'shows the unavailable text for a text value of %p',
        (value) => {
            expect(describe1('GroupID', { GroupID: value })).toMatchObject({
                text: '—',
                available: false,
            });
        }
    );

    test('uses the spec text for unavailable values', () => {
        expect(
            describe1(
                'Score',
                { Score: 'NA' },
                { unavailable: { value: 'Not available' } }
            ).text
        ).toBe('Not available');
    });

    test('shows zero as a value, not as unavailable', () => {
        expect(describe1('Numerator', { Numerator: 0 })).toMatchObject({
            text: '0',
            available: true,
        });
        expect(describe1('Metric', { Metric: '0' }).text).toBe('0.0%');
    });
});
