import buildSubSpec from '../../src/facetPoints/buildSubSpec.js';
import mergeSpec from '../../src/facetPoints/mergeSpec.js';

const data = [{ x: 1, y: 2, region: 'North', group: 'A' }];

function makeMerged(overrides = {}) {
    return mergeSpec(data, {
        mapping: { x: 'x', y: 'y', color: 'group' },
        facet: { field: 'region' },
        ...overrides,
    });
}

describe('facetPoints/buildSubSpec', () => {
    test('returns a complete points spec without internal data or facet keys', () => {
        const result = buildSubSpec(
            'North',
            makeMerged(),
            {},
            { colorOrder: ['A'], shapeOrder: [] }
        );

        expect(result).not.toHaveProperty('data');
        expect(result).not.toHaveProperty('facet');
        expect(result.mapping).toEqual({
            x: 'x',
            y: 'y',
            color: 'group',
        });
        expect(result.zoom.enabled).toBe(false);
        expect(result.annotations.lines).toEqual([]);
    });

    test('injects fixed global ranges and resolved aesthetic orders', () => {
        const result = buildSubSpec(
            'North',
            makeMerged(),
            { xMin: -5, xMax: 20, yMin: 0, yMax: 30 },
            {
                colorOrder: ['B', 'A', null],
                shapeOrder: ['Circle', 'Triangle'],
            }
        );

        expect(result.scales.x.range).toEqual([-5, 20]);
        expect(result.scales.y.range).toEqual([0, 30]);
        expect(result.scales.color.order).toEqual(['B', 'A', null]);
        expect(result.scales.shape.order).toEqual(['Circle', 'Triangle']);
    });

    test('does not invent a range for a free or empty global domain', () => {
        const merged = makeMerged({
            facet: {
                field: 'region',
                scales: { x: { free: true } },
            },
        });
        const result = buildSubSpec(
            'North',
            merged,
            { yMin: 0, yMax: 10 },
            { colorOrder: [], shapeOrder: [] }
        );

        expect(result.scales.x.range).toBeUndefined();
        expect(result.scales.y.range).toEqual([0, 10]);
    });

    test('retains an explicit range even when its facet axis is free', () => {
        const merged = makeMerged({
            scales: { x: { range: [1, 100] } },
            facet: {
                field: 'region',
                scales: { x: { free: true } },
            },
        });
        const result = buildSubSpec(
            'North',
            merged,
            {},
            { colorOrder: [], shapeOrder: [] }
        );

        expect(result.scales.x.range).toEqual([1, 100]);
    });

    test('wraps every callback with typed facet context', () => {
        const onClick = jest.fn();
        const onHover = jest.fn();
        const onSelect = jest.fn();
        const result = buildSubSpec(
            1,
            makeMerged({
                callbacks: { onClick, onHover, onSelect },
            }),
            {},
            { colorOrder: [], shapeOrder: [] }
        );
        const point = { x: 1, y: 2 };
        const selection = { type: 'point', values: ['A'] };
        const event = { type: 'click' };

        result.callbacks.onClick(point, event);
        result.callbacks.onHover(point, event);
        result.callbacks.onSelect(selection, event);

        expect(onClick).toHaveBeenCalledWith(point, 1, event);
        expect(onHover).toHaveBeenCalledWith(point, 1, event);
        expect(onSelect).toHaveBeenCalledWith(selection, 1, event);
    });

    test('keeps absent callbacks as null', () => {
        const result = buildSubSpec(
            'North',
            makeMerged(),
            {},
            { colorOrder: [], shapeOrder: [] }
        );

        expect(result.callbacks).toEqual({
            onClick: null,
            onHover: null,
            onSelect: null,
        });
    });

    test('filters facet-aware line rows and repeats global line rows', () => {
        const facetedRows = [
            { region: 'North', x: 1, y: 2 },
            { region: 'South', x: 3, y: 4 },
        ];
        const globalRows = [
            { x: 0, y: 1 },
            { x: 5, y: 6 },
        ];
        const merged = makeMerged({
            annotations: {
                lines: [
                    {
                        data: facetedRows,
                        mapping: { x: 'x', y: 'y' },
                    },
                    {
                        data: globalRows,
                        mapping: { x: 'x', y: 'y' },
                    },
                ],
            },
        });

        const result = buildSubSpec(
            'North',
            merged,
            {},
            { colorOrder: [], shapeOrder: [] }
        );

        expect(result.annotations.lines[0].data).toEqual([facetedRows[0]]);
        expect(result.annotations.lines[1].data).toEqual(globalRows);
        expect(result.annotations.lines[1].data).not.toBe(globalRows);
    });

    test('uses typed and canonical missing identity for faceted lines', () => {
        const rows = [
            { region: 1, x: 1, y: 1 },
            { region: '1', x: 2, y: 2 },
            { region: null, x: 3, y: 3 },
            { region: '', x: 4, y: 4 },
        ];
        const merged = makeMerged({
            annotations: {
                lines: [
                    {
                        data: rows,
                        mapping: { x: 'x', y: 'y' },
                    },
                ],
            },
        });
        const styles = { colorOrder: [], shapeOrder: [] };

        expect(
            buildSubSpec(1, merged, {}, styles).annotations.lines[0].data
        ).toEqual([rows[0]]);
        expect(
            buildSubSpec('1', merged, {}, styles).annotations.lines[0].data
        ).toEqual([rows[1]]);
        expect(
            buildSubSpec(null, merged, {}, styles).annotations.lines[0].data
        ).toEqual([rows[2], rows[3]]);
    });

    test('returns independent range and order arrays', () => {
        const globalScales = { xMin: 0, xMax: 10 };
        const styles = { colorOrder: ['A'], shapeOrder: [] };
        const first = buildSubSpec('North', makeMerged(), globalScales, styles);
        const second = buildSubSpec(
            'South',
            makeMerged(),
            globalScales,
            styles
        );

        first.scales.x.range[0] = -1;
        first.scales.color.order.push('B');

        expect(second.scales.x.range).toEqual([0, 10]);
        expect(second.scales.color.order).toEqual(['A']);
        expect(styles.colorOrder).toEqual(['A']);
    });
});
