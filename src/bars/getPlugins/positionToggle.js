/**
 * Chart.js plugin that embeds a `position` control above the chart area.
 *
 * For bars instances with a fill mapping, three icon-styled buttons are drawn
 * in the title row (right-aligned), each toggling the `position` setting
 * between 'stack', 'dodge', and 'fill'. The active position is highlighted.
 * Hovering an icon shows a tooltip label. The control is disabled when
 * interactive === false or when no fill mapping is specified.
 */

export const POSITIONS = ['stack', 'dodge', 'fill'];

export const TOOLTIP_LABELS = {
    stack: 'Stacked Bars',
    dodge: 'Side-by-Side Bars',
    fill: 'Stacked, Scaled Bars',
};

const BUTTON = 18;
const GAP = 4;
const INSET = 6;

/**
 * Compute the icon button hit-boxes positioned at the title level.
 *
 * @param {Object} chart - Chart.js chart instance
 * @returns {Array<{value:string,x:number,y:number,w:number,h:number}>}
 */
export function getIconBoxes(chart) {
    const { chartArea, titleBlock, width } = chart;
    const total = POSITIONS.length * BUTTON + (POSITIONS.length - 1) * GAP;
    const startX = (width || chartArea.right) - INSET - total;

    let y;
    if (titleBlock && titleBlock.height > 0) {
        y = Math.round((titleBlock.top + titleBlock.bottom) / 2 - BUTTON / 2);
    } else {
        y = chartArea.top - BUTTON - INSET;
    }

    return POSITIONS.map((value, i) => ({
        value,
        x: startX + i * (BUTTON + GAP),
        y,
        w: BUTTON,
        h: BUTTON,
    }));
}

function enabledSpec(chart) {
    const spec = chart.data?._spec_;
    if (!spec || spec.interactive === false) return null;
    if (!spec.mapping?.fill) return null;
    if (!chart.chartArea) return null;
    return spec;
}

function hitBox(boxes, x, y) {
    return boxes.find(
        (b) => x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h
    );
}

function bar(ctx, x, bottom, w, h, color) {
    ctx.fillStyle = color;
    ctx.fillRect(x, bottom - h, w, h);
}

function drawGlyph(ctx, box, color) {
    const p = 4;
    const x0 = box.x + p;
    const y0 = box.y + p;
    const iw = box.w - 2 * p;
    const ih = box.h - 2 * p;
    const bottom = y0 + ih;
    const light =
        color === '#4e79a7'
            ? 'rgba(78,121,167,0.45)'
            : 'rgba(158,158,158,0.45)';

    if (box.value === 'stack') {
        const w = Math.round(iw * 0.55);
        const x = x0 + (iw - w) / 2;
        const seg = (ih * 0.75) / 3;
        bar(ctx, x, bottom, w, seg, color);
        bar(ctx, x, bottom - seg, w, seg, light);
        bar(ctx, x, bottom - 2 * seg, w, seg, color);
    } else if (box.value === 'dodge') {
        const w = Math.round(iw * 0.22);
        const gap = (iw - 3 * w) / 2;
        const heights = [ih * 0.5, ih * 0.9, ih * 0.65];
        [color, light, color].forEach((c, i) => {
            bar(ctx, x0 + i * (w + gap), bottom, w, heights[i], c);
        });
    } else if (box.value === 'fill') {
        const w = Math.round(iw * 0.4);
        const gap = iw - 2 * w;
        const splits = [0.6, 0.4];
        splits.forEach((split, i) => {
            const x = x0 + i * (w + gap);
            bar(ctx, x, bottom, w, ih * split, color);
            bar(ctx, x, bottom - ih * split, w, ih * (1 - split), light);
        });
    }
}

function drawIcons(ctx, boxes, active) {
    ctx.save();
    boxes.forEach((box) => {
        const isActive = box.value === active;

        ctx.fillStyle = isActive
            ? 'rgba(78,121,167,0.15)'
            : 'rgba(255,255,255,0.85)';
        ctx.fillRect(box.x, box.y, box.w, box.h);
        ctx.lineWidth = 1;
        ctx.strokeStyle = isActive ? '#4e79a7' : '#cccccc';
        ctx.strokeRect(box.x + 0.5, box.y + 0.5, box.w - 1, box.h - 1);

        drawGlyph(ctx, box, isActive ? '#4e79a7' : '#9e9e9e');
    });
    ctx.restore();
}

function drawTooltip(ctx, box) {
    const label = TOOLTIP_LABELS[box.value];
    if (!label) return;

    ctx.save();
    ctx.font = '11px sans-serif';
    const metrics = ctx.measureText(label);
    const pw = 5;
    const ph = 3;
    const tw = metrics.width + pw * 2;
    const th = 16 + ph * 2;
    const tx = box.x + box.w - tw;
    const ty = box.y + box.h + 4;

    ctx.fillStyle = 'rgba(50,50,50,0.9)';
    ctx.fillRect(tx, ty, tw, th);

    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(label, tx + tw / 2, ty + th / 2);
    ctx.restore();
}

export default function positionToggle() {
    let hoveredValue = null;

    return {
        id: 'positionToggle',

        afterEvent(chart, args) {
            if (args.event.type === 'mousemove') {
                const spec = enabledSpec(chart);
                if (!spec) return;
                const boxes = getIconBoxes(chart);
                const hit = hitBox(boxes, args.event.x, args.event.y);
                const prev = hoveredValue;
                hoveredValue = hit ? hit.value : null;
                if (hoveredValue !== prev) chart.draw();
                return;
            }

            if (args.event.type !== 'click') return;

            const spec = enabledSpec(chart);
            if (!spec) return;

            const { x, y } = args.event;
            const hit = hitBox(getIconBoxes(chart), x, y);
            if (!hit || hit.value === spec.position) return;

            chart.helpers.updateSpec(chart, { position: hit.value });
        },

        afterDraw(chart) {
            const spec = enabledSpec(chart);
            if (!spec) return;

            const boxes = getIconBoxes(chart);
            if (chart.ctx) {
                drawIcons(chart.ctx, boxes, spec.position);

                if (hoveredValue) {
                    const hoveredBox = boxes.find(
                        (b) => b.value === hoveredValue
                    );
                    if (hoveredBox) drawTooltip(chart.ctx, hoveredBox);
                }
            }

            const canvas = chart.canvas;
            if (!canvas || canvas._positionToggleHandler) return;

            const handler = (e) => {
                const area = chart.chartArea;
                if (!area || !enabledSpec(chart)) return;
                const rect = canvas.getBoundingClientRect();
                const mx = e.clientX - rect.left;
                const my = e.clientY - rect.top;
                const over = !!hitBox(getIconBoxes(chart), mx, my);

                if (over) {
                    canvas.style.cursor = 'pointer';
                    canvas._positionTogglePointer = true;
                } else if (canvas._positionTogglePointer) {
                    canvas.style.cursor = '';
                    canvas._positionTogglePointer = false;
                }
            };

            canvas._positionToggleHandler = handler;
            canvas.addEventListener('mousemove', handler);
        },
    };
}
