function toFilename(value) {
    if (typeof value !== 'string') {
        return '';
    }

    return value
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .trim()
        .replace(/\s+/g, '-');
}

/**
 * Derive a deterministic PNG filename from a points spec.
 *
 * @param {Object} [spec] - Merged or partial points spec.
 * @returns {string} Filename including the PNG extension.
 */
export default function defaultFilename(spec) {
    const { labels = {}, scales = {}, mapping = {} } = spec || {};
    const title = toFilename(labels.title);

    if (title) {
        return `${title}.png`;
    }

    const x = toFilename(scales.x?.label || mapping.x);
    const y = toFilename(scales.y?.label || mapping.y);

    return x && y ? `${y}-by-${x}.png` : 'points.png';
}
