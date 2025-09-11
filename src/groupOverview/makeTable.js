import { select } from 'd3';

import addHeaderRow from './makeTable/addHeaderRow.js';
import addBodyRows from './makeTable/addBodyRows.js';
import addCells from './makeTable/addCells.js';
import addSorting from './makeTable/addSorting.js';

import addFlagIcons from './makeTable/addFlagIcons.js';
import addRowHighlighting from './makeTable/addRowHighlighting.js';
import addClickEvents from './makeTable/addClickEvents.js';
import addCustomTooltip from './makeTable/addCustomTooltip.js';

export default function makeTable(_element_, rows, columns, config) {
    // create table
    const table = select(_element_)
        .append('table')
        .datum({
            config,
            rows,
            columns,
        })
        .classed('group-overview', true);

    const thead = table.append('thead');
    const tbody = table.append('tbody');
    const headerRow = addHeaderRow(thead, columns);
    const bodyRows = addBodyRows(tbody, rows);
    const cells = addCells(bodyRows);

    // add column sorting
    addSorting(headerRow, tbody, columns);

    // add directional arrows to Metric cells
    addFlagIcons(bodyRows);

    // add row highlighting
    addRowHighlighting(bodyRows);

    // add click events
    addClickEvents(bodyRows, cells, config);

    // add custom tooltips for interactive content (e.g., clickable links)
    addCustomTooltip(cells);

    return table;
}
