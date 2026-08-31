// Add event listener to x-axis type toggle.
const xAxisType = function (setup = false) {
    const xAxisToggle = document.querySelector('#x-axis-type');

    if (setup)
        xAxisToggle.addEventListener('change', (event) => {
            const instance = getChart();
            instance.data.config.xType = event.target.value;
            instance.helpers.updateConfig(instance, instance.data.config);
        });

    return xAxisToggle.querySelector('input:checked').value;
};
