/**
 * @jest-environment jsdom
 */

import tiles from '../../src/tiles.js';
import gsmViz from '../../src/main.js';
import { makeData, makeSpec } from './fixtures.js';

const bodyCells = (el) => el.querySelectorAll('tbody td');

describe('tiles render', () => {
    let el;

    beforeEach(() => {
        el = document.createElement('div');
        el.id = 'tiles-container';
        document.body.appendChild(el);
    });

    afterEach(() => {
        document.body.innerHTML = '';
    });

    test('is registered on the gsmViz default export', () => {
        expect(gsmViz.tiles).toBe(tiles);
    });

    test('renders one cell per row × column, with missing cells', () => {
        tiles(el, makeData(), makeSpec());
        expect(el.querySelectorAll('tbody tr')).toHaveLength(3);
        expect(bodyCells(el)).toHaveLength(6);
        const missing = el.querySelectorAll('td.gsm-tiles-missing');
        expect(missing).toHaveLength(2);
        missing.forEach((td) => {
            expect(td.textContent).toBe('');
            expect(td.style.backgroundColor).toBe('rgb(246, 246, 246)');
        });
    });

    test('renders headers, labels, fill and contrasting text colors', () => {
        tiles(el, makeData(), makeSpec());
        expect(el.querySelector('.gsm-tiles-corner').textContent).toBe(
            'subjid'
        );
        expect(
            [...el.querySelectorAll('.gsm-tiles-row-header')].map(
                (th) => th.textContent
            )
        ).toEqual(['S1', 'S2', 'S3']);
        const [weight, pulse] = bodyCells(el);
        expect(weight.textContent).toBe('50%');
        expect(weight.style.backgroundColor).toBe('rgb(255, 0, 0)');
        expect(weight.style.color).toBe('rgb(255, 255, 255)');
        expect(bodyCells(el)[2].style.color).toBe('rgb(51, 51, 51)');
        expect(pulse.style.backgroundColor).toBe('rgb(61, 175, 6)');
        // Fill value without a color gets the neutral fill.
        const s3Pulse = bodyCells(el)[5];
        expect(s3Pulse.style.backgroundColor).toBe('rgb(217, 217, 217)');
    });

    test('renders multi-line labels as text with pre-line whitespace', () => {
        const data = makeData().map((d) => ({
            ...d,
            both: `${d.rate}\n${d.nd}`,
        }));
        tiles(el, data, {
            ...makeSpec(),
            mapping: { ...makeSpec().mapping, label: 'both' },
        });
        expect(bodyCells(el)[0].textContent).toBe('50%\n1/2');
        const css = document.getElementById('gsm-viz-tiles-style').textContent;
        expect(css).toMatch(/\.gsm-tiles-cell \{[^}]*white-space: pre-line/);
    });

    test('injects the stylesheet once', () => {
        tiles(el, makeData(), makeSpec());
        tiles(el, makeData(), makeSpec());
        expect(document.querySelectorAll('#gsm-viz-tiles-style')).toHaveLength(
            1
        );
    });

    test('renders title, subtitle, axis labels and legend', () => {
        tiles(el, makeData(), {
            ...makeSpec(),
            labels: { title: 'Vitals', subtitle: 'By participant' },
            scales: {
                ...makeSpec().scales,
                x: { label: 'Vital sign' },
                y: { label: 'Participant' },
            },
        });
        expect(el.querySelector('.gsm-tiles-title').textContent).toBe('Vitals');
        expect(el.querySelector('.gsm-tiles-subtitle').textContent).toBe(
            'By participant'
        );
        expect(el.querySelector('.gsm-tiles-x-label').textContent).toBe(
            'Vital sign'
        );
        expect(el.querySelector('.gsm-tiles-corner').textContent).toBe(
            'Participant'
        );
        const groups = el.querySelectorAll('.gsm-tiles-legend-group');
        expect(groups).toHaveLength(1);
        expect(
            groups[0].querySelector('.gsm-tiles-legend-title').textContent
        ).toBe('Flag');
        expect(
            [...groups[0].querySelectorAll('.gsm-tiles-legend-item')].map(
                (n) => n.textContent
            )
        ).toEqual(['Green', 'Amber', 'Red']);
    });

    test('legend honours fill order and can be hidden', () => {
        const spec = makeSpec();
        spec.scales.fill.order = ['Red', 'Green'];
        tiles(el, makeData(), spec);
        expect(
            [...el.querySelectorAll('.gsm-tiles-legend-item')].map(
                (n) => n.textContent
            )
        ).toEqual(['Red', 'Green']);
        tiles(el, makeData(), { ...spec, theme: { legend: false } });
        expect(el.querySelector('.gsm-tiles-legend')).toBeNull();
    });

    test('sets default and custom tooltips', () => {
        tiles(el, makeData(), makeSpec());
        expect(bodyCells(el)[0].title).toBe('S1 · Weight: 50%');
        tiles(el, makeData(), {
            ...makeSpec(),
            tooltip: { format: '{subjid} – {vital}: {nd} ({flag})' },
        });
        expect(bodyCells(el)[0].title).toBe('S1 – Weight: 1/2 (Red)');
        tiles(el, makeData(), {
            ...makeSpec(),
            tooltip: { formatter: (d) => `flag ${d.flag}` },
        });
        expect(bodyCells(el)[0].title).toBe('flag Red');
    });

    test('applies scales.x.order and scales.y.order', () => {
        tiles(el, makeData(), {
            ...makeSpec(),
            scales: {
                x: { order: ['Pulse', 'Weight'] },
                y: { order: ['S3', 'S1'] },
            },
        });
        expect(
            [...el.querySelectorAll('.gsm-tiles-col-header')].map(
                (th) => th.title
            )
        ).toEqual(['Pulse', 'Weight']);
        expect(
            [...el.querySelectorAll('.gsm-tiles-row-header')].map(
                (th) => th.textContent
            )
        ).toEqual(['S3', 'S1', 'S2']);
    });

    test('applies theme sizes', () => {
        tiles(el, makeData(), {
            ...makeSpec(),
            theme: { cellWidth: 50, rowHeaderWidth: 100, maxHeight: 300 },
        });
        expect(el.querySelector('.gsm-tiles-scroll').style.maxHeight).toBe(
            '300px'
        );
        expect(el.querySelector('table').style.width).toBe('200px');
        expect(el.querySelector('.gsm-tiles').style.fontSize).toBe('12px');
    });

    test('accepts a selector and throws when not found', () => {
        tiles('#tiles-container', makeData(), makeSpec());
        expect(el.querySelectorAll('table')).toHaveLength(1);
        expect(() => tiles('#nope', makeData(), makeSpec())).toThrow(
            'tiles: could not find element matching "#nope"'
        );
    });

    test('re-rendering replaces previous content and destroy removes it', () => {
        tiles(el, makeData(), makeSpec());
        const chart = tiles(el, makeData(), makeSpec());
        expect(el.querySelectorAll('.gsm-tiles')).toHaveLength(1);
        expect(chart.element).toBe(el);
        expect(chart.helpers.updateData).toEqual(expect.any(Function));
        chart.destroy();
        expect(el.querySelector('.gsm-tiles')).toBeNull();
    });
});
