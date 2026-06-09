import fillLabelCallback from './fillLabelCallback.js';

export default function buildTooltip(tooltip, position) {
    const base = { enabled: true, ...tooltip };

    if (position !== 'fill') return base;
    if (base.callbacks?.label) return base;

    return {
        ...base,
        callbacks: {
            ...base.callbacks,
            label: fillLabelCallback,
        },
    };
}
