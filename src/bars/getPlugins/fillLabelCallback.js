export default function fillLabelCallback(context) {
    const indexAxis = context.chart?.options?.indexAxis || 'x';
    const pct = indexAxis === 'y' ? context.parsed.x : context.parsed.y;
    const prefix = context.dataset.label ? `${context.dataset.label}: ` : '';
    return `${prefix}${pct.toFixed(1)}%`;
}
