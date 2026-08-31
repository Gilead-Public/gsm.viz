import { Interaction } from 'chart.js';
import getPointInteractionMode from '../../src/points/pointInteractionMode.js';

describe('points annotation interaction mode', () => {
    test('hides annotation metadata while evaluating a base mode', () => {
        const baseMode = 'pointsInteractionTest';
        Interaction.modes[baseMode] = jest.fn((chart) =>
            chart
                .getSortedVisibleDatasetMetas()
                .map(({ index }) => ({ datasetIndex: index }))
        );
        const metas = [
            { index: 0, visible: true },
            { index: 1, visible: true },
        ];
        const chart = {
            data: {
                datasets: [{}, { _annotation: true }],
            },
            getDatasetMeta: (index) => metas[index],
            getSortedVisibleDatasetMetas: () =>
                metas.filter(({ visible }) => visible),
        };

        const mode = getPointInteractionMode(baseMode);
        const result = Interaction.modes[mode](chart, {}, {}, false);

        expect(result).toEqual([{ datasetIndex: 0 }]);
        expect(metas.map(({ visible }) => visible)).toEqual([true, true]);
        delete Interaction.modes[baseMode];
        delete Interaction.modes[mode];
    });

    test('restores annotation visibility when the base mode throws', () => {
        const baseMode = 'pointsInteractionThrowTest';
        Interaction.modes[baseMode] = () => {
            throw new Error('mode failed');
        };
        const annotationMeta = { visible: true };
        const chart = {
            data: { datasets: [{ _annotation: true }] },
            getDatasetMeta: () => annotationMeta,
        };
        const mode = getPointInteractionMode(baseMode);

        expect(() => Interaction.modes[mode](chart, {}, {}, false)).toThrow(
            'mode failed'
        );
        expect(annotationMeta.visible).toBe(true);
        delete Interaction.modes[baseMode];
        delete Interaction.modes[mode];
    });

    test('leaves an unknown interaction mode unchanged', () => {
        expect(getPointInteractionMode('unknown-mode')).toBe('unknown-mode');
    });
});
