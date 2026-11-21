import structureSection from './structureSection.js';

const SOURCE_ORDER = ['Numerator', 'Denominator'];

function sourceRank(source) {
    const rank = SOURCE_ORDER.indexOf(source);
    return rank === -1 ? SOURCE_ORDER.length : rank;
}

function sectionKey(source, variable) {
    return JSON.stringify([source, variable]);
}

function groupRows(rows) {
    const groups = new Map();
    rows.forEach((row) => {
        const key = sectionKey(row.Source, row.Variable);
        if (!groups.has(key)) {
            groups.set(key, {
                section: { source: row.Source, variable: row.Variable },
                rows: [],
            });
        }
        groups.get(key).rows.push(row);
    });
    return groups;
}

// Without requested sections, show every section: the metric's numerator
// first, then its denominator, otherwise in order of first appearance.
function defaultSections(groups) {
    return [...groups.values()]
        .map(({ section }, index) => ({ section, index }))
        .sort(
            (a, b) =>
                sourceRank(a.section.source) - sourceRank(b.section.source) ||
                a.index - b.index
        )
        .map(({ section }) => section);
}

/**
 * Build the metricDistribution view model.
 *
 * @param {Object} data - validated { distributions, metric, result }
 * @param {Object} spec - merged spec
 * @returns {{state: string, sections: Array}} 'missing' without
 *  distributions, 'empty' when no displayed section has rows, else 'ok'
 */
export default function structureData(data, spec) {
    if (data.distributions === undefined || data.distributions === null) {
        return { state: 'missing', sections: [] };
    }

    const groups = groupRows(data.distributions);
    const sections = (spec.sections ?? defaultSections(groups)).map((section) =>
        structureSection(
            groups.get(sectionKey(section.source, section.variable))?.rows ??
                [],
            section,
            spec,
            data
        )
    );

    if (sections.every((section) => section.empty)) {
        return { state: 'empty', sections: [] };
    }

    return { state: 'ok', sections };
}
