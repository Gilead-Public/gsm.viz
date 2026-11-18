const UNAVAILABLE = '—';

function isAvailable(value) {
    return typeof value === 'number' && Number.isFinite(value);
}

export function formatCount(value) {
    return isAvailable(value) ? value.toLocaleString('en-US') : UNAVAILABLE;
}

export function formatPercent(proportion) {
    return isAvailable(proportion)
        ? `${(proportion * 100).toFixed(1)}%`
        : UNAVAILABLE;
}
