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
    let plugin;

    beforeEach(() => {
        plugin = positionToggle();
    });

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

    test('layer position disables the control', () => {
        const chart = makeChart({
            spec: {
                position: 'layer',
                mapping: { x: 'site', fill: 'status' },
            },
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

        // Register the native canvas handler by calling afterDraw first.
        plugin.afterDraw(chart);

        // Simulate hover via the Chart.js synthetic mousemove event so hoveredValue is set.
        plugin.afterEvent(chart, {
            event: {
                type: 'mousemove',
                x: dodge.x + dodge.w / 2,
                y: dodge.y + dodge.h / 2,
            },
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

    test('afterDraw clears stale hover state when the control is disabled', () => {
        const chart = makeChart({
            spec: { position: 'stack', mapping: { fill: 'status' } },
        });
        const boxes = getIconBoxes(chart);
        const dodge = boxes.find((b) => b.value === 'dodge');

        plugin.afterDraw(chart);

        // Hover an icon so hoveredValue is set.
        plugin.afterEvent(chart, {
            event: {
                type: 'mousemove',
                x: dodge.x + dodge.w / 2,
                y: dodge.y + dodge.h / 2,
            },
        });

        // Disable the control without moving the mouse (e.g. interactive
        // toggled off or fill mapping removed via updateSpec).
        chart.data._spec_.interactive = false;
        plugin.afterDraw(chart);

        // Re-enable and redraw; the stale tooltip must not reappear.
        chart.data._spec_.interactive = true;
        const fillTextSpy = jest.spyOn(chart.ctx, 'fillText');
        plugin.afterDraw(chart);
        expect(fillTextSpy).not.toHaveBeenCalledWith(
            'Side-by-Side Bars',
            expect.any(Number),
            expect.any(Number)
        );
        fillTextSpy.mockRestore();
    });

    test('beforeDestroy removes the canvas mousemove listener', () => {
        const chart = makeChart({
            spec: { position: 'stack', mapping: { fill: 'status' } },
        });

        // Install the handler by calling afterDraw.
        plugin.afterDraw(chart);
        expect(chart.canvas._positionToggleHandler).toBeDefined();

        // Add removeEventListener mock to canvas
        const removeSpy = jest.fn();
        chart.canvas.removeEventListener = removeSpy;

        plugin.beforeDestroy(chart);

        expect(removeSpy).toHaveBeenCalledWith(
            'mousemove',
            expect.any(Function)
        );
        expect(chart.canvas._positionToggleHandler).toBeUndefined();
        expect(chart.canvas._positionTogglePointer).toBeUndefined();
    });
});
