/**
 * Build the Chart.js zoom plugin configuration from the merged spec.zoom.
 *
 * Returns undefined when zoom is disabled so the caller can omit the key
 * entirely (Chart.js treats an absent zoom config as "no zoom").
 *
 * @param {Object} zoom - merged zoom spec
 * @param {boolean} zoom.enabled - whether zoom is active
 * @param {string} zoom.mode - 'x' | 'y' | 'xy'
 * @param {boolean} zoom.pan - enable panning
 * @param {boolean} zoom.wheel - enable wheel zoom
 * @param {boolean} zoom.pinch - enable pinch zoom
 * @returns {Object|undefined} Chart.js zoom plugin config or undefined
 */
export default function buildZoom(zoom) {
    if (!zoom || !zoom.enabled) {
        return undefined;
    }

    return {
        pan: {
            enabled: zoom.pan,
            mode: zoom.mode,
        },
        zoom: {
            wheel: {
                enabled: zoom.wheel,
            },
            pinch: {
                enabled: zoom.pinch,
            },
            mode: zoom.mode,
        },
    };
}
