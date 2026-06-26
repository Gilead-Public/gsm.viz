/**
 * Apply layered bar widths to datasets using a linear taper.
 *
 * The first dataset is the widest (drawn in back) and the last is the
 * narrowest (drawn in front). Each dataset receives a `barPercentage`
 * value that tapers linearly from `maxWidth` (0.9) to `minWidth` (0.3).
 *
 * `categoryPercentage` is set to 1.0 so the widest bar fills the full
 * category slot without additional padding.
 *
 * A minimum `borderWidth` of 1 is ensured on every dataset so that
 * overlapping layers are visually distinguishable.
 *
 * @param {Array} datasets - Chart.js dataset objects (mutated in place)
 */
export default function applyLayerWidths(datasets) {
    const n = datasets.length;
    if (n === 0) return;

    const maxWidth = 0.9;
    const minWidth = 0.3;
    const step = n > 1 ? (maxWidth - minWidth) / (n - 1) : 0;

    for (let i = 0; i < n; i++) {
        const ds = datasets[i];
        ds.barPercentage = maxWidth - i * step;
        ds.categoryPercentage = 1.0;
        // Disable Chart.js grouping so bars overlap at the same position
        // instead of being dodged side-by-side.
        ds.grouped = false;

        if (!ds.borderWidth || ds.borderWidth < 1) {
            ds.borderWidth = 1;
        }
    }
}
