fetch('data/retention.csv')
    .then((response) => response.text())
    .then((text) => {
        const data = d3.csvParse(text);

        // Derive fill order dynamically from the Reason_order column.
        const reasonOrder = [
            ...new Map(data.map((d) => [d.Reason, +d.Reason_order])).entries(),
        ]
            .sort((a, b) => a[1] - b[1])
            .map(([reason]) => reason);

        const orientationSelect = document.getElementById('retention-orientation');
        const positionSelect = document.getElementById('retention-position');
        const container = document.getElementById('retention-container');

        function buildSpec(orientation, position) {
            return {
                mapping: {
                    x: 'invid',
                    fill: 'Reason',
                },
                orientation,
                position,
                scales: {
                    x: { label: 'Site ID' },
                    y: { label: 'Count' },
                    fill: {
                        label: 'Retention Status',
                        order: reasonOrder,
                    },
                },
                labels: {
                    title: 'Retention Status by Site',
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
