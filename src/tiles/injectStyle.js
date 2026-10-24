const STYLE_ID = 'gsm-viz-tiles-style';

const CSS = `
.gsm-tiles { font-family: sans-serif; color: #333; }
.gsm-tiles-title { font-size: 1.3em; font-weight: 600; margin-bottom: 2px; }
.gsm-tiles-subtitle { color: #666; margin-bottom: 6px; }
.gsm-tiles-legend { display: flex; flex-wrap: wrap; gap: 4px 16px; margin: 4px 0 8px; }
.gsm-tiles-legend-group { display: flex; flex-wrap: wrap; align-items: center; gap: 4px 10px; }
.gsm-tiles-legend-title { font-weight: 600; }
.gsm-tiles-legend-item { display: inline-flex; align-items: center; gap: 4px; }
.gsm-tiles-swatch { display: inline-block; width: 12px; height: 12px; border: 1px solid #bbb; }
.gsm-tiles-x-label { font-weight: 600; margin-bottom: 2px; }
.gsm-tiles-scroll { overflow: auto; position: relative; width: fit-content; max-width: 100%; }
.gsm-tiles-table { border-collapse: separate; border-spacing: 0; table-layout: fixed; }
.gsm-tiles-table th, .gsm-tiles-table td { box-sizing: border-box; padding: 2px 4px; overflow: hidden; border-right: 1px solid #fff; border-bottom: 1px solid #fff; }
.gsm-tiles-table thead th { position: sticky; top: 0; z-index: 2; background: #fff; border-bottom: 1px solid #ccc; font-weight: 600; white-space: nowrap; text-overflow: ellipsis; text-align: center; }
.gsm-tiles-corner, .gsm-tiles-row-header { position: sticky; left: 0; background: #fff; text-align: left; white-space: nowrap; text-overflow: ellipsis; }
.gsm-tiles-table thead th.gsm-tiles-corner { z-index: 3; text-align: left; }
.gsm-tiles-row-header { z-index: 1; font-weight: normal; cursor: pointer; border-right: 1px solid #ccc; }
.gsm-tiles-cell { text-align: center; white-space: pre-line; line-height: 1.2; cursor: pointer; }
.gsm-tiles-missing { cursor: default; }
.gsm-tiles-detail { font-size: 0.9em; }
.gsm-tiles-toggle { cursor: pointer; }
.gsm-tiles-toggle:hover, .gsm-tiles-row-header:hover { background: #f0f4fa; }
.gsm-tiles-toggle:focus-visible, .gsm-tiles-row-header:focus-visible { outline: 2px solid #0969da; outline-offset: -2px; }
.gsm-tiles-table tr.gsm-tiles-selected > th { background: #fff3c4; font-weight: 600; }
.gsm-tiles-table tr.gsm-tiles-selected > td { box-shadow: inset 0 2px 0 #333, inset 0 -2px 0 #333; }
.gsm-tiles-pager { display: flex; align-items: center; gap: 8px; margin-top: 6px; }
`;

/**
 * Add the tiles stylesheet to a document once.
 *
 * @param {Document} doc
 */
export default function injectStyle(doc) {
    if (doc.getElementById(STYLE_ID)) return;
    const style = doc.createElement('style');
    style.id = STYLE_ID;
    style.textContent = CSS;
    (doc.head ?? doc.documentElement).appendChild(style);
}
