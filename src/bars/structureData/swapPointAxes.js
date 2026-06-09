/**
 * Swap x and y on every data point in every dataset.
 *
 * Used for horizontal orientation where Chart.js expects
 * { x: value, y: category } when indexAxis is 'y'.
 *
 * @param {Array<Object>} datasets - Chart.js datasets containing point data
 * @returns {void}
 */
export default function swapPointAxes(datasets) {
    for (const ds of datasets) {
        for (const point of ds.data) {
            const tmp = point.x;
            point.x = point.y;
            point.y = tmp;
        }
    }
}
