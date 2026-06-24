import mergeSpec from '../../src/facetBars/mergeSpec.js';

describe('facetBars/mergeSpec', () => {
    const minimalData = [{ site: 'A', value: 10 }];
    const minimalSpec = {
        mapping: { x: 'site', y: 'value' },
        facet: { field: 'region' },
    };

    test('returns a merged spec object', () => {
        const result = mergeSpec(minimalData, minimalSpec);
        expect(result).toBeInstanceOf(Object);
    });

    test('includes the data array', () => {
        const result = mergeSpec(minimalData, minimalSpec);
        expect(result.data).toBe(minimalData);
    });

    test('merges facet defaults when facet config is minimal', () => {
        const result = mergeSpec(minimalData, minimalSpec);
        expect(result.facet.field).toBe('region');
        expect(result.facet.nCol).toBeUndefined();
        expect(result.facet.scales.y.free).toBe(false);
        expect(result.facet.scales.x.free).toBe(false);
        expect(result.facet.legend.display).toBe(true);
        expect(result.facet.legend.sync).toBe(true);
        expect(result.facet.label.position).toBe('top');
    });

    test('user facet.nCol overrides default', () => {
        const result = mergeSpec(minimalData, {
            ...minimalSpec,
            facet: { field: 'region', nCol: 4 },
        });
        expect(result.facet.nCol).toBe(4);
    });

    test('user facet.chartHeight is preserved in merged spec', () => {
        const result = mergeSpec(minimalData, {
            ...minimalSpec,
            facet: { field: 'region', chartHeight: 300 },
        });
        expect(result.facet.chartHeight).toBe(300);
    });

    test('facet.chartHeight is undefined when not specified', () => {
        const result = mergeSpec(minimalData, minimalSpec);
        expect(result.facet.chartHeight).toBeUndefined();
    });

    test('user facet.scales.y.free overrides default', () => {
        const result = mergeSpec(minimalData, {
            ...minimalSpec,
            facet: { field: 'region', scales: { y: { free: true } } },
        });
        expect(result.facet.scales.y.free).toBe(true);
    });

    test('user facet.legend.sync overrides default', () => {
        const result = mergeSpec(minimalData, {
            ...minimalSpec,
            facet: { field: 'region', legend: { sync: false } },
        });
        expect(result.facet.legend.sync).toBe(false);
    });

    test('applies bars defaults for orientation', () => {
        const result = mergeSpec(minimalData, minimalSpec);
        expect(result.orientation).toBe('vertical');
    });

    test('user orientation overrides bars default', () => {
        const result = mergeSpec(minimalData, {
            ...minimalSpec,
            orientation: 'horizontal',
        });
        expect(result.orientation).toBe('horizontal');
    });

    test('callbacks default to null', () => {
        const result = mergeSpec(minimalData, minimalSpec);
        expect(result.callbacks.onClick).toBeNull();
        expect(result.callbacks.onHover).toBeNull();
    });

    test('user callbacks are preserved', () => {
        const onClick = jest.fn();
        const result = mergeSpec(minimalData, {
            ...minimalSpec,
            callbacks: { onClick },
        });
        expect(result.callbacks.onClick).toBe(onClick);
    });
});
