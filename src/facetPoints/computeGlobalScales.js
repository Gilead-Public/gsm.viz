import structureData from '../points/structureData.js';
import structureLines from '../points/structureLines.js';

function collectDatasetValues(domains, datasets) {
    datasets.forEach((dataset) => {
        dataset.data.forEach(({ x, y }) => {
            domains.x.push(x);
            domains.y.push(y);
        });
    });
}

function collectReferenceValues(domains, spec) {
    spec.annotations.referenceLines.forEach((line, index) => {
        if (!Number.isFinite(line.value)) {
            throw new Error(
                `spec.annotations.referenceLines[${index}].value must be a finite number`
            );
        }
        if (spec.scales[line.axis].type === 'log' && line.value <= 0) {
            throw new Error(
                `spec.annotations.referenceLines[${index}].value must be greater than zero for a log scale`
            );
        }
        domains[line.axis].push(line.value);
    });
}

function expandEqualDomain(value, scale) {
    if (scale.type === 'log') {
        const factor = Math.sqrt(10);
        const lower = value / factor;
        const upper = value * factor;
        const min =
            Number.isFinite(lower) && lower > 0 && lower < value
                ? lower
                : value;
        const max = Number.isFinite(upper) && upper > value ? upper : value;

        if (min < max) return [min, max];
        throw new Error(`unable to derive a positive domain around ${value}`);
    }
    if (scale.beginAtZero && value === 0) {
        return [0, 1];
    }

    const offset = Math.abs(value * 0.05) || 1;
    const min = value - offset;
    const max = value + offset;
    if (Number.isFinite(min) && Number.isFinite(max) && min < max) {
        return [min, max];
    }

    const inner = value / 1.05;
    if (value > 0 && inner < value) return [inner, value];
    if (value < 0 && inner > value) return [value, inner];

    throw new Error(`unable to derive a finite domain around ${value}`);
}

function getDomain(values, scale) {
    if (scale.range !== undefined) {
        return [...scale.range];
    }
    if (values.length === 0) {
        return undefined;
    }

    let min = Infinity;
    let max = -Infinity;
    values.forEach((value) => {
        min = Math.min(min, value);
        max = Math.max(max, value);
    });
    if (scale.type === 'linear' && scale.beginAtZero) {
        min = Math.min(0, min);
        max = Math.max(0, max);
    }

    return min === max ? expandEqualDomain(min, scale) : [min, max];
}

function addDomain(result, axis, values, spec) {
    if (spec.facet.scales[axis].free) return;

    const domain = getDomain(values, spec.scales[axis]);
    if (domain !== undefined) {
        result[`${axis}Min`] = domain[0];
        result[`${axis}Max`] = domain[1];
    }
}

/**
 * Compute fixed x/y domains from every rendered point and annotation.
 *
 * @param {Map<*, Array>} facetDataMap - Ordered rendered facet rows.
 * @param {Object} spec - Merged facet points spec.
 * @returns {{xMin?: number, xMax?: number, yMin?: number, yMax?: number}}
 */
export default function computeGlobalScales(facetDataMap, spec) {
    const domains = { x: [], y: [] };

    facetDataMap.forEach((facetData) => {
        const pointData = structureData({ ...spec, data: facetData });
        collectDatasetValues(domains, pointData.datasets);
    });
    collectDatasetValues(domains, structureLines(spec));
    collectReferenceValues(domains, spec);

    const result = {};
    addDomain(result, 'x', domains.x, spec);
    addDomain(result, 'y', domains.y, spec);
    return result;
}
