import dataLabels from '../../src/bars/getPlugins/dataLabels.js';

describe('bars/getPlugins/dataLabels — category-axis overlap heuristic', () => {
    function makeContext({
        datasetIndex = 0,
        dataIndex = 0,
        point = { x: 'A', y: 10 },
        datasets = [{ data: [point] }],
        indexAxis = 'x',
        element = { width: 30, height: 30 },
        hidden = [],
        withCtx = true,
    } = {}) {
        return {
            datasetIndex,
            dataIndex,
            dataset: datasets[datasetIndex],
            chart: {
                data: { datasets },
                options: { indexAxis },
                isDatasetVisible(i) {
                    return !hidden.includes(i);
                },
                getDatasetMeta(i) {
                    return {
                        data: i === datasetIndex ? [element] : [],
                    };
                },
                // jest-canvas-mock's real TextMetrics also uses
                // `width = text.length`, so this mirrors real behavior
                // while remaining deterministic in a plain unit test.
                ...(withCtx
                    ? {
                          ctx: {
                              measureText: (text) => ({ width: text.length }),
                          },
                      }
                    : {}),
            },
        };
    }

    const longFormatter = () => 'a very long label that will not fit';
    const shortFormatter = () => 'a';

    describe('segment labels', () => {
        test('hides segment label when measured text width exceeds bar thickness (vertical)', () => {
            const spec = {
                annotations: {
                    labels: {
                        segment: {
                            display: true,
                            formatter: longFormatter,
                        },
                    },
                },
            };
            const config = dataLabels(spec);
            const context = makeContext({ element: { width: 5, height: 30 } });

            expect(config.labels.segment.display(context)).toBe(false);
        });

        test('shows segment label when the bar is wide enough (vertical)', () => {
            const spec = {
                annotations: {
                    labels: {
                        segment: {
                            display: true,
                            formatter: shortFormatter,
                        },
                    },
                },
            };
            const config = dataLabels(spec);
            const context = makeContext({ element: { width: 30, height: 30 } });

            expect(config.labels.segment.display(context)).toBe(true);
        });

        test('avoidCategoryOverlap: false keeps the label visible even when it would overflow', () => {
            const spec = {
                annotations: {
                    labels: {
                        segment: {
                            display: true,
                            formatter: longFormatter,
                            avoidCategoryOverlap: false,
                        },
                    },
                },
            };
            const config = dataLabels(spec);
            const context = makeContext({ element: { width: 5, height: 30 } });

            expect(config.labels.segment.display(context)).toBe(true);
        });

        test('horizontal orientation compares against element.height instead of element.width', () => {
            const spec = {
                annotations: {
                    labels: {
                        segment: {
                            display: true,
                            formatter: longFormatter,
                        },
                    },
                },
            };
            const config = dataLabels(spec);
            // Wide element.width would pass a (wrong) vertical check, but a thin
            // element.height must still hide the label for a horizontal chart.
            const context = makeContext({
                indexAxis: 'y',
                element: { width: 200, height: 5 },
            });

            expect(config.labels.segment.display(context)).toBe(false);
        });

        test('is a no-op (does not hide) when chart.ctx/measureText is unavailable', () => {
            const spec = {
                annotations: {
                    labels: {
                        segment: {
                            display: true,
                            formatter: longFormatter,
                        },
                    },
                },
            };
            const config = dataLabels(spec);
            const context = makeContext({
                element: { width: 5, height: 30 },
                withCtx: false,
            });

            expect(config.labels.segment.display(context)).toBe(true);
        });

        test('still hides when the value-axis minSize check fails, independent of category overlap', () => {
            const spec = {
                annotations: {
                    labels: {
                        segment: {
                            display: true,
                            formatter: shortFormatter,
                            minSize: 16,
                        },
                    },
                },
            };
            const config = dataLabels(spec);
            // Wide enough on the category axis, but too short on the value axis.
            const context = makeContext({ element: { width: 30, height: 10 } });

            expect(config.labels.segment.display(context)).toBe(false);
        });
    });

    describe('total labels', () => {
        test('hides total label when measured text width exceeds bar thickness (vertical)', () => {
            const spec = {
                annotations: {
                    labels: {
                        total: {
                            display: true,
                            formatter: longFormatter,
                        },
                    },
                },
            };
            const config = dataLabels(spec);
            const context = makeContext({ element: { width: 5, height: 30 } });

            expect(config.labels.total.display(context)).toBe(false);
        });

        test('shows total label when the bar is wide enough (vertical)', () => {
            const spec = {
                annotations: {
                    labels: {
                        total: {
                            display: true,
                            formatter: shortFormatter,
                        },
                    },
                },
            };
            const config = dataLabels(spec);
            const context = makeContext({ element: { width: 30, height: 30 } });

            expect(config.labels.total.display(context)).toBe(true);
        });

        test('avoidCategoryOverlap: false keeps the total label visible even when it would overflow', () => {
            const spec = {
                annotations: {
                    labels: {
                        total: {
                            display: true,
                            formatter: longFormatter,
                            avoidCategoryOverlap: false,
                        },
                    },
                },
            };
            const config = dataLabels(spec);
            const context = makeContext({ element: { width: 5, height: 30 } });

            expect(config.labels.total.display(context)).toBe(true);
        });

        test('horizontal orientation compares against element.height instead of element.width', () => {
            const spec = {
                annotations: {
                    labels: {
                        total: {
                            display: true,
                            formatter: longFormatter,
                        },
                    },
                },
            };
            const config = dataLabels(spec);
            const context = makeContext({
                indexAxis: 'y',
                element: { width: 200, height: 5 },
            });

            expect(config.labels.total.display(context)).toBe(false);
        });

        test('is a no-op (does not hide) when chart.ctx/measureText is unavailable', () => {
            const spec = {
                annotations: {
                    labels: {
                        total: {
                            display: true,
                            formatter: longFormatter,
                        },
                    },
                },
            };
            const config = dataLabels(spec);
            const context = makeContext({
                element: { width: 5, height: 30 },
                withCtx: false,
            });

            expect(config.labels.total.display(context)).toBe(true);
        });

        test('still respects isLastVisibleDatasetForCategory, independent of category overlap', () => {
            const point = { x: 'A', y: 10 };
            const datasets = [{ data: [point] }, { data: [{ x: 'A', y: 20 }] }];
            const spec = {
                annotations: {
                    labels: {
                        total: {
                            display: true,
                            formatter: shortFormatter,
                        },
                    },
                },
            };
            const config = dataLabels(spec);
            const context = makeContext({
                point,
                datasets,
                datasetIndex: 0,
                element: { width: 30, height: 30 },
            });

            // Not the last dataset for the category, so total should not show
            // regardless of the (passing) category-overlap check.
            expect(config.labels.total.display(context)).toBe(false);
        });
    });

    describe('code review follow-ups', () => {
        test('segment: a formatter returning a falsy value (0) is still measured, not treated as "no label"', () => {
            const spec = {
                annotations: {
                    labels: {
                        segment: {
                            display: true,
                            formatter: () => 0,
                        },
                    },
                },
            };
            const config = dataLabels(spec);
            // "0" measures to width 1 (mock measureText: width = text.length),
            // which does not fit a 0px-thick bar.
            const context = makeContext({ element: { width: 0, height: 30 } });

            expect(config.labels.segment.display(context)).toBe(false);
        });

        test('total: a formatter returning a falsy value (empty string) does not throw and is treated as fitting', () => {
            const spec = {
                annotations: {
                    labels: {
                        total: {
                            display: true,
                            formatter: () => '',
                        },
                    },
                },
            };
            const config = dataLabels(spec);
            const context = makeContext({ element: { width: 30, height: 30 } });

            expect(config.labels.total.display(context)).toBe(true);
        });

        test('segment: does not invoke a custom formatter twice for one label render', () => {
            const formatter = jest.fn(
                () => 'a very long label that will not fit'
            );
            const spec = {
                annotations: {
                    labels: {
                        segment: { display: true, formatter },
                    },
                },
            };
            const config = dataLabels(spec);
            const context = makeContext({ element: { width: 5, height: 30 } });

            // Mirrors how chartjs-plugin-datalabels drives a single label
            // render: display() is checked first, then formatter() is
            // called to produce the rendered text for the same context.
            config.labels.segment.display(context);
            config.labels.segment.formatter(context.dataset.data[0], context);

            expect(formatter).toHaveBeenCalledTimes(1);
        });

        test('total: does not invoke a custom formatter twice for one label render', () => {
            const formatter = jest.fn(
                () => 'a very long label that will not fit'
            );
            const spec = {
                annotations: {
                    labels: {
                        total: { display: true, formatter },
                    },
                },
            };
            const config = dataLabels(spec);
            const context = makeContext({ element: { width: 5, height: 30 } });

            config.labels.total.display(context);
            config.labels.total.formatter(context.dataset.data[0], context);

            expect(formatter).toHaveBeenCalledTimes(1);
        });

        test('segment: measures text under options.font when provided', () => {
            const spec = {
                annotations: {
                    labels: {
                        segment: {
                            display: true,
                            formatter: () => 'x',
                            font: { size: 20, family: 'Arial' },
                        },
                    },
                },
            };
            const config = dataLabels(spec);
            let fontDuringMeasure;
            const context = makeContext({ element: { width: 5, height: 30 } });
            context.chart.ctx.measureText = jest.fn((text) => {
                fontDuringMeasure = context.chart.ctx.font;
                return { width: text.length };
            });

            config.labels.segment.display(context);

            expect(fontDuringMeasure).toEqual(expect.stringContaining('Arial'));
        });

        test('segment: uses the canvas font for scriptable font options', () => {
            const spec = {
                annotations: {
                    labels: {
                        segment: {
                            display: true,
                            formatter: () => 'x',
                            font: () => ({ size: 20, family: 'Arial' }),
                        },
                    },
                },
            };
            const config = dataLabels(spec);
            let fontDuringMeasure;
            const context = makeContext({ element: { width: 5, height: 30 } });
            context.chart.ctx.font = '16px Custom';
            context.chart.ctx.measureText = jest.fn((text) => {
                fontDuringMeasure = context.chart.ctx.font;
                return { width: text.length };
            });

            config.labels.segment.display(context);

            expect(fontDuringMeasure).toBe('16px Custom');
        });
    });
});
