/**
 * Download a bars chart as a PNG file.
 *
 * The chart already has a white background applied by the
 * displayWhiteBackground plugin, so toBase64Image() produces a clean,
 * opaque PNG suitable for inclusion in documents.
 *
 * When no filename is supplied the name is derived from the chart spec
 * using the following priority order:
 *  1. spec.labels.title (sanitized)
 *  2. spec.scales.fill.label + "-by-" + spec.scales.x.label
 *  3. spec.mapping.fill (if set) + "-by-" + spec.mapping.x
 *  4. "bars.png" (hard fallback)
 *
 * @param {Object} chart    - Chart.js chart instance
 * @param {string} [filename] - target download filename; auto-derived when omitted
 */
import defaultFilename from './defaultFilename.js';

export default function exportImage(chart, filename) {
    const name =
        filename !== undefined
            ? filename
            : defaultFilename(chart.data?._spec_);
    const dataURL = chart.toBase64Image();
    const a = document.createElement('a');
    a.download = name;
    a.href = dataURL;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
}
