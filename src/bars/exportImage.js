/**
 * Download a bars chart as a PNG file.
 *
 * The chart already has a white background applied by the
 * displayWhiteBackground plugin, so toBase64Image() produces a clean,
 * opaque PNG suitable for inclusion in documents.
 *
 * @param {Object} chart    - Chart.js chart instance
 * @param {string} [filename='bars.png'] - target download filename
 */
export default function exportImage(chart, filename = 'bars.png') {
    const dataURL = chart.toBase64Image();
    const a = document.createElement('a');
    a.download = filename;
    a.href = dataURL;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
}
