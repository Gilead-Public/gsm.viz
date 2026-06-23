import nCategoriesToggle from '../../src/bars/getPlugins/nCategoriesToggle.js';

/**
 * Build a minimal mock Chart.js instance for the nCategoriesToggle plugin.
 *
 * The plugin reads chart.data._spec_, chart.options.plugins.subtitle,
 * chart.chartArea, chart.height/width, chart.canvas and chart.helpers.
 */
function makeChart({
    spec = {},
    chartArea = { top: 0, bottom: 100, left: 0, right: 200 },
    height = 130,
    width = 200,
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
        options: { plugins: { subtitle: { display: true } } },
        chartArea,
        height,
        width,
        canvas,
        helpers: { updateSpec },
        _listeners: listeners,
        _updateSpec: updateSpec,
    };
}

describe('bars/nCategoriesToggle', () => {
    const plugin = nCategoriesToggle();

    function clickAt(chart, x, y) {
        plugin.afterEvent(chart, { event: { type: 'click', x, y } });
    }

    test('click in subtitle band while limited toggles to show all', () => {
        const chart = makeChart({ spec: { nCategories: 5 } });
        clickAt(chart, 100, 115); // between chartArea.bottom (100) and height (130)

        expect(chart._updateSpec).toHaveBeenCalledWith(chart, {
            nCategories: undefined,
        });
        // Original N is preserved for the return trip.
        expect(chart.data._spec_._originalNCategories).toBe(5);
    });

    test('click in subtitle band while showing all restores original N', () => {
        const chart = makeChart({
            spec: { nCategories: undefined, _originalNCategories: 7 },
        });
        clickAt(chart, 100, 115);

        expect(chart._updateSpec).toHaveBeenCalledWith(chart, {
            nCategories: 7,
        });
    });

    test('click outside the subtitle band is a no-op', () => {
        const chart = makeChart({ spec: { nCategories: 5 } });
        clickAt(chart, 100, 50); // inside chart area, above subtitle

        expect(chart._updateSpec).not.toHaveBeenCalled();
    });

    test('non-click events are ignored', () => {
        const chart = makeChart({ spec: { nCategories: 5 } });
        plugin.afterEvent(chart, { event: { type: 'mousemove', x: 100, y: 115 } });

        expect(chart._updateSpec).not.toHaveBeenCalled();
    });

    test('interactive:false disables the toggle', () => {
        const chart = makeChart({ spec: { nCategories: 5, interactive: false } });
        clickAt(chart, 100, 115);

        expect(chart._updateSpec).not.toHaveBeenCalled();
    });

    test('no original N (no nCategories, no _originalNCategories) is a no-op', () => {
        const chart = makeChart({ spec: {} });
        clickAt(chart, 100, 115);

        expect(chart._updateSpec).not.toHaveBeenCalled();
    });

    test('mousemove handler reads live chartArea after a resize mutates it', () => {
        const chart = makeChart({ spec: { nCategories: 5 } });
        plugin.afterDraw(chart);

        const handler = chart._listeners.mousemove;
        expect(typeof handler).toBe('function');

        // Initially the subtitle band is 100..130, so y=50 is outside it.
        handler({ clientY: 50 });
        expect(chart.canvas.style.cursor).toBe('');

        // Simulate a resize: Chart.js replaces chart.chartArea so the band
        // becomes 40..130. y=50 is now inside it — only a handler that reads
        // chart.chartArea live (not a reference captured at draw time) will
        // report a pointer.
        chart.chartArea = { top: 0, bottom: 40, left: 0, right: 200 };
        handler({ clientY: 50 });
        expect(chart.canvas.style.cursor).toBe('pointer');
    });
});
