import referenceLines from '../../src/points/referenceLines.js';

function makeSpec(lines = []) {
    return {
        annotations: { referenceLines: lines },
    };
}

describe('points reference lines', () => {
    test('returns null without configured lines', () => {
        expect(referenceLines(makeSpec())).toBeNull();
    });

    test('builds x and y reference annotations with defaults', () => {
        const result = referenceLines(
            makeSpec([
                { axis: 'x', value: 3 },
                { axis: 'y', value: 5 },
            ])
        );

        expect(result).toEqual([
            {
                type: 'line',
                adjustScaleRange: true,
                borderColor: '#666666',
                borderWidth: 1,
                borderDash: [],
                xMin: 3,
                xMax: 3,
            },
            {
                type: 'line',
                adjustScaleRange: true,
                borderColor: '#666666',
                borderWidth: 1,
                borderDash: [],
                yMin: 5,
                yMax: 5,
            },
        ]);
    });

    test('applies independent line styles and labels', () => {
        const [line] = referenceLines(
            makeSpec([
                {
                    axis: 'x',
                    value: 7,
                    label: 'Target',
                    color: '#123456',
                    width: 3,
                    dash: [4, 2],
                    labelPosition: 'start',
                },
            ])
        );

        expect(line).toEqual({
            type: 'line',
            adjustScaleRange: true,
            borderColor: '#123456',
            borderWidth: 3,
            borderDash: [4, 2],
            xMin: 7,
            xMax: 7,
            label: {
                display: true,
                content: 'Target',
                color: '#123456',
                backgroundColor: 'white',
                position: 'start',
                rotation: 'auto',
                font: { size: 12 },
                padding: 2,
            },
        });
    });

    test('copies dash arrays instead of exposing caller state', () => {
        const dash = [2, 1];
        const [line] = referenceLines(
            makeSpec([{ axis: 'y', value: 1, dash }])
        );

        expect(line.borderDash).toEqual(dash);
        expect(line.borderDash).not.toBe(dash);
    });
});
