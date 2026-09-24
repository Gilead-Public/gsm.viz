import defaultFilename from './defaultFilename.js';

/**
 * Download a points chart as an opaque PNG.
 *
 * @param {Object} chart - Chart.js points chart.
 * @param {string} [filename] - Explicit download name.
 */
export default function exportImage(chart, filename) {
    if (
        filename !== undefined &&
        (typeof filename !== 'string' || filename.trim().length === 0)
    ) {
        throw new Error(
            'points exportImage filename must be a non-empty string'
        );
    }

    const name = filename ?? defaultFilename(chart.data?._spec_);
    const link = document.createElement('a');
    link.download = name;
    link.href = chart.toBase64Image();
    document.body.appendChild(link);

    try {
        link.click();
    } finally {
        document.body.removeChild(link);
    }
}
