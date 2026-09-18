const getCharts = function (id = 'container') {
    const canvases = document
        .querySelector(`#${id}`)
        .getElementsByTagName('canvas');
    const charts = [...canvases].map((element) => element.chart);

    return charts;
};
