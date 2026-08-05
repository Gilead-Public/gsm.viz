const addEventListener = function (eventType, element = document.body) {
    element.addEventListener(eventType, (event) => {
        console.log(event.data);
    });
};
