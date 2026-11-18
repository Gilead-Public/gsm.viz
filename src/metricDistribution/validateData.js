import isPlainObject from './isPlainObject.js';
import { RESULT_VALUES, parseResultValue } from './normalizeResult.js';

function isSet(value) {
    return value !== undefined && value !== null;
}

function isCount(value) {
    return typeof value === 'number' && Number.isFinite(value) && value >= 0;
}

function isOptionalNumber(value) {
    return (
        value === null ||
        value === undefined ||
        (typeof value === 'number' && Number.isFinite(value))
    );
}

function validateRow(row, path) {
    if (!isPlainObject(row)) {
        throw new Error(`${path} must be a plain object`);
    }
    ['Source', 'Variable'].forEach((field) => {
        if (typeof row[field] !== 'string' || row[field] === '') {
            throw new Error(`${path}.${field} must be a non-empty string`);
        }
    });
    if (
        row.Category !== undefined &&
        row.Category !== null &&
        typeof row.Category !== 'string'
    ) {
        throw new Error(`${path}.Category must be a string or null`);
    }
    ['Count', 'Total'].forEach((field) => {
        if (!isCount(row[field])) {
            throw new Error(
                `${path}.${field} must be a non-negative finite number`
            );
        }
    });
    if (
        !isOptionalNumber(row.Percent) ||
        (typeof row.Percent === 'number' &&
            (row.Percent < 0 || row.Percent > 1))
    ) {
        throw new Error(
            `${path}.Percent must be a number between 0 and 1, or null`
        );
    }
}

function categoryName(category) {
    return category === null || category === undefined
        ? 'blank'
        : JSON.stringify(category);
}

function validateRows(rows) {
    if (!Array.isArray(rows)) {
        throw new Error('data.distributions must be an array');
    }

    const totals = new Map();
    const categories = new Set();
    const groups = new Set();
    const metrics = new Set();
    const studies = new Set();
    const snapshots = new Set();

    rows.forEach((row, i) => {
        validateRow(row, `data.distributions[${i}]`);

        const section = `${row.Source} / ${row.Variable}`;
        const category = `${section} / ${categoryName(row.Category)}`;
        if (categories.has(category)) {
            throw new Error(
                `data.distributions has more than one row for ${category}; sum rows to one group before display`
            );
        }
        categories.add(category);

        if (totals.has(section) && totals.get(section) !== row.Total) {
            throw new Error(
                `data.distributions has more than one Total for ${section}`
            );
        }
        totals.set(section, row.Total);

        if (row.GroupLevel !== undefined || row.GroupID !== undefined) {
            groups.add(`${row.GroupLevel} ${row.GroupID}`);
        }
        if (row.MetricID !== undefined) metrics.add(row.MetricID);
        if (isSet(row.StudyID)) studies.add(String(row.StudyID));
        if (isSet(row.SnapshotDate)) snapshots.add(String(row.SnapshotDate));
    });

    if (groups.size > 1) {
        throw new Error('data.distributions must contain rows for one group');
    }
    if (metrics.size > 1) {
        throw new Error('data.distributions must contain rows for one metric');
    }

    if (studies.size > 1) {
        throw new Error('data.distributions must contain rows for one study');
    }
    if (snapshots.size > 1) {
        throw new Error(
            'data.distributions must contain rows for one snapshot'
        );
    }

    return {
        group: [...groups][0],
        metricId: [...metrics][0],
        studyId: [...studies][0],
        snapshotDate: [...snapshots][0],
    };
}

function validateResultScope(result, field, name, expected) {
    if (
        isSet(expected) &&
        isSet(result[field]) &&
        String(result[field]) !== String(expected)
    ) {
        throw new Error(
            `data.result is for ${name} ${result[field]} but the rows are for ${expected}`
        );
    }
}

function validateResult(result, metricId, rowScope) {
    const { group } = rowScope;
    if (!isPlainObject(result)) {
        throw new Error('data.result must be a plain object');
    }
    RESULT_VALUES.forEach((field) => {
        const value = parseResultValue(result[field]);
        if (value !== null && !Number.isFinite(value)) {
            throw new Error(
                `data.result.${field} must be a finite number, a numeric string, or unavailable (null, '' or 'NA')`
            );
        }
    });
    if (
        metricId !== undefined &&
        result.MetricID !== undefined &&
        result.MetricID !== metricId
    ) {
        throw new Error(
            `data.result is for ${result.MetricID} but data.metric is ${metricId}`
        );
    }
    const resultGroup = `${result.GroupLevel} ${result.GroupID}`;
    if (
        group !== undefined &&
        result.GroupID !== undefined &&
        resultGroup !== group
    ) {
        throw new Error(
            `data.result is for ${resultGroup} but the rows are for ${group}`
        );
    }
    validateResultScope(result, 'MetricID', 'metric', rowScope.metricId);
    validateResultScope(result, 'StudyID', 'study', rowScope.studyId);
    validateResultScope(
        result,
        'SnapshotDate',
        'snapshot',
        rowScope.snapshotDate
    );
}

/**
 * Validate the metricDistribution data object.
 *
 * @param {Object} data - { distributions, metric, result }
 * @throws {Error} if the inputs are not one metric's rows for one group in
 *  one study snapshot
 */
export default function validateData(data) {
    if (!isPlainObject(data)) {
        throw new Error('data must be a plain object');
    }

    const { distributions, metric, result } = data;

    if (!isPlainObject(metric)) {
        throw new Error('data.metric must be a plain object');
    }
    if (typeof metric.Metric !== 'string' || metric.Metric === '') {
        throw new Error('data.metric.Metric must be a non-empty string');
    }

    let rowScope = {};
    if (distributions !== undefined && distributions !== null) {
        rowScope = validateRows(distributions);
    }

    if (
        rowScope.metricId !== undefined &&
        metric.MetricID !== undefined &&
        rowScope.metricId !== metric.MetricID
    ) {
        throw new Error(
            `data.distributions rows are for ${rowScope.metricId} but data.metric is ${metric.MetricID}`
        );
    }

    if (result !== undefined && result !== null) {
        validateResult(result, metric.MetricID, rowScope);
    }
}
