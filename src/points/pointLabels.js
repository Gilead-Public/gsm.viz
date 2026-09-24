function getPoint(context, value) {
    return value?._datum ? value : context.dataset?.data?.[context.dataIndex];
}

/**
 * Build chartjs-plugin-datalabels options for selective point labels.
 *
 * @param {Object} spec - Merged points specification.
 * @returns {Object} Datalabel plugin configuration.
 */
export default function pointLabels(spec) {
    const config = spec.annotations?.labels?.point;
    if (!config) return { display: false };

    const display =
        config.display === false
            ? false
            : (context) => {
                  if (context.dataset?._annotation) return false;
                  const point = getPoint(context);
                  if (!point) return false;
                  if (typeof config.display === 'function') {
                      return !!config.display(point, context);
                  }
                  if (typeof config.display === 'string') {
                      return !!point._datum?.[config.display];
                  }
                  return true;
              };

    return {
        align: config.align ?? 'top',
        color: config.color ?? '#333333',
        offset: config.offset ?? 4,
        font: { ...(config.font || {}) },
        display,
        formatter: (value, context) => {
            const point = getPoint(context, value);
            if (!point || context.dataset?._annotation) return null;
            return typeof config.formatter === 'function'
                ? config.formatter(point, context)
                : point._datum[config.field];
        },
    };
}
