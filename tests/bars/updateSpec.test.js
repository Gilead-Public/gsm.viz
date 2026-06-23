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
});
