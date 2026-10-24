// Add event listener to chart lifecycle button.
const lifecycle = function (datasets, setup = false) {
    let instance = getChart();
    const lifecycleButton = document.getElementById('lifecycle');

    // Destroy chart:
    // 1. calls chart.destroy
    // 2. click event updates to create
    // 3. button text changes to Create
    const destroy = function () {
        this.destroy();
        lifecycleButton.innerHTML = '<em>Create</em>';
        lifecycleButton.onclick = create;
    };
    lifecycleButton.onclick = destroy.bind(instance);

    // Create chart:
    // 1. calls gsmViz.default.scatterPlot
    // 2. click event updates to destroy
    // 3. button text changes to KILL
    const create = () => {
        const config = datasets[1].find((d) => d.MetricID === metric());

        const results = datasets[0].filter(
            (d) => d.MetricID === config.MetricID
        );

        const bounds = datasets[2].filter(
            (d) => d.MetricID === config.MetricID
        );
        config.displayTitle = instance.data.config.displayTitle;
        config.xType = xAxisType();
        config.selectedGroupIDs = [group()];

        instance = gsmViz.default.scatterPlot(
            document.getElementById('container'),
            results,
            config,
            bounds,
            datasets[3]
        );

        lifecycleButton.innerHTML = '<strong>KILL</strong>';
        lifecycleButton.onclick = destroy.bind(instance);
    };
};
