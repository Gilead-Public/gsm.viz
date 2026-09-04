import { Interaction } from 'chart.js';

const MODE_PREFIX = 'gsmPoints';

/**
 * Register an interaction mode that evaluates only primary point datasets.
 *
 * @param {string} baseMode - Registered Chart.js interaction mode.
 * @returns {string} Point-only mode name, or the unchanged unknown mode.
 */
export default function getPointInteractionMode(baseMode) {
    const evaluate = Interaction.modes[baseMode];
    if (typeof evaluate !== 'function') return baseMode;

    const mode = `${MODE_PREFIX}:${baseMode}`;
    if (Interaction.modes[mode]) return mode;

    Interaction.modes[mode] = (chart, event, options, useFinalPosition) => {
        const metadata = chart.data.datasets
            .map((dataset, index) =>
                dataset._annotation ? chart.getDatasetMeta(index) : null
            )
            .filter(Boolean);
        const visibility = metadata.map(({ visible }) => visible);

        metadata.forEach((meta) => {
            meta.visible = false;
        });
        try {
            return evaluate(chart, event, options, useFinalPosition);
        } finally {
            metadata.forEach((meta, index) => {
                meta.visible = visibility[index];
            });
        }
    };

    return mode;
}
