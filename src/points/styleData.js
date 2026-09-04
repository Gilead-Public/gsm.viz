import { color as parseColor } from 'd3';

function clamp(value, minimum, maximum) {
    return Math.min(Math.max(value, minimum), maximum);
}

export function mapSizeValue(value, domain, range) {
    if (domain[0] === domain[1]) {
        return (range[0] + range[1]) / 2;
    }

    const proportion = clamp(
        (value - domain[0]) / (domain[1] - domain[0]),
        0,
        1
    );
    const minimumArea = range[0] ** 2;
    const maximumArea = range[1] ** 2;

    return Math.sqrt(minimumArea + proportion * (maximumArea - minimumArea));
}

export function mapOpacityValue(value, domain, range) {
    if (domain[0] === domain[1]) {
        return (range[0] + range[1]) / 2;
    }

    const proportion = clamp(
        (value - domain[0]) / (domain[1] - domain[0]),
        0,
        1
    );

    return range[0] + proportion * (range[1] - range[0]);
}

export function withOpacity(color, opacity) {
    const parsed = parseColor(color);

    if (!parsed) {
        throw new Error(
            `points could not apply opacity to color ${JSON.stringify(color)}`
        );
    }

    parsed.opacity = opacity;
    return parsed.formatRgb();
}

export function withOpacityFactor(color, factor) {
    const parsed = parseColor(color);

    if (!parsed) {
        throw new Error(
            `points could not apply opacity to color ${JSON.stringify(color)}`
        );
    }

    parsed.opacity = Number((parsed.opacity * factor).toFixed(6));
    return parsed.formatRgb();
}

function getDomain(points, field) {
    let minimum = Infinity;
    let maximum = -Infinity;

    points.forEach((point) => {
        minimum = Math.min(minimum, point[field]);
        maximum = Math.max(maximum, point[field]);
    });

    return [minimum, maximum];
}

/**
 * Apply continuous size and opacity aesthetics to structured point datasets.
 *
 * @param {Array} datasets - Chart.js point datasets.
 * @param {Object} spec - Merged points specification.
 * @returns {Array} The styled datasets.
 */
export default function styleData(datasets, spec) {
    const points = datasets.flatMap((dataset) => dataset.data);

    if (points.length === 0) return datasets;

    const sizeDomain = spec.mapping.size
        ? getDomain(points, '_size')
        : undefined;
    const opacityDomain = spec.mapping.opacity
        ? getDomain(points, '_opacity')
        : undefined;

    datasets.forEach((dataset) => {
        if (sizeDomain) {
            dataset.pointRadius = dataset.data.map((point) =>
                mapSizeValue(point._size, sizeDomain, spec.scales.size.range)
            );
            dataset.pointHoverRadius = dataset.pointRadius.map(
                (radius) => radius + 2
            );
        }

        if (opacityDomain && dataset.data.length > 0) {
            const baseColor =
                dataset.backgroundColor ?? spec.scales.color.palette[0];
            const colors = dataset.data.map((point) =>
                withOpacity(
                    baseColor,
                    mapOpacityValue(
                        point._opacity,
                        opacityDomain,
                        spec.scales.opacity.range
                    )
                )
            );

            dataset.backgroundColor = colors;
            dataset.borderColor = [...colors];
        }
    });

    return datasets;
}
