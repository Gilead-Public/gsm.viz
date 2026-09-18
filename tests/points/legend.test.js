/**
 * @jest-environment jsdom
 */

import points from '../../src/points.js';

global.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
};

const data = [
    { x: 1, y: 1, group: 'A', n: 1 },
    { x: 2, y: 2, group: 'A', n: 100 },
    { x: 3, y: 1, group: 'B', n: 100 },
    { x: 4, y: 2, group: 'B', n: 1 },
];

function swatches(mapping) {
    const container = document.createElement('div');
    document.body.appendChild(container);
    const chart = points(container, data, {
        mapping: { x: 'x', y: 'y', color: 'group', ...mapping },
    });
    const colors = chart.legend.legendItems.map((item) => [
        item.fillStyle,
        item.strokeStyle,
    ]);
    chart.destroy();
    container.remove();

    return colors;
}

test('legend swatches ignore point opacity (#573)', () => {
    expect(swatches({ opacity: 'n' })).toEqual(swatches({}));
});
