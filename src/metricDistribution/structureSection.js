import { NOT_RECORDED } from './defaults.js';
import { formatCount } from './format.js';
import orderCategories from './orderCategories.js';

const FOOTNOTES = {
    multipleCategories: (total) =>
        `Some records fall in more than one category, so the counts add up to more than ${formatCount(
            total
        )}.`,
    notRecorded: () => `${NOT_RECORDED}: the source value was blank.`,
};

function populationLabel(population) {
    return population ? `% of ${population}` : '%';
}

function defaultLabel(value, source, metric) {
    if (value === 'count') return 'n';
    if (value === 'percent' && source === 'Numerator') {
        return populationLabel(metric.Numerator);
    }
    if (value === 'percent' && source !== 'Denominator') return '%';
    return populationLabel(metric.Denominator);
}

// One value per bar: a Denominator section is a status breakdown and shows
// each category's share of that population; any other section shows counts.
function defaultValues(source) {
    return source === 'Denominator' ? ['percent'] : ['count'];
}

function sumPercent(rows) {
    return rows.some((row) => typeof row.Percent !== 'number')
        ? null
        : rows.reduce((sum, row) => sum + row.Percent, 0);
}

function categoryColor(category, status, spec) {
    if (!status) return spec.theme.barColor;
    return Object.prototype.hasOwnProperty.call(spec.colors, category)
        ? spec.colors[category]
        : spec.theme.neutralColor;
}

/**
 * Build the view model of one Source × Variable section.
 *
 * @param {Array} rows - the section's distribution rows
 * @param {Object} section - { source, variable } plus optional section options
 * @param {Object} spec - merged spec
 * @param {Object} data - { metric, result }
 * @returns {Object} section view model
 */
export default function structureSection(
    rows,
    section,
    spec,
    { metric, result }
) {
    const { source, variable } = section;
    const values = section.values ?? spec.values ?? defaultValues(source);
    const columns = values.map((value) => ({
        value,
        label:
            section.labels?.[value] ??
            spec.labels[value] ??
            defaultLabel(value, source, metric),
    }));
    const total = rows.length ? rows[0].Total : null;
    const denominator = result?.Denominator > 0 ? result.Denominator : null;

    const bar = (kind, label, count, percent, color, tooltip) => ({
        kind,
        label,
        count,
        percent,
        percentOfDenominator: denominator === null ? null : count / denominator,
        color,
        tooltip:
            tooltip ??
            `${label}: ${formatCount(count)} of ${formatCount(total)}`,
    });

    const { shown, collapsed, notRecorded } = orderCategories(
        rows,
        section.topN ?? spec.topN
    );
    const bars = shown.map((row) =>
        bar(
            'category',
            row.Category,
            row.Count,
            row.Percent ?? null,
            categoryColor(row.Category, section.status === true, spec)
        )
    );

    if (collapsed.length) {
        const label = `+ ${collapsed.length} more`;
        const count = collapsed.reduce((sum, row) => sum + row.Count, 0);
        const detail = collapsed
            .map((row) => `${row.Category}: ${formatCount(row.Count)}`)
            .join(', ');
        bars.push(
            bar(
                'more',
                label,
                count,
                sumPercent(collapsed),
                spec.theme.neutralColor,
                `${label}: ${formatCount(count)} of ${formatCount(
                    total
                )} (${detail})`
            )
        );
    }

    if (notRecorded) {
        bars.push(
            bar(
                'notRecorded',
                NOT_RECORDED,
                notRecorded.Count,
                notRecorded.Percent ?? null,
                spec.theme.neutralColor
            )
        );
    }

    const maxCount = Math.max(0, ...bars.map((b) => b.count));
    bars.forEach((b) => {
        b.width = maxCount > 0 ? b.count / maxCount : 0;
    });

    const footnotes = [];
    if (rows.reduce((sum, row) => sum + row.Count, 0) > total) {
        footnotes.push(FOOTNOTES.multipleCategories(total));
    }
    if (notRecorded) footnotes.push(FOOTNOTES.notRecorded());

    return {
        source,
        variable,
        title: section.title ?? variable,
        total,
        empty: rows.length === 0,
        columns,
        bars,
        footnotes,
    };
}
