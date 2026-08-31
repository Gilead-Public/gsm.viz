import structureData from '../../src/points/structureData.js';
import mergeSpec from '../../src/facetPoints/mergeSpec.js';
import splitData from '../../src/facetPoints/splitData.js';
import {
    applyGlobalStyles,
    getGlobalStyles,
} from '../../src/facetPoints/globalStyles.js';

function prepare(data, overrides = {}) {
    const {
        mapping: mappingOverrides,
        facet: facetOverrides,
        ...rest
    } = overrides;
    const merged = mergeSpec(data, {
        ...rest,
        mapping: {
            x: 'x',
            y: 'y',
            color: 'color',
            shape: 'shape',
            ...(mappingOverrides || {}),
        },
        facet: {
            field: 'facet',
            ...(facetOverrides || {}),
        },
    });
    const facets = splitData(data, merged.facet.field, merged.facet.order);
    return { merged, facets };
}

describe('facetPoints/globalStyles', () => {
    test('resolves global levels in original source order, not facet order', () => {
        const data = [
            { x: 1, y: 1, facet: 'Second', color: 'Blue', shape: 'Circle' },
            { x: 2, y: 2, facet: 'First', color: 'Red', shape: 'Triangle' },
        ];
        const { merged, facets } = prepare(data, {
            facet: { order: ['First', 'Second'] },
        });

        const styles = getGlobalStyles(facets, merged);

        expect(styles.colorOrder).toEqual(['Blue', 'Red']);
        expect(styles.shapeOrder).toEqual(['Circle', 'Triangle']);
    });

    test('retains explicit, typed, literal, and missing levels', () => {
        const data = [
            { x: 1, y: 1, facet: 'A', color: 1, shape: '(Missing)' },
            { x: 2, y: 2, facet: 'B', color: '1', shape: null },
        ];
        const { merged, facets } = prepare(data, {
            scales: {
                color: { order: ['Expected'] },
                shape: { order: ['Square'] },
            },
        });

        const styles = getGlobalStyles(facets, merged);

        expect(styles.colorOrder).toEqual(['Expected', 1, '1']);
        expect(styles.shapeOrder).toEqual(['Square', '(Missing)', null]);
    });

    test('builds one template for every observed composite style', () => {
        const data = [
            { x: 1, y: 1, facet: 'A', color: 'Red', shape: 'Circle' },
            { x: 2, y: 2, facet: 'B', color: 'Blue', shape: 'Triangle' },
            { x: 3, y: 3, facet: 'B', color: 'Red', shape: 'Triangle' },
        ];
        const { merged, facets } = prepare(data);

        const { templates } = getGlobalStyles(facets, merged);

        expect(templates).toHaveLength(3);
        expect(templates.map(({ _color, _shape }) => [_color, _shape])).toEqual(
            [
                ['Red', 'Circle'],
                ['Red', 'Triangle'],
                ['Blue', 'Triangle'],
            ]
        );
    });

    test('ignores mapped-key collisions across facets when resolving styles', () => {
        const data = [
            {
                x: 1,
                y: 1,
                facet: 'A',
                id: 'same',
                color: 'Red',
                shape: 'Circle',
            },
            {
                x: 2,
                y: 2,
                facet: 'B',
                id: 'same',
                color: 'Blue',
                shape: 'Circle',
            },
        ];
        const { merged, facets } = prepare(data, {
            mapping: { key: 'id' },
        });

        expect(() => getGlobalStyles(facets, merged)).not.toThrow();
    });

    test('reorders local datasets globally, inserts ghosts, and keeps annotations last', () => {
        const data = [
            { x: 1, y: 1, facet: 'A', color: 'Red', shape: 'Circle' },
            { x: 2, y: 2, facet: 'B', color: 'Blue', shape: 'Triangle' },
        ];
        const { merged, facets } = prepare(data);
        const styles = getGlobalStyles(facets, merged);
        const [blue] = structureData({
            ...merged,
            data: [data[1]],
            scales: {
                ...merged.scales,
                color: {
                    ...merged.scales.color,
                    order: styles.colorOrder,
                },
                shape: {
                    ...merged.scales.shape,
                    order: styles.shapeOrder,
                },
            },
        }).datasets;
        const annotation = {
            _annotation: true,
            label: 'Threshold',
            data: [],
        };
        const chart = {
            data: {
                datasets: [blue, annotation],
                _spec_: merged,
            },
            setDatasetVisibility: jest.fn(),
            update: jest.fn(),
        };

        applyGlobalStyles(chart, styles.templates);

        expect(chart.data.datasets).toHaveLength(3);
        expect(chart.data.datasets[0]).toEqual(
            expect.objectContaining({
                _color: 'Red',
                _shape: 'Circle',
                _facetGhost: true,
                data: [],
            })
        );
        expect(chart.data.datasets[1]).toBe(blue);
        expect(chart.data.datasets[2]).toBe(annotation);
        expect(chart.update).toHaveBeenCalledWith('none');
    });

    test('creates independent ghost style arrays for separate charts', () => {
        const data = [
            { x: 1, y: 1, facet: 'A', color: 'Red', shape: 'Circle' },
        ];
        const { merged, facets } = prepare(data);
        const styles = getGlobalStyles(facets, merged);
        styles.templates[0].backgroundColor = ['#111111'];
        const makeChart = () => ({
            data: { datasets: [], _spec_: merged },
            setDatasetVisibility: jest.fn(),
            update: jest.fn(),
        });
        const first = makeChart();
        const second = makeChart();

        applyGlobalStyles(first, styles.templates);
        applyGlobalStyles(second, styles.templates);
        first.data.datasets[0].backgroundColor.push('#222222');

        expect(second.data.datasets[0].backgroundColor).toEqual(['#111111']);
        expect(styles.templates[0].backgroundColor).toEqual(['#111111']);
    });
});
