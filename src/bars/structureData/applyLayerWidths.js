/**
 * Apply layered bar widths to datasets using a linear taper.
 *
 * Chart.js draws datasets in reverse index order (last index first, behind
 * all others). To place the widest bar in the back and the narrowest in
 * front, we reverse the dataset array so that the first fill group ends up
 * at the highest index (drawn first / behind) and the last fill group ends
 * up at index 0 (drawn last / in front).
 *
 * After reversing, widths are assigned ascending: the front-most dataset
 * (index 0, originally last in fill order) gets `minWidth` (0.3) and the
 * back-most dataset (highest index, originally first in fill order) gets
 * `maxWidth` (0.9).
 *
 * `categoryPercentage` is set to 1.0 so the widest bar fills the full
 * category slot without additional padding.
 *
 * `grouped` is set to `false` so Chart.js overlaps bars at the same
 * categorical position instead of dodging them side-by-side.
 *
 * A minimum `borderWidth` of 1 is ensured on every dataset so that
 * overlapping layers are visually distinguishable.
 *
 * @param {Array} datasets - Chart.js dataset objects (mutated in place)
 */
export default function applyLayerWidths(datasets) {
    const n = datasets.length;
    if (n === 0) return;

    // Reverse so first fill group (widest) is at the highest index (drawn
    // first by Chart.js, behind all others).
    datasets.reverse();

    const maxWidth = 0.9;
    const minWidth = 0.3;
    const step = n > 1 ? (maxWidth - minWidth) / (n - 1) : 0;

    for (let i = 0; i < n; i++) {
        const ds = datasets[i];
        // Ascending: index 0 (front, last fill group) = narrowest,
        // index N-1 (back, first fill group) = widest.
        // Single dataset always gets maxWidth.
        ds.barPercentage = n === 1 ? maxWidth : minWidth + i * step;
        ds.categoryPercentage = 1.0;
        ds.grouped = false;

        if (!ds.borderWidth || ds.borderWidth < 1) {
            ds.borderWidth = 1;
        }
    }
}
