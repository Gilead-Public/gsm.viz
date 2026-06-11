import { format as d3Format } from 'd3';
import getContrastColor from '../structureData/getContrastColor.js';

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

// When dynamicCategoryLegendOnClick hides a dataset it empties dataset.data and
// stores the original points in dataset._backup_. Use the backup when available so
// hidden groups still contribute to the category total.
function getDataForTotal(dataset) {
    return dataset._backup_ ?? dataset.data ?? [];
}

function getRawTotal(context) {
    const point = getPoint(context);
    const category = getCategory(point, context);

    return context.chart.data.datasets.reduce((total, dataset) => {
        const match = getDataForTotal(dataset).find(
            (p) => getCategory(p, context) === category
        );
        return total + getRawValue(match, context);
    }, 0);
}

// Sum only datasets that are currently visible (not hidden by legend toggle or
// dynamicCategoryAxis). Used for total/inside annotation labels so the displayed
// total reflects what the user sees.
function getVisibleRawTotal(context) {
    const point = getPoint(context);
    const category = getCategory(point, context);

    return context.chart.data.datasets.reduce((total, dataset, i) => {
        if (dataset._backup_) return total;
        if (!isDatasetVisible(context.chart, i)) return total;
        const match = dataset.data.find(
            (p) => getCategory(p, context) === category
        );
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

    if (mode === 'total') {
        return { value: getVisibleRawTotal(context), valueType: 'raw' };
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
    const placement = options.placement ?? 'center';
    const isEnd = placement === 'end';

    const config = {
        display: (context) => isLargeEnoughForSegment(context, options),
        formatter: (value, context) =>
            formatLabel(value, context, options, 'segment', spec),
        anchor: () => 'end',
        align: isEnd
            ? (context) =>
                  context.chart.options?.indexAxis === 'y' ? 'right' : 'end'
            : () => 'center',
    };

    if (!isEnd) {
        config.anchor = () => 'center';
    }

    if (options.color !== undefined) {
        config.color = options.color;
    } else {
        config.color = (context) =>
            getContrastColor(context.dataset.backgroundColor);
    }

    if (options.font !== undefined) {
        config.font = options.font;
    }

    return config;
}

function buildTotalLabel(options, spec) {
    const placement = options.placement ?? 'outside';
    const align = placement === 'inside' ? () => 'start' : () => 'end';

    return withStyle(
        {
            display: (context) => isLastVisibleDatasetForCategory(context),
            formatter: (value, context) =>
                formatLabel(value, context, options, 'total', spec),
            anchor: () => 'end',
            align,
            offset: 4,
        },
        options
    );
}

export default function dataLabels(spec) {
    const labels = spec.annotations?.labels;

    if (!labels?.segment?.display && !labels?.total?.display) {
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

    return config;
}
