/**
 * @jest-environment jsdom
 */

import exportImage from '../../src/bars/exportImage.js';

// Minimal chart stub that mimics Chart.js instance shape used by exportImage.
function makeChartStub(dataURL = 'data:image/png;base64,abc123', spec = null) {
    return {
        toBase64Image: jest.fn().mockReturnValue(dataURL),
        data: { _spec_: spec },
    };
}

describe('exportImage', () => {
    let clickSpy;
    let createdAnchors;

    beforeEach(() => {
        createdAnchors = [];
        clickSpy = jest.fn();

        // Intercept document.createElement so we can inspect and spy on anchors.
        const originalCreate = document.createElement.bind(document);
        jest
            .spyOn(document, 'createElement')
            .mockImplementation((tagName, ...rest) => {
                const el = originalCreate(tagName, ...rest);
                if (tagName === 'a') {
                    jest.spyOn(el, 'click').mockImplementation(clickSpy);
                    createdAnchors.push(el);
                }
                return el;
            });

        jest.spyOn(document.body, 'appendChild').mockImplementation(() => {});
        jest.spyOn(document.body, 'removeChild').mockImplementation(() => {});
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    test('calls chart.toBase64Image() to get the PNG data URL', () => {
        const chart = makeChartStub();
        exportImage(chart);
        expect(chart.toBase64Image).toHaveBeenCalledTimes(1);
    });

    test('creates an anchor element', () => {
        const chart = makeChartStub();
        exportImage(chart);
        expect(createdAnchors).toHaveLength(1);
    });

    test('sets download attribute to "bars.png" when no filename and no spec', () => {
        const chart = makeChartStub();
        exportImage(chart);
        expect(createdAnchors[0].download).toBe('bars.png');
    });

    test('derives default filename from spec.labels.title when no filename given', () => {
        const chart = makeChartStub('data:image/png;base64,abc', {
            labels: { title: 'Retention Status by Site' },
        });
        exportImage(chart);
        expect(createdAnchors[0].download).toBe('retention-status-by-site.png');
    });

    test('derives default filename from scale labels when title absent', () => {
        const chart = makeChartStub('data:image/png;base64,abc', {
            scales: { fill: { label: 'Flag' }, x: { label: 'Metric ID' } },
        });
        exportImage(chart);
        expect(createdAnchors[0].download).toBe('flag-by-metric-id.png');
    });

    test('derives default filename from mapping when title and scale labels absent', () => {
        const chart = makeChartStub('data:image/png;base64,abc', {
            mapping: { fill: 'Flag', x: 'MetricID' },
        });
        exportImage(chart);
        expect(createdAnchors[0].download).toBe('flag-by-metricid.png');
    });

    test('sets download attribute to the provided filename', () => {
        const chart = makeChartStub();
        exportImage(chart, 'my-chart.png');
        expect(createdAnchors[0].download).toBe('my-chart.png');
    });

    test('sets href to the base64 data URL returned by the chart', () => {
        const url = 'data:image/png;base64,xyz789';
        const chart = makeChartStub(url);
        exportImage(chart);
        expect(createdAnchors[0].href).toBe(url);
    });

    test('appends the anchor to document.body', () => {
        const chart = makeChartStub();
        exportImage(chart);
        expect(document.body.appendChild).toHaveBeenCalledWith(
            createdAnchors[0]
        );
    });

    test('triggers a click on the anchor', () => {
        const chart = makeChartStub();
        exportImage(chart);
        expect(clickSpy).toHaveBeenCalledTimes(1);
    });

    test('removes the anchor from document.body after clicking', () => {
        const chart = makeChartStub();
        exportImage(chart);
        expect(document.body.removeChild).toHaveBeenCalledWith(
            createdAnchors[0]
        );
    });

    test('removes the anchor after appending (append before remove)', () => {
        const chart = makeChartStub();
        const appendOrder = [];
        document.body.appendChild.mockImplementation((el) =>
            appendOrder.push('append')
        );
        document.body.removeChild.mockImplementation((el) =>
            appendOrder.push('remove')
        );
        exportImage(chart);
        expect(appendOrder).toEqual(['append', 'remove']);
    });
});
