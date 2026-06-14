// Add event listener to highlight individual groups.
const group = function (datasets, setup = false) {
    let instance = getChart();
    const groupDropdown = document.querySelector('#group');
    const countryDropdown = document.querySelector('#country');

    if (setup) {
        const groupIDs = [
            ...new Set(
                datasets[0]
                    .filter(
                        (d) =>
                            d.MetricID ===
                            document.querySelector('#metric').value
                    )
                    .map((d) => d.GroupID)
            ),
        ].sort(d3.ascending);

        // Add options to dropdown.
        d3.select(groupDropdown)
            .selectAll('option')
            .data(['None', ...groupIDs], (d) => d)
            .join('option')
            .attr('value', (d) => d)
            .text((d) => d);

        // Set initial value.
        groupDropdown.value = instance.data.config.selectedGroupIDs.length
            ? instance.data.config.selectedGroupIDs[0]
            : 'None';

        groupDropdown.addEventListener('change', (event) => {
            countryDropdown.value = 'None'; // reset country dropdown
            instance = getChart();
            instance.data.config.selectedGroupIDs = event.target.value;
            instance.data.config.xType = xAxisType();
            instance.helpers.updateConfig(instance, instance.data.config);

            // Dispatch [ riskSignalSelected ] event.
            instance.canvas.dispatchEvent(instance.canvas.riskSignalSelected);
        });
    }

    return groupDropdown.value;
};
