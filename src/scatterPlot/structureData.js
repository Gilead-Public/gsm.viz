import structureGroupMetadata from '../util/structureGroupMetadata.js';
import mutate from './structureData/mutate.js';
import scriptableOptions from './structureData/scriptableOptions.js';
import colorScheme from '../util/colorScheme.js';
import rollupBounds from './structureData/rollupBounds.js';
import falsy from '../util/falsy.js';
import predictBounds from './predictBounds.js';

/**
 * Given input data, returns an array of arrays, each of which map to one or more graphical elements
 * in the visualization.
 *
 * @param {Array} _results_ - input data where each array item is an object of key-value pairs
 * @param {Object} config - chart configuration and metadata
 * @param {Array} _bounds_ - optional auxiliary data plotted as a line representing bounds
 * @param {Array} _groupMetadata_ - optional group metadata
 *
 * @returns {Array} data formatted for consumption by Chart.js
 */
export default function structureData(
    _results_,
    config,
    _bounds_,
    _groupMetadata_ = null
) {
    const groupMetadata = structureGroupMetadata(_groupMetadata_, config);

    // Modify properties and sort order of data.
    const data = mutate(_results_, config, groupMetadata);

    // Define array of Chart.js dataset objects.
    let datasets = [
        {
            data,
            label: '',
            listenClick: true,
            listenHover: true,
            type: 'scatter',
            ...scriptableOptions(),
        },
        ...colorScheme.map((color) => {
            const dataset = {
                type: 'scatter',
                label: color.description,
                backgroundColor: color.rgba,
                borderColor: color.color,
            };
            dataset.backgroundColor.opacity = 0.5;
            dataset.backgroundColor = dataset.backgroundColor + '';

            return dataset;
        }),
    ];

    // Add predicted bounds dataset objects.
    const boundsData =
        _bounds_ == null || Array.isArray(_bounds_) === false
            ? predictBounds(_results_, config)
            : _bounds_;
    const bounds = rollupBounds(boundsData, config);
    if (bounds !== undefined)
        bounds.forEach((bound) => {
            datasets.push(bound);
        });

    // If no unevaluable analysis output exists, remove corresponding dataset object (No Flag).
    if (data.every((d) => falsy.includes(d.Flag) === false))
        datasets = datasets.filter((d) => d.label !== 'No Flag');

    return datasets;
}
