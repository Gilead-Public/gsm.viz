fetch('data/Health_AnimalBites.csv')
    .then((response) => response.text())
    .then((text) => {
        const data = d3.csvParse(text);

        const orientationSelect = document.getElementById('bites-orientation');
        const positionSelect = document.getElementById('bites-position');
        const container = document.getElementById('bites-container');

        function buildSpec(orientation, position) {
            return {
                mapping: {
                    x: 'SpeciesIDDesc',
                    fill: 'WhereBittenIDDesc',
                },
                orientation,
                position,
                scales: {
                    x: { label: 'Species' },
                    //y: { label: 'Bite Count' },
                    fill: { label: 'Where Bitten' },
                },
                labels: {
                    title: 'Animal Bites by Species and Location',
                },
            };
        }

        let instance = gsmViz.default.bars(
            container,
            data,
            buildSpec(orientationSelect.value, positionSelect.value)
        );

        function rerender() {
            instance.destroy();
            instance = gsmViz.default.bars(
                container,
                data,
                buildSpec(orientationSelect.value, positionSelect.value)
            );
        }

        orientationSelect.addEventListener('change', rerender);
        positionSelect.addEventListener('change', rerender);
    });
