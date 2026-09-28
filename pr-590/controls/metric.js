// Add event listener to KRI dropdown.
const kri = function (workflowID, datasets, setup = false) {
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

        kriDropdown.value = workflowID;
        kriDropdown.addEventListener('change', (event) => {
            const results = filterOnWorkflowID(datasets[0], event.target.value);
            const workflow = selectWorkflowID(datasets[1], event.target.value);
            const bounds = filterOnWorkflowID(datasets[2], event.target.value);

            workflow.selectedGroupIDs = [site()];

            if (instance.data.datasets[0].type === 'scatter')
                workflow.xType = xAxisType();

            instance.helpers.updateData(
                instance,
                results,
                workflow,
                bounds,
                datasets[3]
            );
        });
    }

    return kriDropdown.value;
};
