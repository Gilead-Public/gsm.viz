import positionToggle, {
    getIconBoxes,
    POSITIONS,
    TOOLTIP_LABELS,
} from '../../src/bars/getPlugins/positionToggle.js';

/**
 * Build a minimal mock Chart.js instance for the positionToggle plugin.
 *
 * The plugin reads chart.data._spec_, chart.chartArea, chart.canvas,
 * chart.ctx, chart.titleBlock, chart.width and chart.helpers.updateSpec.
 */
function makeChart({
    spec = { position: 'stack', mapping: { x: 'site', fill: 'status' } },
    chartArea = { top: 40, bottom: 100, left: 0, right: 200 },
    titleBlock = { top: 5, bottom: 30, height: 25 },
} = {}) {
    const updateSpec = jest.fn();
    const listeners = {};
    const canvas = {
        style: { cursor: '' },
        getBoundingClientRect: () => ({ top: 0, left: 0 }),
        addEventListener: (type, fn) => {
            listeners[type] = fn;
        },
    };
    return {
        data: { _spec_: spec },
        chartArea,
        titleBlock,
        width: 200,
        canvas,
        ctx: document.createElement('canvas').getContext('2d'),
        draw: jest.fn(),
        helpers: { updateSpec },
        _listeners: listeners,
        _updateSpec: updateSpec,
    };
}

describe('bars/positionToggle', () => {
    const plugin = positionToggle();

    function clickAt(chart, x, y) {
        plugin.afterEvent(chart, { event: { type: 'click', x, y } });
    }

    test('exposes the three toggle positions in order', () => {
        expect(POSITIONS).toEqual(['stack', 'dodge', 'fill']);
    });

    test('getIconBoxes lays out three boxes aligned with the title block', () => {
        const chart = makeChart();
        const boxes = getIconBoxes(chart);
        expect(boxes).toHaveLength(3);
        expect(boxes.map((b) => b.value)).toEqual(['stack', 'dodge', 'fill']);
        // All boxes share the same top, sit near the right edge, and ascend in x.
        expect(boxes[0].y).toBe(boxes[1].y);
        expect(boxes[0].x).toBeLessThan(boxes[1].x);
        expect(boxes[1].x).toBeLessThan(boxes[2].x);
        const last = boxes[2];
        expect(last.x + last.w).toBeLessThanOrEqual(200);
        // Icons should be above the chart area, vertically centered with the title.
        const titleMidY = (chart.titleBlock.top + chart.titleBlock.bottom) / 2;
        const iconMidY = boxes[0].y + boxes[0].h / 2;
        expect(Math.abs(iconMidY - titleMidY)).toBeLessThanOrEqual(1);
        expect(boxes[0].y).toBeLessThan(chart.chartArea.top);
    });

    test('getIconBoxes falls back to above chartArea when no titleBlock', () => {
        const chart = makeChart({ titleBlock: null });
        const boxes = getIconBoxes(chart);
        expect(boxes).toHaveLength(3);
        // Icons should still be above the chart area.
        expect(boxes[0].y + boxes[0].h).toBeLessThanOrEqual(
            chart.chartArea.top
        );
    });

    test('clicking an inactive icon updates the position', () => {
        const chart = makeChart({
            spec: { position: 'stack', mapping: { fill: 'status' } },
        });
        const boxes = getIconBoxes(chart);
        const dodge = boxes.find((b) => b.value === 'dodge');
        clickAt(chart, dodge.x + dodge.w / 2, dodge.y + dodge.h / 2);

        expect(chart._updateSpec).toHaveBeenCalledWith(chart, {
            position: 'dodge',
        });
    });

    test('clicking the fill icon updates the position to fill', () => {
        const chart = makeChart({
            spec: { position: 'stack', mapping: { fill: 'status' } },
        });
        const boxes = getIconBoxes(chart);
        const fill = boxes.find((b) => b.value === 'fill');
        clickAt(chart, fill.x + fill.w / 2, fill.y + fill.h / 2);

        expect(chart._updateSpec).toHaveBeenCalledWith(chart, {
            position: 'fill',
        });
    });

    test('clicking the already-active icon is a no-op', () => {
        const chart = makeChart({
            spec: { position: 'stack', mapping: { fill: 'status' } },
        });
        const boxes = getIconBoxes(chart);
        const stack = boxes.find((b) => b.value === 'stack');
        clickAt(chart, stack.x + stack.w / 2, stack.y + stack.h / 2);

        expect(chart._updateSpec).not.toHaveBeenCalled();
    });

    test('clicking outside the icons is a no-op', () => {
        const chart = makeChart();
        clickAt(chart, 5, 90);
        expect(chart._updateSpec).not.toHaveBeenCalled();
    });

    test('non-click events are ignored', () => {
        const chart = makeChart();
        const boxes = getIconBoxes(chart);
        const dodge = boxes.find((b) => b.value === 'dodge');
        plugin.afterEvent(chart, {
            event: {
                type: 'mousemove',
                x: dodge.x + dodge.w / 2,
                y: dodge.y + dodge.h / 2,
            },
        });
        expect(chart._updateSpec).not.toHaveBeenCalled();
    });

    test('interactive:false disables the control', () => {
        const chart = makeChart({
            spec: {
                position: 'stack',
                interactive: false,
                mapping: { fill: 'status' },
            },
        });
        const boxes = getIconBoxes(chart);
        const dodge = boxes.find((b) => b.value === 'dodge');
        clickAt(chart, dodge.x + dodge.w / 2, dodge.y + dodge.h / 2);
        expect(chart._updateSpec).not.toHaveBeenCalled();
    });

    test('no fill mapping disables the control', () => {
        const chart = makeChart({
            spec: { position: 'stack', mapping: { x: 'site' } },
        });
        const boxes = getIconBoxes(chart);
        const dodge = boxes.find((b) => b.value === 'dodge');
        clickAt(chart, dodge.x + dodge.w / 2, dodge.y + dodge.h / 2);
        expect(chart._updateSpec).not.toHaveBeenCalled();
    });

    test('afterDraw attaches a cursor handler that points over icons', () => {
        const chart = makeChart({
            spec: { position: 'stack', mapping: { fill: 'status' } },
        });
        plugin.afterDraw(chart);
        const handler = chart._listeners.mousemove;
        expect(typeof handler).toBe('function');

        const boxes = getIconBoxes(chart);
        const dodge = boxes.find((b) => b.value === 'dodge');
        handler({
            clientX: dodge.x + dodge.w / 2,
            clientY: dodge.y + dodge.h / 2,
        });
        expect(chart.canvas.style.cursor).toBe('pointer');

        // Moving away from the icons clears the pointer this plugin set.
        handler({ clientX: 5, clientY: 90 });
        expect(chart.canvas.style.cursor).toBe('');
    });

    test('afterDraw does nothing when fill mapping is absent', () => {
        const chart = makeChart({
            spec: { position: 'stack', mapping: { x: 'site' } },
        });
        plugin.afterDraw(chart);
        expect(chart._listeners.mousemove).toBeUndefined();
    });

    test('exports tooltip labels for each position', () => {
        expect(TOOLTIP_LABELS).toEqual({
            stack: 'Stacked Bars',
            dodge: 'Side-by-Side Bars',
            fill: 'Stacked, Scaled Bars',
        });
    });

    test('afterDraw draws tooltip text when hovering an icon', () => {
        const chart = makeChart({
            spec: { position: 'stack', mapping: { fill: 'status' } },
        });
        const boxes = getIconBoxes(chart);
        const dodge = boxes.find((b) => b.value === 'dodge');

        // Simulate hover state by calling the mousemove handler, then afterDraw.
        plugin.afterDraw(chart);
        chart._listeners.mousemove({
            clientX: dodge.x + dodge.w / 2,
            clientY: dodge.y + dodge.h / 2,
        });

        // Spy on ctx to confirm tooltip text is rendered on next draw.
        const fillTextSpy = jest.spyOn(chart.ctx, 'fillText');
        plugin.afterDraw(chart);
        expect(fillTextSpy).toHaveBeenCalledWith(
            'Side-by-Side Bars',
            expect.any(Number),
            expect.any(Number)
        );
        fillTextSpy.mockRestore();
    });
});
