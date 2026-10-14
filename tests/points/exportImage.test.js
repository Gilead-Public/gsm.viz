/**
 * @jest-environment jsdom
 */

import exportImage from '../../src/points/exportImage.js';

function makeChart(spec, dataURL = 'data:image/png;base64,points') {
    return {
        data: { _spec_: spec },
        toBase64Image: jest.fn(() => dataURL),
    };
}

describe('points/exportImage', () => {
    let anchor;

    beforeEach(() => {
        anchor = document.createElement('a');
        jest.spyOn(anchor, 'click').mockImplementation(() => {});
        const createElement = document.createElement.bind(document);
        jest.spyOn(document, 'createElement').mockImplementation((tag) =>
            tag === 'a' ? anchor : createElement(tag)
        );
    });

    afterEach(() => {
        anchor.remove();
        jest.restoreAllMocks();
    });

    test('downloads the white-canvas PNG with a derived filename', () => {
        const chart = makeChart({
            labels: { title: 'Events by Exposure' },
        });

        exportImage(chart);

        expect(chart.toBase64Image).toHaveBeenCalledTimes(1);
        expect(anchor.download).toBe('events-by-exposure.png');
        expect(anchor.href).toBe('data:image/png;base64,points');
        expect(anchor.click).toHaveBeenCalledTimes(1);
        expect(document.body.contains(anchor)).toBe(false);
    });

    test('uses an explicit filename without rewriting it', () => {
        const chart = makeChart(null);

        exportImage(chart, 'Report Figure.PNG');

        expect(anchor.download).toBe('Report Figure.PNG');
    });

    test.each([null, '', 42])(
        'rejects invalid explicit filename %p',
        (filename) => {
            expect(() => exportImage(makeChart(null), filename)).toThrow(
                'points exportImage filename must be a non-empty string'
            );
        }
    );

    test('removes the temporary anchor when clicking throws', () => {
        anchor.click.mockImplementation(() => {
            throw new Error('blocked download');
        });

        expect(() => exportImage(makeChart(null))).toThrow('blocked download');
        expect(document.body.contains(anchor)).toBe(false);
    });
});
