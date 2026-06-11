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

        const container = document.getElementById('retention-container');

        function buildAnnotations(mode) {
            if (mode === 'none') return {};
            if (mode === 'total-outside')
                return {
                    labels: { total: { display: true, placement: 'outside' } },
                };
            if (mode === 'total-inside')
                return {
                    labels: { total: { display: true, placement: 'inside' } },
                };
            if (mode === 'segment-outside')
                return {
                    labels: {
                        segment: { display: true, placement: 'end' },
                    },
                };
            if (mode === 'segment-inside')
                return {
                    labels: {
                        segment: { display: true, placement: 'center' },
                    },
                };
            return {};
        }

        function buildSpec(
            orientation,
            position,
            dynamicSizing,
            dynamicCategoryAxis,
            annotationsMode
        ) {
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
                theme: {
                    dynamicSizing,
                    dynamicCategoryAxis,
                },
                annotations: buildAnnotations(annotationsMode),
                tooltip: {
                    format: 'count+percent',
                    callbacks: {
                        afterLabel: (context) => {
                            const rows = context.raw._datum;
                            if (!rows || !rows.length) return [];
                            return rows.map(
                                (d) =>
                                    `${d.subjid} (Last Known Date: ${d.last_known_date})`
                            );
                        },
                    },
                },
            };
        }

        let instance = gsmViz.default.bars(
            container,
            data,
            buildSpec(
                getValue('retention-orientation'),
                getValue('retention-position'),
                getDynamicSizing('retention-dynamic-sizing'),
                getBoolean('retention-dynamic-category-axis'),
                getValue('retention-annotations')
            )
        );

        document
            .getElementById('retention-export-btn')
            .addEventListener('click', () =>
                instance.helpers.exportImage(instance, 'retention-by-site.png')
            );

        function rerender() {
            instance.destroy();
            instance = gsmViz.default.bars(
                container,
                data,
                buildSpec(
                    getValue('retention-orientation'),
                    getValue('retention-position'),
                    getDynamicSizing('retention-dynamic-sizing'),
                    getBoolean('retention-dynamic-category-axis'),
                    getValue('retention-annotations')
                )
            );
        }

        onAnyChange(
            [
                'retention-orientation',
                'retention-position',
                'retention-dynamic-sizing',
                'retention-dynamic-category-axis',
                'retention-annotations',
            ],
            rerender
        );
    });
