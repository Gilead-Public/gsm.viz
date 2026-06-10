import { format as d3Format } from 'd3';

function getValueKey(context) {
    return context.chart.options?.indexAxis === 'y' ? 'x' : 'y';
}

function getCategoryKey(context) {
    return context.chart.options?.indexAxis === 'y' ? 'y' : 'x';
}

function toNumber(value) {
    const numeric = Number(value);
    return Number.isFinite(numeric) ? numeric : 0;
}

function getPoint(context) {
    return context.dataset.data[context.dataIndex];
}

function getRenderedValue(point, context) {
    return toNumber(point?.[getValueKey(context)]);
}

function getRawValue(point, context) {
    return point?._rawY !== undefined
        ? toNumber(point._rawY)
        : getRenderedValue(point, context);
}

function getCategory(point, context) {
    return point?.[getCategoryKey(context)];
}

function isDatasetVisible(chart, datasetIndex) {
    return typeof chart.isDatasetVisible === 'function'
        ? chart.isDatasetVisible(datasetIndex)
        : true;
}

function findPointForCategory(dataset, category, context) {
    return dataset.data.find(
        (point) => getCategory(point, context) === category
    );
}

function getRawTotal(context) {
    const point = getPoint(context);
    const category = getCategory(point, context);

    return context.chart.data.datasets.reduce((total, dataset) => {
        const match = findPointForCategory(dataset, category, context);
        return total + getRawValue(match, context);
    }, 0);
}

function getSpec(context, spec) {
    return context.chart.data?._spec_ || spec;
}

function getPercentValue(point, context, spec) {
    const rendered = getRenderedValue(point, context);
    if (getSpec(context, spec)?.position === 'fill') return rendered;

    const total = getRawTotal(context);
    return total === 0 ? 0 : (getRawValue(point, context) / total) * 100;
}

function resolveLabelValue(point, context, options, mode, spec) {
    const configuredValue = options.value ?? 'auto';
    const valueType =
        configuredValue === 'auto'
            ? getSpec(context, spec)?.position === 'fill'
                ? 'percent'
                : 'raw'
            : configuredValue;

    if (mode === 'total' || mode === 'inside') {
        return { value: getRawTotal(context), valueType: 'raw' };
    }

    if (valueType === 'percent') {
        return {
            value: getPercentValue(point, context, spec),
            valueType,
        };
    }

    if (valueType === 'value') {
        return {
            value: getRenderedValue(point, context),
            valueType,
        };
    }

    return {
        value: getRawValue(point, context),
        valueType: 'raw',
    };
}

function defaultFormat(value, valueType) {
    const formatter =
        valueType === 'percent' ? d3Format('.1f') : d3Format('~g');
    const suffix = valueType === 'percent' ? '%' : '';
    return `${formatter(value)}${suffix}`;
}

function formatLabel(point, context, options, mode, spec) {
    const { value, valueType } = resolveLabelValue(
        point,
        context,
        options,
        mode,
        spec
    );

    if (typeof options.formatter === 'function') {
        const details = {
            mode,
            valueType,
            point,
            total: mode === 'total' ? value : getRawTotal(context),
        };
        return options.formatter(value, context, details);
    }

    if (options.format) {
        const usesPercentFormat = options.format.includes('%');
        const formatValue =
            valueType === 'percent' && usesPercentFormat ? value / 100 : value;
        const suffix = valueType === 'percent' && !usesPercentFormat ? '%' : '';
        return `${d3Format(options.format)(formatValue)}${suffix}`;
    }

    return defaultFormat(value, valueType);
}

function hasVisibleValueForCategory(context, datasetIndex, category) {
    if (!isDatasetVisible(context.chart, datasetIndex)) return false;
    const dataset = context.chart.data.datasets[datasetIndex];
    const point = findPointForCategory(dataset, category, context);
    return Math.abs(getRawValue(point, context)) > 0;
}

function isLastVisibleDatasetForCategory(context) {
    const point = getPoint(context);
    const category = getCategory(point, context);

    for (
        let i = context.chart.data.datasets.length - 1;
        i >= context.datasetIndex;
        i--
    ) {
        if (hasVisibleValueForCategory(context, i, category)) {
            return i === context.datasetIndex;
        }
    }

    return false;
}

function isLargeEnoughForSegment(context, options) {
    const minSize = options.minSize ?? 0;
    if (!minSize) return true;

    const element = context.chart.getDatasetMeta?.(context.datasetIndex)
        ?.data?.[context.dataIndex];

    if (!element) return true;

    const size =
        context.chart.options?.indexAxis === 'y'
            ? element.width
            : element.height;

    return size === undefined || size >= minSize;
}

function withStyle(config, options) {
    return {
        ...config,
        ...(options.color !== undefined ? { color: options.color } : {}),
        ...(options.font !== undefined ? { font: options.font } : {}),
    };
}

function buildSegmentLabel(options, spec) {
    return withStyle(
        {
            display: (context) => isLargeEnoughForSegment(context, options),
            formatter: (value, context) =>
                formatLabel(value, context, options, 'segment', spec),
            anchor: () => 'center',
            align: () => 'center',
        },
        options
    );
}

function buildTotalLabel(options, spec) {
    return withStyle(
        {
            display: (context) => isLastVisibleDatasetForCategory(context),
            formatter: (value, context) =>
                formatLabel(value, context, options, 'total', spec),
            anchor: () => 'end',
            align: () => 'end',
            offset: 4,
        },
        options
    );
}

function buildInsideLabel(options, spec) {
    return withStyle(
        {
            display: (context) => isLastVisibleDatasetForCategory(context),
            formatter: (value, context) =>
                formatLabel(value, context, options, 'inside', spec),
            anchor: () => 'end',
            align: () => 'start',
            offset: 4,
        },
        options
    );
}

function buildOutsideLabel(options, spec) {
    return withStyle(
        {
            display: () => true,
            formatter: (value, context) =>
                formatLabel(value, context, options, 'outside', spec),
            anchor: () => 'end',
            align: (context) =>
                context.chart.options?.indexAxis === 'y' ? 'right' : 'end',
            offset: 4,
        },
        options
    );
}

export default function dataLabels(spec) {
    const labels = spec.annotations?.labels;

    if (
        !labels?.segment?.display &&
        !labels?.total?.display &&
        !labels?.inside?.display &&
        !labels?.outside?.display
    ) {
        return {
            display: false,
        };
    }

    const config = { labels: {} };

    if (labels.segment?.display) {
        config.labels.segment = buildSegmentLabel(labels.segment, spec);
    }

    if (labels.total?.display) {
        config.labels.total = buildTotalLabel(labels.total, spec);
    }

    if (labels.inside?.display) {
        config.labels.inside = buildInsideLabel(labels.inside, spec);
    }

    if (labels.outside?.display) {
        config.labels.outside = buildOutsideLabel(labels.outside, spec);
    }

    return config;
}
