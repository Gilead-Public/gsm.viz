// Add event listener to highlight countries.
const country = function (datasets, setup = false) {
    let instance = getChart();
    const countryDropdown = document.querySelector('#country');
    const groupDropdown = document.querySelector('#group');

    if (setup) {
        const option = document.createElement('option');
        option.value = 'None';
        option.innerHTML = 'None';
        countryDropdown.appendChild(option);

        const countries = [
            ...new Set(
                datasets[3]
                    .filter(
                        (d) => d.GroupLevel === 'Site' && d.Param === 'Country'
                    )
                    .map((d) => d.Value)
            ),
        ].sort((a, b) => a - b);

        for (const i in countries) {
            const option = document.createElement('option');
            option.value = countries[i];
            option.innerHTML = countries[i];
            countryDropdown.appendChild(option);
        }

        countryDropdown.value = 'None';

        countryDropdown.addEventListener('change', (event) => {
            groupDropdown.value = 'None'; // reset group dropdown
            instance = getChart();
            instance.data.config.selectedGroupIDs = datasets[3]
                .filter(
                    (d) =>
                        d.GroupLevel === 'Site' &&
                        d.Param === 'Country' &&
                        d.Value === event.target.value
                )
                .map((d) => d.GroupID);
            instance.data.config.xType = xAxisType();
            instance.helpers.updateConfig(instance, instance.data.config);
        });
    }

    return countryDropdown.value;
};
