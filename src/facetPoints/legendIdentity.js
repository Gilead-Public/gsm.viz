import getDatasetIdentity from '../points/datasetIdentity.js';

function getAnnotationOrdinal(datasets, index) {
    return datasets.slice(0, index + 1).filter((dataset) => dataset._annotation)
        .length;
}

/**
 * Identify a legend dataset by typed point identity or annotation order.
 *
 * @param {Object} chart - Child points chart.
 * @param {number} index - Dataset index.
 * @returns {string} Identity shared by semantically matching siblings.
 */
export default function getLegendIdentity(chart, index) {
    const dataset = chart.data.datasets[index];
    const pointIdentity = getDatasetIdentity(dataset, chart.data._spec_);

    return pointIdentity === undefined
        ? JSON.stringify([
              'annotation',
              getAnnotationOrdinal(chart.data.datasets, index),
          ])
        : pointIdentity;
}
