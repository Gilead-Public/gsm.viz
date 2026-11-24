/**
 * @jest-environment jsdom
 */

// Double programming: expected display text is computed here from the raw
// example rows, independently of the module. Only the public entry point is
// imported.
import fs from 'fs';
import path from 'path';

import metricOverview from '../../src/metricOverview.js';

const readExample = (file) =>
    JSON.parse(
        fs.readFileSync(
            path.join(__dirname, '../../examples/data', file),
            'utf8'
        )
    );

const results = readExample('results.json');
const metrics = readExample('metricMetadata.json');
const metricById = new Map(metrics.map((metric) => [metric.MetricID, metric]));

const columns = [
    'StudyID',
    'GroupLevel',
    'MetricID',
    'GroupID',
    'Numerator',
    'Denominator',
    'Metric',
    'Score',
    'Flag',
    'SnapshotDate',
];

// Expected labels: the metric row names these four columns; the rest, and
// any the metric row leaves blank, use the Reporting_Results data dictionary.
const namedByMetric = ['Metric', 'Numerator', 'Denominator', 'Score'];
const dictionaryTitles = {
    StudyID: 'Study ID',
    GroupLevel: 'Group Level',
    MetricID: 'Metric ID',
    GroupID: 'Group ID',
    Numerator: 'Numerator',
    Denominator: 'Denominator',
    Metric: 'Metric Value',
    Score: 'Metric Score',
    Flag: 'Flag Status',
    SnapshotDate: 'Snapshot Date',
};

const MINUS = '−';
const DASH = '—';

function expectedLabel(field, metric) {
    const name = metric[field];
    const usable =
        namedByMetric.includes(field) &&
        typeof name === 'string' &&
        name.trim() !== '' &&
        name !== 'NA';
    return usable ? name : dictionaryTitles[field];
}

function withCommas(digits) {
    let out = '';
    for (let i = 0; i < digits.length; i += 1) {
        const fromEnd = digits.length - i;
        out += digits[i];
        if (fromEnd > 1 && (fromEnd - 1) % 3 === 0) out += ',';
    }
    return out;
}

// Rounded with toFixed, thousands grouped, true minus sign, no sign on zero.
function fixed(value, decimals) {
    const rounded = Math.abs(value).toFixed(decimals);
    const [whole, fraction] = rounded.split('.');
    const sign = value < 0 && Number(rounded) !== 0 ? MINUS : '';
    return `${sign}${withCommas(whole)}${fraction ? `.${fraction}` : ''}`;
}

function expectedText(field, raw) {
    const missing =
        raw === undefined ||
        raw === null ||
        (typeof raw === 'string' && raw.trim() === '');

    if (
        !['Metric', 'Numerator', 'Denominator', 'Score', 'Flag'].includes(field)
    ) {
        return missing ? DASH : String(raw);
    }

    const number = missing ? NaN : Number(raw);
    if (!Number.isFinite(number)) return DASH;

    if (field === 'Metric') return `${fixed(number * 100, 1)}%`;
    if (field === 'Score') return fixed(number, 2);

    // Counts and flags in the example data are whole numbers.
    expect(Number.isInteger(number)).toBe(true);
    return fixed(number, 0);
}

function renderedList(root) {
    return [...root.querySelectorAll('.gsm-metric-overview__field')].map(
        (item) => [
            item.dataset.field,
            item.querySelector('dt').textContent,
            item.querySelector('dd').textContent,
        ]
    );
}

function expectedList(row, metric, fields) {
    return fields.map((field) => [
        field,
        expectedLabel(field, metric),
        expectedText(field, row[field]),
    ]);
}

function expectedHeader(row, metric) {
    const [value, numerator, denominator] = [
        'Metric',
        'Numerator',
        'Denominator',
    ].map((field) => ({
        label: expectedLabel(field, metric),
        text: expectedText(field, row[field]),
    }));

    return {
        text: `${value.label} ${value.text} ${numerator.text} / ${denominator.text}`,
        ariaLabel: [value, numerator, denominator]
            .map(({ label, text }) => `${label}: ${text}`)
            .join('; '),
    };
}

function byMetric(rows) {
    const groups = new Map();
    rows.forEach((row) => {
        if (!groups.has(row.MetricID)) groups.set(row.MetricID, []);
        groups.get(row.MetricID).push(row);
    });
    return groups;
}

const latestSnapshot = results
    .map((row) => row.SnapshotDate)
    .sort()
    .at(-1);

const qualificationSets = {
    'every study-level row': results.filter(
        (row) => row.GroupLevel === 'Study'
    ),
    'every country-level row': results.filter(
        (row) => row.GroupLevel === 'Country'
    ),
    'every site-level row in the latest snapshot': results.filter(
        (row) =>
            row.GroupLevel === 'Site' && row.SnapshotDate === latestSnapshot
    ),
};

describe('metricOverview display qualification against example data', () => {
    let container;

    beforeEach(() => {
        container = document.createElement('div');
        document.body.appendChild(container);
    });

    afterEach(() => {
        container.remove();
    });

    test.each(Object.entries(qualificationSets))(
        'shows %s exactly as computed independently',
        (_, rows) => {
            const mismatches = [];
            let unavailable = 0;

            byMetric(rows).forEach((metricRows, metricId) => {
                const metric = metricById.get(metricId);
                const data = { results: metricRows, metric };

                metricRows.forEach((row) => {
                    const select = {
                        studyId: row.StudyID,
                        groupLevel: row.GroupLevel,
                        groupId: row.GroupID,
                        snapshotDate: row.SnapshotDate,
                    };

                    const list = metricOverview(container, data, {
                        ...select,
                        fields: columns,
                    });
                    const expected = expectedList(row, metric, columns);
                    const actual = renderedList(list);
                    if (JSON.stringify(actual) !== JSON.stringify(expected)) {
                        mismatches.push({ row, expected, actual });
                    }
                    unavailable += expected.filter(
                        ([, , text]) => text === DASH
                    ).length;

                    const header = metricOverview(container, data, {
                        ...select,
                        layout: 'header',
                    }).querySelector('.gsm-metric-header');
                    const { text, ariaLabel } = expectedHeader(row, metric);
                    if (
                        header.textContent !== text ||
                        header.getAttribute('aria-label') !== ariaLabel
                    ) {
                        mismatches.push({
                            row,
                            expected: { text, ariaLabel },
                            actual: {
                                text: header.textContent,
                                ariaLabel: header.getAttribute('aria-label'),
                            },
                        });
                    }
                });
            });

            expect(rows.length).toBeGreaterThan(100);
            expect(mismatches.slice(0, 5)).toEqual([]);
            expect(mismatches).toHaveLength(0);
            if (rows[0].GroupLevel !== 'Study') {
                expect(unavailable).toBeGreaterThan(0);
            }
        }
    );

    test('shows the default fields of a study row', () => {
        const row = qualificationSets['every study-level row'][0];
        const metric = metricById.get(row.MetricID);
        const root = metricOverview(container, { results: [row], metric }, {});

        expect(renderedList(root)).toEqual(
            expectedList(row, metric, ['Metric', 'Numerator', 'Denominator'])
        );
    });

    test('shows the empty state for a group with no rows', () => {
        const rows = qualificationSets['every country-level row'];
        const metric = metricById.get(rows[0].MetricID);
        const root = metricOverview(
            container,
            {
                results: rows.filter((row) => row.MetricID === metric.MetricID),
                metric,
            },
            { groupId: 'No such country' }
        );

        expect(root.dataset.state).toBe('empty');
        expect(root.textContent).toBe('No data');
    });
});

describe('metricOverview display qualification against simulated rows', () => {
    const metric = {
        MetricID: 'sim0001',
        Metric: 'Simulated Rate',
        Numerator: 'Simulated Events',
        Denominator: 'Simulated Participants',
        Score: 'Simulated Score',
    };
    const simulated = [
        {
            MetricID: 'sim0001',
            GroupID: 'Disagreeing value',
            Numerator: 3,
            Denominator: 4,
            Metric: 0.1,
            Score: 2,
            Flag: 1,
        },
        {
            MetricID: 'sim0001',
            GroupID: 'Missing values',
            Numerator: null,
            Metric: 'NA',
            Score: '',
        },
        {
            MetricID: 'sim0001',
            GroupID: 'Large values',
            Numerator: 1234567,
            Denominator: 98765432,
            Metric: 0.0125,
            Score: -1234.5,
            Flag: -2,
        },
    ];

    let container;

    beforeEach(() => {
        container = document.createElement('div');
        document.body.appendChild(container);
    });

    afterEach(() => {
        container.remove();
    });

    test.each(simulated.map((row) => [row.GroupID, row]))(
        'shows "%s" exactly as computed independently',
        (groupId, row) => {
            const fields = [
                'Metric',
                'Numerator',
                'Denominator',
                'Score',
                'Flag',
            ];
            const root = metricOverview(
                container,
                { results: simulated, metric },
                { groupId, fields }
            );

            expect(renderedList(root)).toEqual(
                expectedList(row, metric, fields)
            );
        }
    );

    test('shows the metric value as given, not numerator / denominator', () => {
        const root = metricOverview(
            container,
            { results: simulated, metric },
            { groupId: 'Disagreeing value', layout: 'header' }
        );

        expect(root.textContent).toBe(
            expectedHeader(simulated[0], metric).text
        );
        expect(root.textContent).toContain(' 10.0% ');
    });
});
