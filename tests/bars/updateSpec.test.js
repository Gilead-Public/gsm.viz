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
});
