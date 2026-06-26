/**
 * @jest-environment jsdom
 */

import bars from '../../src/bars.js';
import updateData from '../../src/bars/updateData.js';
import updateSpec from '../../src/bars/updateSpec.js';

describe('bars/updateSpec', () => {
    const container = document.createElement('div');

    const data = [
        { category: 'A', value: 10 },
        { category: 'B', value: 20 },
    ];
    const spec = {
        mapping: { x: 'category', y: 'value' },
        labels: { title: 'Original' },
    };

    test('accepts a partial spec without data/mapping', () => {
        const chart = bars(container, data, spec);
        expect(() =>
            updateSpec(chart, { labels: { title: 'Updated' } })
        ).not.toThrow();
        expect(chart.options.plugins.title.text).toBe('Updated');
    });

    test('rebuilds data when orientation changes', () => {
        const chart = bars(container, data, spec);
        updateSpec(chart, { orientation: 'horizontal' });
        expect(chart.options.indexAxis).toBe('y');
        // Points should be swapped for horizontal
        const point = chart.data.datasets[0].data[0];
        expect(typeof point.x).toBe('number');
        expect(typeof point.y).toBe('string');
    });

    test('preserves existing data and mapping', () => {
        const chart = bars(container, data, spec);
        updateSpec(chart, { labels: { title: 'New Title' } });
        expect(chart.data._spec_.data).toBe(data);
        expect(chart.data._spec_.mapping.x).toBe('category');
    });

    test('stores all labels as a stable snapshot after a spec update', () => {
        const chart = bars(container, data, spec);
        updateSpec(chart, { scales: { x: { order: ['B', 'A'] } } });
        const labels = chart.data.labels;

        expect(chart.data._allLabels_).toEqual(labels);
        expect(chart.data._allLabels_).not.toBe(labels);

        labels.pop();
        expect(chart.data._allLabels_).toEqual(['B', 'A']);
    });

    test('stores all labels as a stable snapshot after a data update', () => {
        const chart = bars(container, data, spec);
        updateData(
            chart,
            [
                { category: 'C', value: 30 },
                { category: 'D', value: 40 },
            ],
            spec
        );
        const labels = chart.data.labels;

        expect(chart.data._allLabels_).toEqual(labels);
        expect(chart.data._allLabels_).not.toBe(labels);

        labels.pop();
        expect(chart.data._allLabels_).toEqual(['C', 'D']);
    });

    test('preserves existing annotation label modes on partial spec update', () => {
        const chart = bars(container, data, {
            ...spec,
            annotations: {
                labels: {
                    segment: {
                        display: true,
                        color: '#111111',
                    },
                },
            },
        });

        updateSpec(chart, {
            annotations: {
                labels: {
                    total: {
                        display: true,
                    },
                },
            },
        });

        expect(chart.data._spec_.annotations.labels.segment.display).toBe(true);
        expect(chart.data._spec_.annotations.labels.segment.color).toBe(
            '#111111'
        );
        expect(chart.data._spec_.annotations.labels.total.display).toBe(true);
    });

    test('rebuilds datalabel options after a partial annotation update', () => {
        const chart = bars(container, data, spec);

        updateSpec(chart, {
            annotations: {
                labels: {
                    segment: {
                        display: true,
                        placement: 'end',
                    },
                },
            },
        });

        expect(chart.options.plugins.datalabels.labels.segment).toBeDefined();
        expect(chart.data._spec_.annotations.labels.segment.display).toBe(true);
        expect(chart.data._spec_.annotations.labels.segment.placement).toBe(
            'end'
        );
    });

    test('rebuilds datalabel options after a data update', () => {
        const chart = bars(container, data, {
            ...spec,
            annotations: {
                labels: {
                    segment: {
                        display: true,
                    },
                },
            },
        });

        updateData(
            chart,
            [
                { category: 'C', value: 30 },
                { category: 'D', value: 40 },
            ],
            chart.data._spec_
        );

        expect(chart.options.plugins.datalabels.labels.segment).toBeDefined();
        expect(chart.data._spec_.annotations.labels.segment.display).toBe(true);
        expect(chart.data.labels).toEqual(['C', 'D']);
    });

    test('preserves inside annotation label mode on partial spec update', () => {
        const chart = bars(container, data, {
            ...spec,
            annotations: {
                labels: {
                    total: {
                        display: true,
                        placement: 'inside',
                        color: '#ffffff',
                    },
                },
            },
        });

        updateSpec(chart, { labels: { title: 'Updated' } });

        expect(chart.data._spec_.annotations.labels.total.display).toBe(true);
        expect(chart.data._spec_.annotations.labels.total.placement).toBe(
            'inside'
        );
        expect(chart.data._spec_.annotations.labels.total.color).toBe(
            '#ffffff'
        );
    });

    test('rebuilds datalabel options with inside total placement after a partial annotation update', () => {
        const chart = bars(container, data, spec);

        updateSpec(chart, {
            annotations: {
                labels: {
                    total: { display: true, placement: 'inside' },
                },
            },
        });

        expect(chart.options.plugins.datalabels.labels.total).toBeDefined();
        expect(chart.data._spec_.annotations.labels.total.display).toBe(true);
        expect(chart.data._spec_.annotations.labels.total.placement).toBe(
            'inside'
        );
    });

    describe('nCategories + _nExcluded wiring', () => {
        const manyData = [
            { category: 'A', value: 5 },
            { category: 'B', value: 30 },
            { category: 'C', value: 10 },
            { category: 'D', value: 20 },
            { category: 'E', value: 1 },
        ];

        test('updateSpec sets _nExcluded on merged spec so caption renders', () => {
            const chart = bars(container, manyData, {
                mapping: { x: 'category', y: 'value' },
            });
            updateSpec(chart, {
                nCategories: 3,
                scales: { x: { label: 'Category', sort: 'total' } },
            });
            expect(chart.data._spec_._nExcluded).toBe(2);
            expect(chart.options.plugins.subtitle.text).toContain(
                'Displaying top 3 values of Category by total. Remaining 2 values of Category are hidden (2 records). Click to show all.'
            );
        });

        test('updateData preserves _originalNCategories across a data update', () => {
            const chart = bars(container, manyData, {
                mapping: { x: 'category', y: 'value' },
                nCategories: 3,
                scales: { x: { label: 'Category', sort: 'total' } },
            });
            // Simulate the user toggling to "show all": nCategories cleared,
            // original value stashed on the live spec.
            chart.data._spec_._originalNCategories = 3;
            chart.data._spec_.nCategories = undefined;

            updateData(chart, manyData, {
                mapping: { x: 'category', y: 'value' },
                nCategories: undefined,
                scales: { x: { label: 'Category', sort: 'total' } },
            });

            expect(chart.data._spec_._originalNCategories).toBe(3);
        });

        test('updateData sets _nExcluded on merged spec so caption renders', () => {
            const chart = bars(container, manyData, {
                mapping: { x: 'category', y: 'value' },
                nCategories: 3,
                scales: { x: { label: 'Category', sort: 'total' } },
            });
            updateData(chart, manyData, {
                mapping: { x: 'category', y: 'value' },
                nCategories: 2,
                scales: { x: { label: 'Category', sort: 'total' } },
            });
            expect(chart.data._spec_._nExcluded).toBe(3);
            expect(chart.options.plugins.subtitle.text).toContain(
                'Displaying top 2 values of Category by total. Remaining 3 values of Category are hidden (3 records). Click to show all.'
            );
        });
    });

    test('preserves legend hidden state across spec updates', () => {
        const fillData = [
            { category: 'A', value: 10, group: 'X' },
            { category: 'A', value: 5, group: 'Y' },
            { category: 'B', value: 20, group: 'X' },
            { category: 'B', value: 15, group: 'Y' },
        ];
        const chart = bars(container, fillData, {
            mapping: { x: 'category', y: 'value', fill: 'group' },
        });

        // Simulate hiding the first dataset via legend click.
        chart.setDatasetVisibility(0, false);
        chart.update();
        expect(chart.isDatasetVisible(0)).toBe(false);
        expect(chart.isDatasetVisible(1)).toBe(true);

        // Toggle position — this calls updateSpec internally.
        updateSpec(chart, { position: 'dodge' });

        // The first dataset (group 'X') should still be hidden.
        const xIndex = chart.data.datasets.findIndex((ds) => ds.label === 'X');
        expect(chart.isDatasetVisible(xIndex)).toBe(false);
        const yIndex = chart.data.datasets.findIndex((ds) => ds.label === 'Y');
        expect(chart.isDatasetVisible(yIndex)).toBe(true);
    });

    test('preserves dynamic category axis state across spec updates', () => {
        const fillData = [
            { category: 'A', value: 10, group: 'X' },
            { category: 'A', value: 5, group: 'Y' },
            { category: 'B', value: 20, group: 'X' },
            { category: 'C', value: 15, group: 'Y' },
        ];
        const chart = bars(container, fillData, {
            mapping: { x: 'category', y: 'value', fill: 'group' },
            theme: { dynamicCategoryAxis: true },
        });

        // Simulate hiding group 'X' via the legend click handler.
        const legendRef = { chart };
        const legendPlugin = chart.options.plugins.legend;
        legendPlugin.onClick({}, { datasetIndex: 0 }, legendRef);

        // After hiding 'X', only categories with 'Y' data remain.
        expect(chart.isDatasetVisible(0)).toBe(false);
        expect(chart.data.labels).toEqual(['A', 'C']);

        // Toggle position — calls updateSpec internally.
        updateSpec(chart, { position: 'dodge' });

        // 'X' should still be hidden and labels should still reflect only
        // categories with visible data.
        const xIndex = chart.data.datasets.findIndex((ds) => ds.label === 'X');
        expect(chart.isDatasetVisible(xIndex)).toBe(false);
        expect(chart.data.labels).toEqual(['A', 'C']);
    });

    test('dynamicSizing uses filtered label count after dynamic category axis update', () => {
        const fillData = [
            { category: 'A', value: 10, group: 'X' },
            { category: 'A', value: 5, group: 'Y' },
            { category: 'B', value: 20, group: 'X' },
            { category: 'C', value: 15, group: 'Y' },
        ];
        const chart = bars(container, fillData, {
            mapping: { x: 'category', y: 'value', fill: 'group' },
            theme: { dynamicCategoryAxis: true, dynamicSizing: true },
            orientation: 'horizontal',
        });

        // Hide group 'X' via the legend click handler.
        const legendPlugin = chart.options.plugins.legend;
        legendPlugin.onClick({}, { datasetIndex: 0 }, { chart });

        // Only categories with 'Y' data remain: A and C.
        expect(chart.data.labels).toEqual(['A', 'C']);

        updateSpec(chart, { position: 'dodge' });

        // After updateSpec the container height should reflect 2 visible
        // categories, not all 3.
        expect(chart.data.labels).toEqual(['A', 'C']);
        const el = chart.canvas.parentNode;
        const allCatHeight = el.style.height;

        // Rebuild with all legend items visible to get the "full" height.
        chart.setDatasetVisibility(0, true);
        updateSpec(chart, { position: 'stack' });
        const fullHeight = el.style.height;

        expect(allCatHeight).not.toBe(fullHeight);
    });

    describe('theme.pxPerCategory', () => {
        test('updateSpec uses custom pxPerCategory for dynamic sizing', () => {
            const chart = bars(container, data, {
                ...spec,
                orientation: 'horizontal',
                theme: { dynamicSizing: true, pxPerCategory: 50 },
            });
            const el = chart.canvas.parentNode;

            updateSpec(chart, { labels: { title: 'Updated' } });

            const area = chart.chartArea;
            const overhead = area ? chart.height - (area.bottom - area.top) : 0;
            expect(el.style.height).toBe(2 * 50 + overhead + 'px');
        });

        test('updateData uses custom pxPerCategory for dynamic sizing', () => {
            const chart = bars(container, data, {
                ...spec,
                orientation: 'horizontal',
                theme: { dynamicSizing: true, pxPerCategory: 50 },
            });
            const el = chart.canvas.parentNode;

            updateData(chart, data, {
                ...spec,
                orientation: 'horizontal',
                theme: { dynamicSizing: true, pxPerCategory: 50 },
            });

            const area = chart.chartArea;
            const overhead = area ? chart.height - (area.bottom - area.top) : 0;
            expect(el.style.height).toBe(2 * 50 + overhead + 'px');
        });

        test('defaults to 30 when pxPerCategory is not specified', () => {
            const chart = bars(container, data, {
                ...spec,
                orientation: 'horizontal',
                theme: { dynamicSizing: true },
            });
            const el = chart.canvas.parentNode;

            updateSpec(chart, { labels: { title: 'Updated' } });

            const area = chart.chartArea;
            const overhead = area ? chart.height - (area.bottom - area.top) : 0;
            expect(el.style.height).toBe(2 * 30 + overhead + 'px');
        });
    });

    describe('dynamicSizing inline dimension cleanup', () => {
        test('updateSpec clears stale inline sizing when dynamicSizing is disabled', () => {
            const chart = bars(container, data, {
                ...spec,
                theme: { dynamicSizing: true },
            });
            // Simulate previously-applied dynamic sizing on the container.
            const el = chart.canvas.parentNode;
            el.style.width = '500px';
            el.style.height = '400px';

            updateSpec(chart, { theme: { dynamicSizing: false } });

            expect(el.style.width).toBe('');
            expect(el.style.height).toBe('');
        });

        test('updateData clears stale inline sizing when dynamicSizing is disabled', () => {
            const chart = bars(container, data, {
                ...spec,
                theme: { dynamicSizing: true },
            });
            const el = chart.canvas.parentNode;
            el.style.width = '500px';
            el.style.height = '400px';

            updateData(chart, data, {
                ...spec,
                theme: { dynamicSizing: false },
            });

            expect(el.style.width).toBe('');
            expect(el.style.height).toBe('');
        });
    });

    describe('layer position', () => {
        const fillData = [
            { category: 'A', group: 'X', value: 10 },
            { category: 'A', group: 'Y', value: 20 },
            { category: 'B', group: 'X', value: 30 },
            { category: 'B', group: 'Y', value: 40 },
        ];
        const fillSpec = {
            mapping: { x: 'category', y: 'value', fill: 'group' },
        };

        test('switching to layer applies barPercentage to datasets', () => {
            const chart = bars(container, fillData, fillSpec);
            updateSpec(chart, { position: 'layer' });
            chart.data.datasets.forEach((ds) => {
                expect(ds.barPercentage).toBeDefined();
                expect(ds.categoryPercentage).toBe(1.0);
            });
            // Last dataset should be widest (drawn in back by Chart.js)
            const last = chart.data.datasets[chart.data.datasets.length - 1];
            const first = chart.data.datasets[0];
            expect(last.barPercentage).toBeGreaterThan(first.barPercentage);
        });

        test('switching from layer to stack removes barPercentage', () => {
            const chart = bars(container, fillData, {
                ...fillSpec,
                position: 'layer',
            });
            expect(chart.data.datasets[0].barPercentage).toBeDefined();
            expect(chart.data.datasets[0].grouped).toBe(false);
            updateSpec(chart, { position: 'stack' });
            chart.data.datasets.forEach((ds) => {
                expect(ds.barPercentage).toBeUndefined();
                expect(ds.categoryPercentage).toBeUndefined();
                expect(ds.grouped).toBeUndefined();
            });
        });
    });
});
