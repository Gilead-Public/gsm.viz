/**
 * Sanitize an arbitrary string into a valid, lowercase, dash-separated
 * filename stem (without extension).
 *
 * @param {string} str
 * @returns {string}
 */
function toFilename(str) {
    return str
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .trim()
        .replace(/\s+/g, '-');
}

/**
 * Derive a default PNG filename stem from a bars spec using the following
 * priority order:
 *
 *  1. spec.labels.title
 *  2. spec.scales.fill.label + "-by-" + spec.scales.x.label
 *  3. spec.mapping.fill (if set) + "-by-" + spec.mapping.x
 *  4. "bars" (hard fallback)
 *
 * @param {Object} [spec]
 * @returns {string} filename including ".png" extension
 */
export default function defaultFilename(spec) {
    const { labels = {}, scales = {}, mapping = {} } = spec || {};

    if (labels.title) {
        return toFilename(labels.title) + '.png';
    }

    if (scales.fill?.label && scales.x?.label) {
        return (
            toFilename(scales.fill.label) +
            '-by-' +
            toFilename(scales.x.label) +
            '.png'
        );
    }

    if (mapping.x) {
        const prefix = mapping.fill ? toFilename(mapping.fill) + '-by-' : '';
        return prefix + toFilename(mapping.x) + '.png';
    }

    return 'bars.png';
}
