import syncHover from '../../src/facetPoints/syncHover.js';

function makeChart(
    datasets,
    { key = 'id', visible = datasets.map(() => true) } = {}
) {
    const chart = {
        data: {
            datasets,
            _spec_: { mapping: { x: 'x', y: 'y', key } },
        },
        options: { onHover: jest.fn() },
        canvas: document.createElement('canvas'),
        destroy: jest.fn(),
        active: [],
        getActiveElements: jest.fn(() => chart.active),
        setActiveElements: jest.fn((active) => {
            chart.active = active;
        }),
        update: jest.fn(),
        isDatasetVisible: jest.fn((index) => visible[index]),
        getDatasetMeta: jest.fn((index) => ({
            visible: visible[index],
            data: datasets[index].data.map(() => ({})),
        })),
    };
    return chart;
}

const dataset = (...points) => ({ data: points });

describe('facetPoints/syncHover', () => {
    test('highlights the exact mapped key in every visible sibling', () => {
        const origin = makeChart([
            dataset({ x: 1, y: 2, _key: 'A' }, { x: 3, y: 4, _key: 'B' }),
        ]);
        const sibling = makeChart([
            dataset({ x: 30, y: 40, _key: 'B' }, { x: 10, y: 20, _key: 'A' }),
        ]);
        const original = origin.options.onHover;

        syncHover([origin, sibling]);
        const event = { type: 'mousemove' };
        origin.options.onHover(event, [{ datasetIndex: 0, index: 0 }], origin);

        expect(original).toHaveBeenCalledWith(
            event,
            [{ datasetIndex: 0, index: 0 }],
            origin
        );
        expect(sibling.setActiveElements).toHaveBeenCalledWith([
            { datasetIndex: 0, index: 1 },
        ]);
        expect(sibling.update).toHaveBeenCalledWith('none');
        expect(origin.setActiveElements).not.toHaveBeenCalled();
    });

    test('keeps numeric and string keys distinct', () => {
        const origin = makeChart([dataset({ x: 1, y: 2, _key: 1 })]);
        const sibling = makeChart([
            dataset({ x: 1, y: 2, _key: '1' }, { x: 3, y: 4, _key: 1 }),
        ]);

        syncHover([origin, sibling]);
        origin.options.onHover({}, [{ datasetIndex: 0, index: 0 }], origin);

        expect(sibling.setActiveElements).toHaveBeenCalledWith([
            { datasetIndex: 0, index: 1 },
        ]);
    });

    test('clears siblings when hover ends or no matching key exists', () => {
        const origin = makeChart([
            dataset({ x: 1, y: 2, _key: 'A' }, { x: 5, y: 6, _key: 'C' }),
        ]);
        const sibling = makeChart([dataset({ x: 3, y: 4, _key: 'A' })]);

        syncHover([origin, sibling]);
        origin.options.onHover({}, [{ datasetIndex: 0, index: 0 }], origin);
        origin.options.onHover({}, [{ datasetIndex: 0, index: 1 }], origin);
        origin.options.onHover({ type: 'mousemove' }, [], origin);

        expect(sibling.setActiveElements).toHaveBeenCalledTimes(2);
        expect(sibling.setActiveElements).toHaveBeenNthCalledWith(2, []);
        expect(sibling.getActiveElements()).toEqual([]);
    });

    test('skips sibling updates when the hover state is unchanged', () => {
        const origin = makeChart([dataset({ x: 1, y: 2, _key: 'A' })]);
        const sibling = makeChart([dataset({ x: 3, y: 4, _key: 'A' })]);

        syncHover([origin, sibling]);
        origin.options.onHover({}, [], origin);
        origin.options.onHover({}, [], origin);
        expect(sibling.setActiveElements).not.toHaveBeenCalled();
        expect(sibling.update).not.toHaveBeenCalled();

        origin.options.onHover({}, [{ datasetIndex: 0, index: 0 }], origin);
        origin.options.onHover({}, [{ datasetIndex: 0, index: 0 }], origin);
        expect(sibling.setActiveElements).toHaveBeenCalledTimes(1);
        expect(sibling.update).toHaveBeenCalledTimes(1);
    });

    test('does not update siblings for charts without mapped keys', () => {
        const origin = makeChart([dataset({ x: 1, y: 2, _key: 0 })], {
            key: null,
        });
        const sibling = makeChart([dataset({ x: 3, y: 4, _key: 0 })], {
            key: null,
        });

        syncHover([origin, sibling]);
        origin.options.onHover({}, [{ datasetIndex: 0, index: 0 }], origin);
        origin.options.onHover({}, [{ datasetIndex: 0, index: 0 }], origin);

        expect(sibling.update).not.toHaveBeenCalled();
    });

    test('stops synchronizing when a callback destroys the charts', () => {
        const origin = makeChart([dataset({ x: 1, y: 2, _key: 'A' })]);
        const sibling = makeChart([dataset({ x: 3, y: 4, _key: 'A' })]);
        [origin, sibling].forEach((chart) => {
            chart.destroy = jest.fn(() => {
                chart.canvas = null;
            });
        });
        origin.options.onHover = jest.fn(() => {
            origin.destroy();
            sibling.destroy();
        });

        syncHover([origin, sibling]);

        expect(() =>
            origin.options.onHover({}, [{ datasetIndex: 0, index: 0 }], origin)
        ).not.toThrow();
        expect(sibling.setActiveElements).not.toHaveBeenCalled();
    });

    test('skips destroyed siblings while synchronizing live ones', () => {
        const origin = makeChart([dataset({ x: 1, y: 2, _key: 'A' })]);
        const destroyed = makeChart([dataset({ x: 3, y: 4, _key: 'A' })]);
        const live = makeChart([dataset({ x: 5, y: 6, _key: 'A' })]);

        syncHover([origin, destroyed, live]);
        destroyed.canvas = null;
        origin.options.onHover({}, [{ datasetIndex: 0, index: 0 }], origin);

        expect(destroyed.setActiveElements).not.toHaveBeenCalled();
        expect(live.setActiveElements).toHaveBeenCalledTimes(1);
    });

    test('does not highlight a point in a hidden dataset', () => {
        const origin = makeChart([dataset({ x: 1, y: 2, _key: 'A' })]);
        const sibling = makeChart([dataset({ x: 3, y: 4, _key: 'A' })], {
            visible: [false],
        });
        sibling.active = [{ datasetIndex: 0, index: 0 }];

        syncHover([origin, sibling]);
        origin.options.onHover({}, [{ datasetIndex: 0, index: 0 }], origin);

        expect(sibling.setActiveElements).toHaveBeenCalledWith([]);
    });

    test('ignores annotation hits and charts without mapped keys', () => {
        const annotationOrigin = makeChart([
            { _annotation: true, data: [{ x: 1, y: 2, _key: 'A' }] },
        ]);
        const localOrigin = makeChart([dataset({ x: 1, y: 2, _key: 0 })], {
            key: undefined,
        });
        const sibling = makeChart([dataset({ x: 3, y: 4, _key: 'A' })]);
        sibling.active = [{ datasetIndex: 0, index: 0 }];

        syncHover([annotationOrigin, localOrigin, sibling]);
        annotationOrigin.options.onHover(
            {},
            [{ datasetIndex: 0, index: 0 }],
            annotationOrigin
        );
        localOrigin.options.onHover(
            {},
            [{ datasetIndex: 0, index: 0 }],
            localOrigin
        );

        expect(sibling.setActiveElements).toHaveBeenCalledWith([]);
        expect(sibling.setActiveElements).toHaveBeenCalledTimes(1);
    });

    test('can be re-applied without nesting synchronization wrappers', () => {
        const origin = makeChart([dataset({ x: 1, y: 2, _key: 'A' })]);
        const sibling = makeChart([dataset({ x: 3, y: 4, _key: 'A' })]);
        const original = origin.options.onHover;

        syncHover([origin, sibling]);
        syncHover([origin, sibling]);
        origin.options.onHover({}, [{ datasetIndex: 0, index: 0 }], origin);

        expect(original).toHaveBeenCalledTimes(1);
        expect(sibling.setActiveElements).toHaveBeenCalledTimes(1);
        expect(sibling.update).toHaveBeenCalledTimes(1);
    });

    test('clears siblings on canvas mouseout and stops after destroy', () => {
        const origin = makeChart([dataset({ x: 1, y: 2, _key: 'A' })]);
        const sibling = makeChart([dataset({ x: 3, y: 4, _key: 'A' })]);
        const originDestroy = origin.destroy;
        sibling.active = [{ datasetIndex: 0, index: 0 }];

        syncHover([origin, sibling]);
        syncHover([origin, sibling]);
        origin.canvas.dispatchEvent(new Event('mouseout'));

        expect(sibling.setActiveElements).toHaveBeenCalledTimes(1);
        expect(sibling.setActiveElements).toHaveBeenCalledWith([]);

        sibling.active = [{ datasetIndex: 0, index: 0 }];
        origin.destroy();
        expect(originDestroy).toHaveBeenCalledTimes(1);
        origin.canvas.dispatchEvent(new Event('mouseout'));
        expect(sibling.setActiveElements).toHaveBeenCalledTimes(1);
    });
});
