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
        // analysis results
        const results = filterOnMetricID(datasets[0], metric());

        // chart configuration
        const config = selectMetricID(datasets[1], metric());
        config.y = yAxis();
        config.selectedGroupIDs = group();

        // Threshold annotations
        const thresholds =
            config.y === 'Score' && document.getElementById('threshold').checked
                ? config.Thresholds.split(',').map((d) => +d)
                : null;

        // group metadata
        const groupMetadata = datasets[2];

        instance = gsmViz.default.barChart(
            document.getElementById('container'),
            results,
            config,
            thresholds,
            groupMetadata
        );

        lifecycleButton.innerHTML = '<strong>KILL</strong>';
        lifecycleButton.onclick = destroy.bind(instance);
    };
};
