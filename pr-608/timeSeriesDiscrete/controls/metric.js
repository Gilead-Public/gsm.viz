// Add event listener to KRI dropdown.
const kri = function (workflow, datasets, setup = false) {
    const instance = getChart();
    const kriDropdown = document.querySelector('#kri');

    if (setup === true) {
        const kris = [...new Set(datasets[0].map((d) => d.MetricID)).values()];

        for (const i in kris) {
            const option = document.createElement('option');
            option.value = kris[i];
            option.innerHTML = kris[i];
            kriDropdown.appendChild(option);
        }

        kriDropdown.value = workflow.MetricID;
        kriDropdown.addEventListener('change', (event) => {
            const workflow = datasets[1].find(
                (d) => d.MetricID === event.target.value
            );
            workflow.y = 'n_at_risk_or_flagged';
            workflow.selectedGroupIDs = [site()];
            const results = datasets[0].filter(
                (d) => d.MetricID === workflow.MetricID
            );

            instance.helpers.updateData(instance, results, workflow);
        });
    }

    return kriDropdown.value;
};
