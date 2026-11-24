/**
 * @jest-environment jsdom
 */

// Double-programmed qualification of the displayed values. Expectations are
// computed here, from the simulated rows and the documented rules in
// examples/docs/metricDistribution.md, without importing any module internals:
// only the public entry point is used, and only rendered output is read.

import metricDistribution from '../../src/metricDistribution.js';
import { cases } from './fixtures/simulatedDistributions.js';

const percentFormat = new Intl.NumberFormat('en-US', {
    style: 'percent',
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
});
const countFormat = new Intl.NumberFormat('en-US', {
    maximumFractionDigits: 0,
});
const DASH = '—';
const BAR = '#4e79a7';
const NEUTRAL = '#bab0ac';

const showCount = (n) => countFormat.format(n);
const showShare = (n, d) =>
    typeof d === 'number' && d > 0 ? percentFormat.format(n / d) : DASH;

function rgb(hex) {
    const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
    return `rgb(${r}, ${g}, ${b})`;
}

function largestFirst(rows) {
    const pool = rows.slice();
    const ranked = [];
    while (pool.length > 0) {
        let pick = 0;
        for (let i = 1; i < pool.length; i += 1) {
            if (pool[i].Count > pool[pick].Count) pick = i;
        }
        ranked.push(pool.splice(pick, 1)[0]);
    }
    return ranked;
}

function sectionsToShow(data, spec) {
    if (spec.sections) return spec.sections;
    const seen = [];
    data.distributions.forEach((row) => {
        if (
            !seen.some(
                (s) => s.source === row.Source && s.variable === row.Variable
            )
        ) {
            seen.push({ source: row.Source, variable: row.Variable });
        }
    });
    return [
        ...seen.filter((s) => s.source === 'Numerator'),
        ...seen.filter((s) => s.source === 'Denominator'),
        ...seen.filter(
            (s) => s.source !== 'Numerator' && s.source !== 'Denominator'
        ),
    ];
}

function expectedSection(data, spec, section) {
    const { metric, result } = data;
    const mine = data.distributions.filter(
        (row) =>
            row.Source === section.source && row.Variable === section.variable
    );
    const total = mine[0].Total;
    const isDenominatorSection = section.source === 'Denominator';

    const values = section.values ||
        spec.values || [isDenominatorSection ? 'percent' : 'count'];
    const defaultLabels = {
        count: 'n',
        percent: `% of ${
            isDenominatorSection ? metric.Denominator : metric.Numerator
        }`,
        percentOfDenominator: `% of ${metric.Denominator}`,
    };
    const columns = values.map(
        (value) =>
            (section.labels && section.labels[value]) ||
            (spec.labels && spec.labels[value]) ||
            defaultLabels[value]
    );

    const show = (count) => ({
        count: showCount(count),
        percent: showShare(count, total),
        percentOfDenominator: showShare(count, result.Denominator),
    });

    const recorded = largestFirst(mine.filter((row) => row.Category !== null));
    const limit = section.topN || spec.topN || recorded.length;
    const top = recorded.slice(0, limit);
    const rest = recorded.slice(limit);
    const blank = mine.find((row) => row.Category === null);

    const ofTotal = (count) => `${showCount(count)} of ${showCount(total)}`;
    const lines = top.map((row) => ({
        label: row.Category,
        count: row.Count,
        spoken: `${row.Category}: ${ofTotal(row.Count)}`,
        color: section.status
            ? (spec.colors || {})[row.Category] || NEUTRAL
            : BAR,
    }));
    if (rest.length > 0) {
        let restCount = 0;
        rest.forEach((row) => {
            restCount += row.Count;
        });
        lines.push({
            label: `+ ${rest.length} more`,
            count: restCount,
            spoken: `+ ${rest.length} more: ${ofTotal(restCount)} (${rest
                .map((row) => `${row.Category}: ${showCount(row.Count)}`)
                .join(', ')})`,
            color: NEUTRAL,
        });
    }
    if (blank && blank.Count > 0) {
        lines.push({
            label: 'Not recorded',
            count: blank.Count,
            spoken: `Not recorded: ${ofTotal(blank.Count)}`,
            color: NEUTRAL,
        });
    }

    const biggest = Math.max(...lines.map((line) => line.count));
    let allCounts = 0;
    mine.forEach((row) => {
        allCounts += row.Count;
    });

    const footnotes = [];
    if (allCounts > total) {
        footnotes.push(
            `Some records fall in more than one category, so the counts add up to more than ${showCount(
                total
            )}.`
        );
    }
    if (blank && blank.Count > 0) {
        footnotes.push('Not recorded: the source value was blank.');
    }

    return {
        source: section.source,
        variable: section.variable,
        title: section.title || section.variable,
        columns,
        bars: lines.map((line) => ({
            label: line.label,
            spoken: line.spoken,
            values: values.map((value) => show(line.count)[value]),
            color: rgb(line.color),
            width: biggest > 0 ? (100 * line.count) / biggest : 0,
        })),
        footnotes,
    };
}

function readSection(el) {
    return {
        source: el.dataset.source,
        variable: el.dataset.variable,
        title: el.querySelector('.metric-distribution--title').textContent,
        columns: [...el.querySelectorAll('thead th')]
            .slice(1)
            .map((th) => th.textContent),
        bars: [...el.querySelectorAll('tbody tr')].map((tr) => {
            const bar = tr.querySelector('.metric-distribution--bar');
            return {
                label: tr.querySelector('.metric-distribution--label')
                    .textContent,
                spoken: tr.querySelector('th').textContent,
                values: [...tr.querySelectorAll('td')].map(
                    (td) => td.textContent
                ),
                color: bar.style.backgroundColor,
                width: parseFloat(bar.style.width),
            };
        }),
        footnotes: [
            ...el.querySelectorAll('.metric-distribution--footnote'),
        ].map((p) => p.textContent),
    };
}

describe('metricDistribution display qualification', () => {
    let container;

    beforeEach(() => {
        container = document.createElement('div');
        document.body.appendChild(container);
    });

    afterEach(() => {
        container.remove();
    });

    describe.each(cases.map((c) => [c.name, c]))(
        '%s',
        (name, { data, spec }) => {
            test('header shows the result’s metric name, percent, and counts', () => {
                const root = metricDistribution(container, data, spec);
                const header = root.querySelector('.gsm-metric-header');
                const part = (cls) =>
                    header.querySelector(`.gsm-metric-header__${cls}`)
                        .textContent;
                expect(part('name')).toBe(data.metric.Metric);
                expect(part('value')).toBe(
                    showShare(data.result.Numerator, data.result.Denominator)
                );
                expect(part('fraction')).toBe(
                    `${showCount(data.result.Numerator)} / ${showCount(
                        data.result.Denominator
                    )}`
                );
            });

            test('bars, values, colours, and footnotes match the rows', () => {
                const root = metricDistribution(container, data, spec);
                const shown = [
                    ...root.querySelectorAll('.metric-distribution--section'),
                ].map(readSection);
                const expected = sectionsToShow(data, spec).map((section) =>
                    expectedSection(data, spec, section)
                );

                const withoutWidths = (sections) =>
                    sections.map((section) => ({
                        ...section,
                        bars: section.bars.map(({ width, ...bar }) => bar),
                    }));
                expect(withoutWidths(shown)).toEqual(withoutWidths(expected));

                shown.forEach((section, i) => {
                    section.bars.forEach((bar, j) => {
                        expect(bar.width).toBeCloseTo(
                            expected[i].bars[j].width,
                            1
                        );
                    });
                });
            });

            test('no bar shows a count and a percentage together', () => {
                const root = metricDistribution(container, data, spec);
                root.querySelectorAll('tbody tr').forEach((tr) => {
                    const shown = [...tr.querySelectorAll('td')].map((td) =>
                        td.textContent.endsWith('%') ? 'percentage' : 'count'
                    );
                    expect(new Set(shown).size).toBe(1);
                });
            });

            test('no displayed text says "Numerator" or "Denominator"', () => {
                const root = metricDistribution(container, data, spec);
                const texts = [
                    root.textContent,
                    ...[...root.querySelectorAll('[title]')].map((el) =>
                        el.getAttribute('title')
                    ),
                    ...[...root.querySelectorAll('[aria-label]')].map((el) =>
                        el.getAttribute('aria-label')
                    ),
                ];
                texts.forEach((text) => {
                    expect(text).not.toMatch(/numerator|denominator/i);
                });
            });
        }
    );

    test('shows the missing state when no distributions are supplied', () => {
        const { metric, result } = cases[0].data;
        const root = metricDistribution(container, { metric, result });
        expect(root.dataset.state).toBe('missing');
        expect(
            root.querySelectorAll('.metric-distribution--section')
        ).toHaveLength(0);
        expect(
            root.querySelector('.metric-distribution--message')
        ).not.toBeNull();
    });

    test('shows the empty state when no rows are supplied', () => {
        const { metric, result } = cases[0].data;
        const root = metricDistribution(container, {
            distributions: [],
            metric,
            result,
        });
        expect(root.dataset.state).toBe('empty');
        expect(
            root.querySelectorAll('.metric-distribution--section')
        ).toHaveLength(0);
        expect(
            root.querySelector('.metric-distribution--message')
        ).not.toBeNull();
    });

    test('refuses site rows that would need summing, rather than summing them', () => {
        const { metric, distributions } = cases[0].data;
        const siteRows = ['0001', '0002'].flatMap((GroupID) =>
            distributions.map((row) => ({
                ...row,
                GroupLevel: 'Site',
                GroupID,
            }))
        );
        expect(() =>
            metricDistribution(container, { distributions: siteRows, metric })
        ).toThrow();
        expect(container.children).toHaveLength(0);
    });
});
