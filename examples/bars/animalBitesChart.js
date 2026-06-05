fetch('data/Health_AnimalBites.csv')
    .then((response) => response.text())
    .then((text) => {
        const data = d3.csvParse(text);

        const container = document.getElementById('bites-container');

        function buildSpec(orientation, position, dynamicSizing) {
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
                theme: {
                    dynamicSizing,
                },
            };
        }

        let instance = gsmViz.default.bars(
            container,
            data,
            buildSpec(
                getValue('bites-orientation'),
                getValue('bites-position'),
                getDynamicSizing('bites-dynamic-sizing')
            )
        );

        function rerender() {
            instance.destroy();
            instance = gsmViz.default.bars(
                container,
                data,
                buildSpec(
                    getValue('bites-orientation'),
                    getValue('bites-position'),
                    getDynamicSizing('bites-dynamic-sizing')
                )
            );
        }

        onAnyChange(
            ['bites-orientation', 'bites-position', 'bites-dynamic-sizing'],
            rerender
        );
    });
