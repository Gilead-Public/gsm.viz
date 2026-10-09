import validateSpec from '../../src/points/validateSpec.js';

const data = [{ x: 1, y: 2 }];
const mapping = { x: 'x', y: 'y' };

function validate(annotations, scales) {
    return validateSpec(data, { mapping, annotations, scales });
}

describe('points annotation validation', () => {
    test('accepts fully configured reference and auxiliary lines', () => {
        expect(() =>
            validate({
                referenceLines: [
                    {
                        axis: 'x',
                        value: 5,
                        label: 'Target',
                        color: '#123456',
                        width: 2,
                        dash: [4, 2],
                        labelPosition: 'start',
                    },
                ],
                lines: [
                    {
                        data: [
                            { xValue: 1, yValue: 3, group: 'A' },
                            { xValue: 2, yValue: 4, group: 'A' },
                        ],
                        mapping: {
                            x: 'xValue',
                            y: 'yValue',
                            group: 'group',
                        },
                        order: ['A', null],
                        label: 'Threshold',
                        color: '#654321',
                        colors: { A: '#abcdef' },
                        palette: ['#111111', '#222222'],
                        width: 3,
                        dash: [3, 1],
                        tension: 0.25,
                        stepped: 'middle',
                        showInLegend: true,
                    },
                ],
            })
        ).not.toThrow();
    });

    test.each([
        [[], 'spec.annotations must be a plain object'],
        [{ unknown: true }, 'spec.annotations.unknown is not supported'],
        [
            { referenceLines: {} },
            'spec.annotations.referenceLines must be an array',
        ],
        [
            { referenceLines: [null] },
            'spec.annotations.referenceLines[0] must be a plain object',
        ],
        [
            { referenceLines: [{ axis: 'x', value: 1, unknown: true }] },
            'spec.annotations.referenceLines[0].unknown is not supported',
        ],
        [
            { referenceLines: [{ value: 1 }] },
            "spec.annotations.referenceLines[0].axis must be 'x' or 'y'",
        ],
        [
            { referenceLines: [{ axis: 'z', value: 1 }] },
            "spec.annotations.referenceLines[0].axis must be 'x' or 'y'",
        ],
        [
            { referenceLines: [{ axis: 'x', value: '1' }] },
            'spec.annotations.referenceLines[0].value must be a finite number',
        ],
        [
            { referenceLines: [{ axis: 'x', value: 1, label: 3 }] },
            'spec.annotations.referenceLines[0].label must be a string or null',
        ],
        [
            { referenceLines: [{ axis: 'x', value: 1, color: '' }] },
            'spec.annotations.referenceLines[0].color must be a non-empty string',
        ],
        [
            { referenceLines: [{ axis: 'x', value: 1, width: 0 }] },
            'spec.annotations.referenceLines[0].width must be a positive finite number',
        ],
        [
            { referenceLines: [{ axis: 'x', value: 1, dash: [2, -1] }] },
            'spec.annotations.referenceLines[0].dash must contain non-negative finite numbers',
        ],
        [
            {
                referenceLines: [
                    { axis: 'x', value: 1, labelPosition: 'left' },
                ],
            },
            "spec.annotations.referenceLines[0].labelPosition must be 'start', 'center', or 'end'",
        ],
        [{ lines: {} }, 'spec.annotations.lines must be an array'],
        [{ lines: [null] }, 'spec.annotations.lines[0] must be a plain object'],
        [
            { lines: [{ data: [], mapping, unknown: true }] },
            'spec.annotations.lines[0].unknown is not supported',
        ],
        [
            { lines: [{ data: {}, mapping }] },
            'spec.annotations.lines[0].data must be an array',
        ],
        [
            { lines: [{ data: [] }] },
            'spec.annotations.lines[0].mapping must be a plain object',
        ],
        [
            {
                lines: [
                    {
                        data: [],
                        mapping: { x: 'x', y: 'y', color: 'group' },
                    },
                ],
            },
            'spec.annotations.lines[0].mapping.color is not supported',
        ],
        [
            { lines: [{ data: [], mapping: { x: '', y: 'y' } }] },
            'spec.annotations.lines[0].mapping.x must be a non-empty string',
        ],
        [
            {
                lines: [{ data: [], mapping, order: ['A', Infinity] }],
            },
            'spec.annotations.lines[0].order[1] must be a string, finite number, or null',
        ],
        [
            { lines: [{ data: [], mapping, order: ['A', 'A'] }] },
            'spec.annotations.lines[0].order must contain unique values',
        ],
        [
            { lines: [{ data: [], mapping, order: ['A'] }] },
            'spec.annotations.lines[0].order requires mapping.group',
        ],
        [
            {
                lines: [{ data: [], mapping, colors: { A: '#123456' } }],
            },
            'spec.annotations.lines[0].colors requires mapping.group',
        ],
        [
            { lines: [{ data: [], mapping, colors: [] }] },
            'spec.annotations.lines[0].colors must be a plain object',
        ],
        [
            {
                lines: [{ data: [], mapping, colors: { A: '' } }],
            },
            'spec.annotations.lines[0].colors.A must be a non-empty string',
        ],
        [
            {
                lines: [{ data: [], mapping, colors: { A: undefined } }],
            },
            'spec.annotations.lines[0].colors.A must be a non-empty string',
        ],
        [
            { lines: [{ data: [], mapping, palette: [] }] },
            'spec.annotations.lines[0].palette must be a non-empty array',
        ],
        [
            { lines: [{ data: [], mapping, palette: [undefined] }] },
            'spec.annotations.lines[0].palette[0] must be a non-empty string',
        ],
        [
            { lines: [{ data: [], mapping, width: -1 }] },
            'spec.annotations.lines[0].width must be a positive finite number',
        ],
        [
            { lines: [{ data: [], mapping, tension: 2 }] },
            'spec.annotations.lines[0].tension must be a finite number between 0 and 1',
        ],
        [
            { lines: [{ data: [], mapping, stepped: 'sometimes' }] },
            "spec.annotations.lines[0].stepped must be a boolean, 'before', 'after', or 'middle'",
        ],
        [
            { lines: [{ data: [], mapping, showInLegend: 'yes' }] },
            'spec.annotations.lines[0].showInLegend must be a boolean',
        ],
        [
            {
                lines: [
                    {
                        data: [],
                        mapping,
                        showInLegend: true,
                    },
                ],
            },
            'spec.annotations.lines[0].label must be a non-empty string when showInLegend is true without mapping.group',
        ],
    ])('rejects invalid annotations %#', (annotations, message) => {
        expect(() => validate(annotations)).toThrow(message);
    });

    test.each([
        ['reference x value', { referenceLines: [{ axis: 'x', value: 0 }] }],
        ['reference y value', { referenceLines: [{ axis: 'y', value: -1 }] }],
    ])('rejects a non-positive log %s', (_case, annotations) => {
        expect(() =>
            validate(annotations, {
                x: { type: 'log' },
                y: { type: 'log' },
            })
        ).toThrow('must be greater than zero for a log scale');
    });
});
