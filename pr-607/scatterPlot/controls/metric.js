// Add event listener to metric dropdown.
const metric = function (datasets, setup = false, initialValue = null) {
    const metricDropdown = document.querySelector('#metric');
    const groupDropdown = document.querySelector('#group');

    if (setup === true) {
        const metrics = [
            ...new Set(datasets[0].map((d) => d.MetricID)).values(),
        ].sort((a, b) => {
            // sort kri then cou then qtl
            if (a.startsWith('kri') && b.startsWith('cou')) {
                return -1;
            }
            if (a.startsWith('cou') && b.startsWith('kri')) {
                return 1;
            }
            if (a.startsWith('kri') && b.startsWith('qtl')) {
                return -1;
            }
            if (a.startsWith('qtl') && b.startsWith('kri')) {
                return 1;
            }
            if (a.startsWith('cou') && b.startsWith('qtl')) {
                return -1;
            }
            if (a.startsWith('qtl') && b.startsWith('cou')) {
                return 1;
            }
            return a.localeCompare(b);
        });

        for (const i in metrics) {
            const option = document.createElement('option');
            option.value = metrics[i];
            option.innerHTML = metrics[i];
            metricDropdown.appendChild(option);
        }

        metricDropdown.value = initialValue;
        metricDropdown.addEventListener('change', (event) => {
            const instance = getChart();

            const results = filterOnMetricID(datasets[0], event.target.value);

            const groupIDs = [...new Set(results.map((d) => d.GroupID))].sort(
                d3.ascending
            );

            // Update options in dropdown.
            d3.select(groupDropdown)
                .selectAll('option')
                .data(['None', ...groupIDs], (d) => d)
                .join('option')
                .attr('value', (d) => d)
                .text((d) => d);

            const config = selectMetricID(datasets[1], event.target.value);
            config.displayTitle = instance.data.config.displayTitle;
            config.xType = xAxisType();
            config.selectedGroupIDs = [
                group(),
                ...datasets[3]
                    .filter(
                        (d) =>
                            d.GroupLevel === 'Site' &&
                            d.Param === 'Country' &&
                            d.Value === country()
                    )
                    .map((d) => d.GroupID),
            ];
            config.groupTooltipKeys = groupTooltipKeys[config.GroupLevel];

            const bounds = filterOnMetricID(datasets[2], event.target.value);

            instance.helpers.updateData(
                instance,
                results,
                config,
                bounds,
                datasets[3]
            );
        });
    }

    return metricDropdown.value;
};
