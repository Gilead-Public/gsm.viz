/**
 * Chart.js plugin that makes the nCategories subtitle clickable.
 *
 * Clicking the subtitle area toggles between the limited (top N) view
 * and the full category set. The subtitle text updates to reflect the
 * current state.
 */
export default function nCategoriesToggle() {
    return {
        id: 'nCategoriesToggle',

        afterEvent(chart, args) {
            if (args.event.type !== 'click') return;

            const spec = chart.data._spec_;
            if (!spec || spec.interactive === false) return;

            const origN = spec._originalNCategories ?? spec.nCategories;
            if (!origN) return;

            const subtitle = chart.options.plugins.subtitle;
            if (!subtitle?.display) return;

            const { x, y } = args.event;
            const chartArea = chart.chartArea;
            if (!chartArea) return;

            const subtitleTop = chartArea.bottom;
            const subtitleBottom = chart.height;

            if (
                y < subtitleTop ||
                y > subtitleBottom ||
                x < 0 ||
                x > chart.width
            )
                return;

            const isShowingAll = !spec.nCategories;

            if (isShowingAll) {
                chart.helpers.updateSpec(chart, { nCategories: origN });
            } else {
                spec._originalNCategories = origN;
                chart.helpers.updateSpec(chart, { nCategories: undefined });
            }
        },

        afterDraw(chart) {
            const spec = chart.data._spec_;
            if (!spec || spec.interactive === false) return;

            const origN = spec._originalNCategories ?? spec.nCategories;
            if (!origN) return;

            const subtitle = chart.options.plugins.subtitle;
            if (!subtitle?.display) return;

            const canvas = chart.canvas;
            const chartArea = chart.chartArea;
            if (!chartArea) return;

            const handler = (e) => {
                const rect = canvas.getBoundingClientRect();
                const my = e.clientY - rect.top;
                const subtitleTop = chartArea.bottom;
                const subtitleBottom = chart.height;

                canvas.style.cursor =
                    my >= subtitleTop && my <= subtitleBottom
                        ? 'pointer'
                        : '';
            };

            if (!canvas._nCatToggleHandler) {
                canvas._nCatToggleHandler = handler;
                canvas.addEventListener('mousemove', handler);
            }
        },
    };
}
