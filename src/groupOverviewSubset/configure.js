import configureAll from '../util/configure.js';

/**
 * Merge custom groupOverviewSubset settings with defaults.
 *
 * @param {Object} _config_ - user-provided configuration
 *
 * @returns {Object} merged configuration
 */
export default function configure(_config_) {
    const defaults = {};

    // Optional mount point for filter UI (Node, selector string, or null).
    // When null a container is inserted above the table's parent element.
    defaults.container = null;

    // Display label → group metadata Param key, e.g. { Country: 'country' }.
    defaults.groupCharacteristics = {};

    // Initial filter values keyed by filter id.
    //   Categorical: status: ['Active', 'Closed']
    //   Range:       siteRiskScore: { min: 10, max: 100 }
    defaults.initialSubset = {};

    // Which default filters to render.
    defaults.defaultFilters = ['anyFlag', 'siteRiskScore', 'numberEnrolled'];

    // Range control variant: 'inputs' (two <input type="number">) or
    // 'dualRange' (two <input type="range">).
    defaults.rangeControl = 'inputs';

    const config = configureAll(defaults, _config_);

    return config;
}
