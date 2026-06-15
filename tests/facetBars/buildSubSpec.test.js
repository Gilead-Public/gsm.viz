import buildSubSpec from '../../src/facetBars/buildSubSpec.js';

const makeMergedSpec = (overrides = {}) => ({
    mapping: { x: 'site', y: 'value', fill: 'group' },
    orientation: 'vertical',
    position: 'stack',
    nCategories: undefined,
    scales: {
        x: { type: 'category', label: undefined },
        y: { type: 'linear', label: undefined },
        fill: { palette: [] },
    },
    labels: { title: undefined, captions: undefined },
    annotations: { referenceLines: [], labels: { segment: {}, total: {} } },
    tooltip: { format: undefined, formatter: undefined },
    theme: { maintainAspectRatio: false, animation: false },
    callbacks: { onClick: null, onHover: null },
    facet: {
        field: 'region',
        scales: { x: { free: false }, y: { free: false } },
        legend: { display: true, chart: 'first' },
    },
    ...overrides,
});

describe('facetBars/buildSubSpec', () => {
    test('returns a plain object', () => {
        const result = buildSubSpec('US', makeMergedSpec());
        expect(typeof result).toBe('object');
    });

    test('passes mapping through unchanged', () => {
        const merged = makeMergedSpec();
        const result = buildSubSpec('US', merged);
        expect(result.mapping).toEqual(merged.mapping);
    });

    test('passes orientation through unchanged', () => {
        const result = buildSubSpec('US', makeMergedSpec({ orientation: 'horizontal' }));
        expect(result.orientation).toBe('horizontal');
    });

    test('passes position through unchanged', () => {
        const result = buildSubSpec('US', makeMergedSpec({ position: 'dodge' }));
        expect(result.position).toBe('dodge');
    });

    test('passes theme through unchanged', () => {
        const merged = makeMergedSpec();
        const result = buildSubSpec('US', merged);
        expect(result.theme).toEqual(merged.theme);
    });

    describe('callback wrapping', () => {
        test('onClick receives facetValue as second argument', () => {
            const userOnClick = jest.fn();
            const merged = makeMergedSpec({ callbacks: { onClick: userOnClick, onHover: null } });
            const result = buildSubSpec('EU', merged);

            const fakePoint = { x: 'A', y: 10 };
            const fakeEvent = {};
            result.callbacks.onClick(fakePoint, fakeEvent);

            expect(userOnClick).toHaveBeenCalledWith(fakePoint, 'EU', fakeEvent);
        });

        test('onHover receives facetValue as second argument', () => {
            const userOnHover = jest.fn();
            const merged = makeMergedSpec({ callbacks: { onClick: null, onHover: userOnHover } });
            const result = buildSubSpec('APAC', merged);

            const fakePoint = { x: 'B', y: 5 };
            const fakeEvent = {};
            result.callbacks.onHover(fakePoint, fakeEvent);

            expect(userOnHover).toHaveBeenCalledWith(fakePoint, 'APAC', fakeEvent);
        });

        test('null onClick passes through as null', () => {
            const merged = makeMergedSpec({ callbacks: { onClick: null, onHover: null } });
            const result = buildSubSpec('US', merged);
            expect(result.callbacks.onClick).toBeNull();
        });

        test('null onHover passes through as null', () => {
            const merged = makeMergedSpec({ callbacks: { onClick: null, onHover: null } });
            const result = buildSubSpec('US', merged);
            expect(result.callbacks.onHover).toBeNull();
        });
    });

    test('does not include facet key in sub-spec', () => {
        const result = buildSubSpec('US', makeMergedSpec());
        expect(result.facet).toBeUndefined();
    });

    describe('function scales.x.order', () => {
        test('calls order function with (facetValue, facetData) when order is a function', () => {
            const orderFn = jest.fn().mockReturnValue(['B', 'A', 'C']);
            const merged = makeMergedSpec({
                scales: {
                    x: { type: 'category', order: orderFn },
                    y: { type: 'linear' },
                    fill: { palette: [] },
                },
            });
            const facetData = [{ site: 'A' }, { site: 'B' }];
            buildSubSpec('EU', merged, facetData);
            expect(orderFn).toHaveBeenCalledWith('EU', facetData);
        });

        test('uses return value of order function as scales.x.order in sub-spec', () => {
            const orderFn = jest.fn().mockReturnValue(['B', 'A', 'C']);
            const merged = makeMergedSpec({
                scales: {
                    x: { type: 'category', order: orderFn },
                    y: { type: 'linear' },
                    fill: { palette: [] },
                },
            });
            const result = buildSubSpec('EU', merged, []);
            expect(result.scales.x.order).toEqual(['B', 'A', 'C']);
        });

        test('passes array order through unchanged (backward-compatible)', () => {
            const merged = makeMergedSpec({
                scales: {
                    x: { type: 'category', order: ['X', 'Y', 'Z'] },
                    y: { type: 'linear' },
                    fill: { palette: [] },
                },
            });
            const result = buildSubSpec('US', merged, []);
            expect(result.scales.x.order).toEqual(['X', 'Y', 'Z']);
        });

        test('leaves scales.x.order undefined when not provided', () => {
            const result = buildSubSpec('US', makeMergedSpec(), []);
            expect(result.scales.x.order).toBeUndefined();
        });
    });
});
