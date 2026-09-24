/**
 * Translate the merged points zoom spec into chartjs-plugin-zoom options.
 *
 * @param {Object} zoom - Merged zoom settings.
 * @returns {Object|undefined} Chart.js plugin options when zoom is enabled.
 */
export default function buildZoom(zoom) {
    if (!zoom?.enabled) {
        return undefined;
    }

    return {
        pan: {
            enabled: zoom.pan,
            mode: zoom.mode,
        },
        zoom: {
            mode: zoom.mode,
            wheel: {
                enabled: zoom.wheel,
            },
            pinch: {
                enabled: zoom.pinch,
            },
        },
    };
}
