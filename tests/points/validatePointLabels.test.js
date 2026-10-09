import validateSpec from '../../src/points/validateSpec.js';

const data = [
    { x: 1, y: 2, id: 'A', flagged: true },
    { x: 3, y: 4, id: 2, flagged: false },
];
const mapping = { x: 'x', y: 'y' };

function validate(point, rows = data) {
    return validateSpec(rows, {
        mapping,
        annotations: { labels: { point } },
    });
}

describe('points label annotation validation', () => {
    test('accepts all supported point label options', () => {
        expect(() =>
            validate({
                field: 'id',
                display: 'flagged',
                formatter: () => 'label',
                offset: 6,
                align: 'right',
                color: '#123456',
                font: {
                    family: 'Arial',
                    size: 14,
                    style: 'italic',
                    weight: 600,
                    lineHeight: 1.2,
                },
            })
        ).not.toThrow();
    });

    test.each([null, false])(
        'accepts %p as a disabled point label configuration',
        (point) => {
            expect(() => validate(point)).not.toThrow();
        }
    );

    test.each([
        [
            { point: {} },
            'spec.annotations.labels.point.field must be a non-empty string',
        ],
        [
            { point: { field: 'id', unknown: true } },
            'spec.annotations.labels.point.unknown is not supported',
        ],
        [
            { point: { field: 'id', display: 2 } },
            'spec.annotations.labels.point.display must be a boolean, non-empty string, or function',
        ],
        [
            { point: { field: 'id', formatter: 'format' } },
            'spec.annotations.labels.point.formatter must be a function or null',
        ],
        [
            { point: { field: 'id', offset: -1 } },
            'spec.annotations.labels.point.offset must be a non-negative finite number',
        ],
        [
            { point: { field: 'id', align: 'upper' } },
            "spec.annotations.labels.point.align must be 'center', 'start', 'end', 'right', 'bottom', 'left', or 'top'",
        ],
        [
            { point: { field: 'id', color: '' } },
            'spec.annotations.labels.point.color must be a non-empty string',
        ],
        [
            { point: { field: 'id', font: [] } },
            'spec.annotations.labels.point.font must be a plain object',
        ],
        [
            { point: { field: 'id', font: { unknown: true } } },
            'spec.annotations.labels.point.font.unknown is not supported',
        ],
        [
            { point: { field: 'id', font: { size: 0 } } },
            'spec.annotations.labels.point.font.size must be a positive finite number',
        ],
        [
            { point: { field: 'id', font: { family: '' } } },
            'spec.annotations.labels.point.font.family must be a non-empty string',
        ],
        [
            { point: { field: 'id', font: { style: 2 } } },
            'spec.annotations.labels.point.font.style must be a non-empty string',
        ],
        [
            { point: { field: 'id', font: { weight: {} } } },
            'spec.annotations.labels.point.font.weight must be a non-empty string or finite number',
        ],
        [
            { point: { field: 'id', font: { lineHeight: 0 } } },
            'spec.annotations.labels.point.font.lineHeight must be a positive finite number or non-empty string',
        ],
    ])('rejects malformed label configuration %#', (labels, message) => {
        expect(() =>
            validateSpec(data, {
                mapping,
                annotations: { labels },
            })
        ).toThrow(message);
    });

    test.each([
        ['missing', undefined],
        ['null', null],
        ['blank', '  '],
        ['NaN', NaN],
        ['object', {}],
    ])('rejects a %s mapped label value', (_case, id) => {
        const rows = [{ x: 1, y: 2, id }];

        expect(() => validate({ field: 'id' }, rows)).toThrow(
            'data[0].id mapped by spec.annotations.labels.point.field must be a non-empty string or finite number'
        );
    });
});
