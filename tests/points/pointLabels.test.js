import pointLabels from '../../src/points/pointLabels.js';

const first = {
    x: 1,
    y: 2,
    _key: 'A',
    _datum: { id: 'Site A', flagged: true },
};
const second = {
    x: 3,
    y: 4,
    _key: 'B',
    _datum: { id: 2, flagged: false },
};

function makeSpec(point) {
    return {
        annotations: {
            labels: { point },
        },
    };
}

function makeContext(point = first, dataset = {}) {
    return {
        dataset: {
            data: [point],
            ...dataset,
        },
        dataIndex: 0,
    };
}

describe('points label annotations', () => {
    test.each([null, false])(
        'disables labels for a %p configuration',
        (point) => {
            expect(pointLabels(makeSpec(point))).toEqual({ display: false });
        }
    );

    test('builds default styling and source-field formatting', () => {
        const labels = pointLabels(makeSpec({ field: 'id' }));
        const context = makeContext();

        expect(labels).toEqual(
            expect.objectContaining({
                align: 'top',
                color: '#333333',
                offset: 4,
                font: {},
            })
        );
        expect(labels.display(context)).toBe(true);
        expect(labels.formatter(first, context)).toBe('Site A');
        expect(labels.formatter(second, makeContext(second))).toBe(2);
    });

    test('supports static display filtering', () => {
        const hidden = pointLabels(makeSpec({ field: 'id', display: false }));
        const visible = pointLabels(makeSpec({ field: 'id', display: true }));

        expect(hidden.display).toBe(false);
        expect(visible.display(makeContext())).toBe(true);
    });

    test('supports truthy source-field filtering', () => {
        const labels = pointLabels(
            makeSpec({ field: 'id', display: 'flagged' })
        );

        expect(labels.display(makeContext(first))).toBe(true);
        expect(labels.display(makeContext(second))).toBe(false);
    });

    test('calls display predicates with the structured point and context', () => {
        const display = jest.fn((point) => point._key === 'A');
        const labels = pointLabels(makeSpec({ field: 'id', display }));
        const context = makeContext();

        expect(labels.display(context)).toBe(true);
        expect(display).toHaveBeenCalledWith(first, context);
    });

    test('calls custom formatters with the structured point and context', () => {
        const formatter = jest.fn((point) => `Label ${point._datum.id}`);
        const labels = pointLabels(makeSpec({ field: 'id', formatter }));
        const context = makeContext();

        expect(labels.formatter(first, context)).toBe('Label Site A');
        expect(formatter).toHaveBeenCalledWith(first, context);
    });

    test('applies explicit positioning and font options defensively', () => {
        const font = { family: 'Arial', size: 14, weight: 600 };
        const labels = pointLabels(
            makeSpec({
                field: 'id',
                align: 'right',
                offset: 8,
                color: '#123456',
                font,
            })
        );

        expect(labels.align).toBe('right');
        expect(labels.offset).toBe(8);
        expect(labels.color).toBe('#123456');
        expect(labels.font).toEqual(font);
        expect(labels.font).not.toBe(font);
    });

    test('excludes auxiliary lines and missing point elements', () => {
        const labels = pointLabels(makeSpec({ field: 'id' }));

        expect(labels.display(makeContext(first, { _annotation: true }))).toBe(
            false
        );
        expect(
            labels.display({
                dataset: { data: [] },
                dataIndex: 0,
            })
        ).toBe(false);
        expect(
            labels.formatter(undefined, {
                dataset: { data: [] },
                dataIndex: 0,
            })
        ).toBeNull();
    });

    test('does not swallow predicate or formatter errors', () => {
        const displayError = new Error('display failed');
        const formatError = new Error('format failed');
        const displayLabels = pointLabels(
            makeSpec({
                field: 'id',
                display: () => {
                    throw displayError;
                },
            })
        );
        const formatLabels = pointLabels(
            makeSpec({
                field: 'id',
                formatter: () => {
                    throw formatError;
                },
            })
        );

        expect(() => displayLabels.display(makeContext())).toThrow(
            displayError
        );
        expect(() => formatLabels.formatter(first, makeContext())).toThrow(
            formatError
        );
    });
});
