// Add event listener to download button.
const download = function () {
    const controls = document.getElementById('controls');

    if (controls !== null) {
        const fieldset = document.createElement('fieldset');
        controls.appendChild(fieldset);

        const legend = document.createElement('legend');
        legend.innerHTML = 'Chart Download';
        fieldset.appendChild(legend);

        const downloadButton = document.createElement('button');
        downloadButton.innerHTML = 'Generate .png';
        downloadButton.id = 'download';
        fieldset.appendChild(downloadButton);

        downloadButton.onclick = () => {
            const instance = getChart();
            const a = document.createElement('a');
            a.href = instance.toBase64Image();
            a.download = `${instance.data.config.chartName
                .toLowerCase()
                .replace(/ /g, '-')}.png`;
            a.click();
            a.remove();
        };
    }
};
