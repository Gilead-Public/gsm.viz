import formatTooltip from '../../src/tiles/formatTooltip.js';

const row = { subjid: 'S1', vital: 'Weight', rate: '50%', x: 'field-x' };

describe('tiles/formatTooltip', () => {
    test('default text uses y, x and label', () => {
        expect(
            formatTooltip({}, row, { x: 'Weight', y: 'S1', label: '50%' })
        ).toBe('S1 · Weight: 50%');
    });

    test('default text falls back to fill and includes detail column', () => {
        expect(
            formatTooltip({}, row, {
                x: 2,
                y: 'S1',
                fill: true,
                label: '',
                column: 'Weight',
            })
        ).toBe('S1 · Weight 2: true');
    });

    test('format template prefers row fields over aliases', () => {
        expect(
            formatTooltip({ format: '{subjid} {x} {y} {missing}' }, row, {
                x: 'Weight',
                y: 'S1',
            })
        ).toBe('S1 field-x S1 ');
    });

    test('formatter receives the source row', () => {
        const formatter = jest.fn((d) => `${d.vital}!`);
        expect(formatTooltip({ formatter, format: '{x}' }, row, {})).toBe(
            'Weight!'
        );
        expect(formatter).toHaveBeenCalledWith(row);
    });
});
