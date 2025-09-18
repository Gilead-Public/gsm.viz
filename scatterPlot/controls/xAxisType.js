// Add event listener to x-axis type toggle.
const xAxisType = function (setup = false) {
    const xAxisToggle = document.querySelector('#x-axis-type');

    if (setup)
        xAxisToggle.addEventListener('change', (event) => {
            const instance = getChart();
            instance.helpers.updateOption(
                instance,
                'scales.x.type',
                event.target.value
            );
            instance.helpers.updateOption(
                instance,
                'scales.x.title.text',
                event.target.value === 'logarithmic'
                    ? `${instance.data.config.xLabel} (Log Scale)`
                    : instance.data.config.xLabel
            );
        });

    return xAxisToggle.querySelector('input:checked').value;
};
