import denseLegend from '../../src/bars/getPlugins/denseLegend.js';

describe('bars/getPlugins/denseLegend', () => {
    describe('generateLabels', () => {
        function makeChart(labels) {
            return {
                data: {
                    datasets: labels.map((label, i) => ({
                        label,
                        backgroundColor: `#${String(i).padStart(6, '0')}`,
                        borderColor: `#${String(i).padStart(6, '0')}`,
                        hidden: false,
                    })),
                },
                isDatasetVisible: (idx) => !makeChart._hidden.has(idx),
            };
        }
        makeChart._hidden = new Set();

        test('returns legend items with empty text', () => {
            const config = denseLegend();
            const chart = makeChart(['Group A', 'Group B', 'Group C']);
            const items = config.labels.generateLabels(chart);
            items.forEach((item) => {
                expect(item.text).toBe('');
            });
        });

        test('preserves full label in _fullLabel property', () => {
            const config = denseLegend();
            const chart = makeChart(['Group A', 'Group B']);
            const items = config.labels.generateLabels(chart);
            expect(items[0]._fullLabel).toBe('Group A');
            expect(items[1]._fullLabel).toBe('Group B');
        });

        test('preserves datasetIndex on each item', () => {
            const config = denseLegend();
            const chart = makeChart(['X', 'Y', 'Z']);
            const items = config.labels.generateLabels(chart);
            expect(items[0].datasetIndex).toBe(0);
            expect(items[1].datasetIndex).toBe(1);
            expect(items[2].datasetIndex).toBe(2);
        });

        test('preserves fill/stroke styles from datasets', () => {
            const config = denseLegend();
            const chart = makeChart(['A']);
            const items = config.labels.generateLabels(chart);
            expect(items[0].fillStyle).toBe('#000000');
            expect(items[0].strokeStyle).toBe('#000000');
        });
    });

    describe('onHover', () => {
        let container;
        let canvas;

        beforeEach(() => {
            container = document.createElement('div');
            canvas = document.createElement('canvas');
            container.appendChild(canvas);
            document.body.appendChild(container);
            container.getBoundingClientRect = () => ({
                left: 0,
                top: 0,
                right: 400,
                bottom: 300,
            });
            canvas.getBoundingClientRect = () => ({
                left: 0,
                top: 0,
                right: 400,
                bottom: 300,
            });
        });

        afterEach(() => {
            document.body.removeChild(container);
        });

        test('creates a tooltip element on hover', () => {
            const config = denseLegend();
            const chart = { canvas };
            const legendItem = { _fullLabel: 'Treatment Arm A' };
            const event = { x: 100, y: 50 };

            config.onHover(event, legendItem, { chart });

            const tooltip = container.querySelector(
                '[data-dense-legend-tooltip]'
            );
            expect(tooltip).not.toBeNull();
            expect(tooltip.textContent).toBe('Treatment Arm A');
        });

        test('positions tooltip near the event coordinates', () => {
            const config = denseLegend();
            const chart = { canvas };
            const legendItem = { _fullLabel: 'Label' };
            const event = { x: 150, y: 80 };

            config.onHover(event, legendItem, { chart });

            const tooltip = container.querySelector(
                '[data-dense-legend-tooltip]'
            );
            expect(tooltip.style.position).toBe('absolute');
            expect(tooltip.style.left).toBe('150px');
            expect(tooltip.style.top).toBe('96px');
        });

        test('reuses existing tooltip element on subsequent hovers', () => {
            const config = denseLegend();
            const chart = { canvas };
            const event = { x: 100, y: 50 };

            config.onHover(event, { _fullLabel: 'First' }, { chart });
            config.onHover(event, { _fullLabel: 'Second' }, { chart });

            const tooltips = container.querySelectorAll(
                '[data-dense-legend-tooltip]'
            );
            expect(tooltips.length).toBe(1);
            expect(tooltips[0].textContent).toBe('Second');
        });
    });

    describe('onLeave', () => {
        let container;
        let canvas;

        beforeEach(() => {
            container = document.createElement('div');
            canvas = document.createElement('canvas');
            container.appendChild(canvas);
            document.body.appendChild(container);
            container.getBoundingClientRect = () => ({
                left: 0,
                top: 0,
                right: 400,
                bottom: 300,
            });
            canvas.getBoundingClientRect = () => ({
                left: 0,
                top: 0,
                right: 400,
                bottom: 300,
            });
        });

        afterEach(() => {
            document.body.removeChild(container);
        });

        test('hides the tooltip on leave', () => {
            const config = denseLegend();
            const chart = { canvas };
            const event = { x: 100, y: 50 };

            // show tooltip first
            config.onHover(event, { _fullLabel: 'Label' }, { chart });
            const tooltip = container.querySelector(
                '[data-dense-legend-tooltip]'
            );
            expect(tooltip.style.display).not.toBe('none');

            // trigger leave
            config.onLeave(event, {}, { chart });
            expect(tooltip.style.display).toBe('none');
        });

        test('does not throw when no tooltip exists', () => {
            const config = denseLegend();
            const chart = { canvas };
            const event = { x: 100, y: 50 };

            expect(() => config.onLeave(event, {}, { chart })).not.toThrow();
        });
    });
});
