import { select } from 'd3';

import deriveGroupMetrics from './deriveGroupMetrics.js';
import defineColumns from './defineColumns.js';
import structureData from './structureData.js';

import addBodyRows from './makeTable/addBodyRows.js';
import addCells from './makeTable/addCells.js';

import addFlagIcons from './makeTable/addFlagIcons.js';
import addRowHighlighting from './makeTable/addRowHighlighting.js';
import addClickEvents from './makeTable/addClickEvents.js';
import addCustomTooltip from './makeTable/addCustomTooltip.js';

export default function updateTable(_results_) {
    const groupMetadata = deriveGroupMetrics(
        this._groupMetadata_,
        _results_,
        this.config
    );
    const columns = defineColumns(
        groupMetadata,
        this._metricMetadata_,
        _results_,
        this.config
    );
    const rows = structureData(_results_, columns, groupMetadata, this.config);

    // create table
    const tbody = this.table.select('tbody');
    const bodyRows = addBodyRows(tbody, rows);
    const cells = addCells(bodyRows);

    // identify inactive groupMetadata
    //identifyInactivegroups(bodyRows);

    // add directional arrows to Metric cells
    addFlagIcons(bodyRows);

    // add row highlighting
    addRowHighlighting(bodyRows);

    // add click events
    addClickEvents(bodyRows, cells, this.config);

    // add custom tooltips for interactive content (e.g., clickable links)
    addCustomTooltip(cells);

    // preserve existing column sort
    const sortedColumn = this.columns.find((d) => d.activeSort);
    if (sortedColumn !== undefined) {
        sortedColumn.sortState = -sortedColumn.sortState;
        sortedColumn.sort(tbody.selectAll('tr'), sortedColumn);
    } else {
        tbody.selectAll('tr').sort((a, b) => {
            const redComparison = b[1].nRedFlags - a[1].nRedFlags;
            const amberComparison = b[1].nAmberFlags - a[1].nAmberFlags;
            const greenComparison = b[1].nGreenFlags - a[1].nGreenFlags;
            const groupComparison = a.key.localeCompare(b.key);

            return (
                redComparison ||
                amberComparison ||
                greenComparison ||
                groupComparison
            );
        });
    }
}
