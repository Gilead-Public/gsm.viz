import getDatasetIdentity from '../points/datasetIdentity.js';

function getAnnotationOrdinal(datasets, index) {
    return datasets.slice(0, index + 1).filter((dataset) => dataset._annotation)
        .length;
}

function getAnnotationIdentity(dataset, datasets, index) {
    if (!Number.isInteger(dataset._annotationLayer)) {
        return JSON.stringify([
            'annotation',
            getAnnotationOrdinal(datasets, index),
        ]);
    }

    const hasGroup = Object.prototype.hasOwnProperty.call(
        dataset,
        '_annotationGroup'
    );
    const group = !hasGroup
        ? ['ungrouped']
        : dataset._annotationGroupMissing
        ? ['group', 'missing']
        : ['group', typeof dataset._annotationGroup, dataset._annotationGroup];

    return JSON.stringify(['annotation', dataset._annotationLayer, group]);
}

/**
 * Identify a legend dataset by typed point identity or semantic annotation
 * identity (line layer and typed group), falling back to annotation order.
 *
 * @param {Object} chart - Child points chart.
 * @param {number} index - Dataset index.
 * @returns {string} Identity shared by semantically matching siblings.
 */
export default function getLegendIdentity(chart, index) {
    const dataset = chart.data.datasets[index];
    const pointIdentity = getDatasetIdentity(dataset, chart.data._spec_);

    return pointIdentity === undefined
        ? getAnnotationIdentity(dataset, chart.data.datasets, index)
        : pointIdentity;
}
