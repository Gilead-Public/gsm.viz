import mergeSpec from '../../src/facetPoints/mergeSpec.js';

const data = [{ x: 1, y: 2, region: 'North' }];
const spec = {
    mapping: { x: 'x', y: 'y' },
    facet: { field: 'region' },
};

describe('facetPoints/mergeSpec', () => {
    test('merges the complete points spec and retains the source data', () => {
        const merged = mergeSpec(data, spec);

        expect(merged.data).toBe(data);
        expect(merged.mapping).toEqual({ x: 'x', y: 'y' });
        expect(merged.scales.x.type).toBe('linear');
        expect(merged.zoom.enabled).toBe(false);
    });

    test('applies facet defaults', () => {
        expect(mergeSpec(data, spec).facet).toEqual({
            field: 'region',
            order: undefined,
            nCol: undefined,
            chartHeight: undefined,
            label: {
                position: 'top',
                font: undefined,
            },
            scales: {
                x: { free: false },
                y: { free: false },
            },
            legend: {
                display: true,
                sync: true,
            },
        });
    });

    test('merges nested facet overrides without clobbering siblings', () => {
        const merged = mergeSpec(data, {
            ...spec,
            facet: {
                field: 'region',
                order: ['South', 'North'],
                nCol: 2,
                chartHeight: 320,
                label: {
                    position: 'bottom',
                    font: 'bold 14px sans-serif',
                },
                scales: { x: { free: true } },
            },
        });

        expect(merged.facet).toEqual({
            field: 'region',
            order: ['South', 'North'],
            nCol: 2,
            chartHeight: 320,
            label: {
                position: 'bottom',
                font: 'bold 14px sans-serif',
            },
            scales: {
                x: { free: true },
                y: { free: false },
            },
            legend: {
                display: true,
                sync: true,
            },
        });
    });

    test('does not mutate or retain mutable facet input', () => {
        const facet = {
            field: 'region',
            order: ['North'],
            label: { position: 'bottom' },
            scales: { x: { free: true } },
        };
        const snapshot = JSON.parse(JSON.stringify(facet));
        const merged = mergeSpec(data, { ...spec, facet });

        merged.facet.order.push('South');
        merged.facet.label.position = 'top';
        merged.facet.scales.x.free = false;

        expect(facet).toEqual(snapshot);
        expect(merged.facet.order).not.toBe(facet.order);
        expect(merged.facet.label).not.toBe(facet.label);
        expect(merged.facet.scales.x).not.toBe(facet.scales.x);
    });

    test('creates independent nested defaults for separate calls', () => {
        const first = mergeSpec(data, spec);
        const second = mergeSpec(data, spec);

        first.facet.label.position = 'bottom';
        first.facet.scales.x.free = true;

        expect(second.facet.label.position).toBe('top');
        expect(second.facet.scales.x.free).toBe(false);
    });

    test('merges legend settings without sharing state', () => {
        const legend = { display: false };
        const merged = mergeSpec(data, {
            ...spec,
            facet: { field: 'region', legend },
        });

        expect(merged.facet.legend).toEqual({
            display: false,
            sync: true,
        });
        expect(merged.facet.legend).not.toBe(legend);
    });
});
