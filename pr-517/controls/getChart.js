const getChart = function (id = 'container') {
    const chart = document
        .querySelector(`#${id}`)
        .querySelector('canvas').chart;

    return chart;
};
