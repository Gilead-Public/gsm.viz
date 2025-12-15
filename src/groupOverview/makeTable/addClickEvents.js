import resultsSchema from '../../data/schema/results.json';
/**
 * Add click events to the cells of the table.
 *
 * @param {object} bodyRows - The rows of the table body.
 * @param {object} cells - The cells of the table.
 * @param {object} _config_ - The configuration object.
 *
 * @returns {void}
 */
export default function addClickEvents(bodyRows, cells, config) {
    // Add custom event listener that bubbles and returns only the key data associated with a risk
    // signal.
    const riskSignalSelected = new CustomEvent('riskSignalSelected', {
        bubbles: true,
    });

    // add click event to Metric cells
    cells.filter('.group-overview--metric').on('click', function (event, d) {
        config.metricClickCallback({
            GroupLevel: config.GroupLevel,
            GroupID: d.GroupID,
            MetricID: d.MetricID,
            data: d,
        });

        // Trigger custom [ riskSignalSelected ] event.
        riskSignalSelected.data = resultsSchema.items.required.reduce(
            (acc, item) => {
                acc[item] = d[item];

                return acc;
            },
            {}
        );
        this.dispatchEvent(riskSignalSelected);
    });

    const groupSelected = new CustomEvent('groupSelected', {
        bubbles: true,
    });

    // add click event to group cells (excluding Risk Score cells)
    cells
        .filter('.group-overview--group')
        .filter((d) => d.column.valueKey !== 'siteRiskScore')
        .on('click', function (event, d) {
            config.groupClickCallback({
                GroupLevel: config.GroupLevel,
                GroupID: d.GroupID,
                data: d,
            });

            groupSelected.data = {
                //StudyID: d.StudyID,
                //SnapshotDate: d.SnapshotDate,
                GroupLevel: d.GroupLevel,
                GroupID: d.GroupID,
            };
            this.dispatchEvent(groupSelected);
        });
}
