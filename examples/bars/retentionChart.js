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

        function buildSegmentOverrides(barLabelMode) {
            if (barLabelMode === 'count') return { value: 'raw' };
            if (barLabelMode === 'percent') return { value: 'percent' };
            if (barLabelMode === 'fill') return { formatter: '{fill}' };
            if (barLabelMode === 'category') return { formatter: '{category}' };
            if (barLabelMode === 'custom')
                return { formatter: '{fill}: {value} ({percent})' };
            return null;
        }

        function buildAnnotations(mode, barLabelMode) {
            const overrides = buildSegmentOverrides(barLabelMode);
            const segmentLabel = overrides
                ? { display: true, ...overrides }
                : null;

            if (mode === 'none') {
                return segmentLabel ? { labels: { segment: segmentLabel } } : {};
            }
            if (mode === 'total-outside')
                return {
                    labels: {
                        total: { display: true, placement: 'outside' },
                        ...(segmentLabel ? { segment: segmentLabel } : {}),
                    },
                };
            if (mode === 'total-inside')
                return {
                    labels: {
                        total: { display: true, placement: 'inside' },
                        ...(segmentLabel ? { segment: segmentLabel } : {}),
                    },
                };
            if (mode === 'segment-outside')
                return {
                    labels: {
                        segment: {
                            display: true,
                            placement: 'end',
                            ...overrides,
                        },
                    },
                };
            if (mode === 'segment-inside')
                return {
                    labels: {
                        segment: {
                            display: true,
                            placement: 'center',
                            ...overrides,
                        },
                    },
                };
            return {};
        }

        function buildSpec(
            orientation,
            position,
            dynamicSizing,
            dynamicCategoryAxis,
            annotationsMode,
            nCategories,
            barLabelMode
        ) {
            return {
                mapping: {
                    x: 'invid',
                    fill: 'Reason',
                },
                orientation,
                position,
                nCategories,
                scales: {
                    x: { label: 'Site ID', sort: 'total' },
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
                annotations: buildAnnotations(annotationsMode, barLabelMode),
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
                getValue('retention-annotations'),
                getNCategories('retention-n-categories'),
                getValue('retention-bar-label')
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
                    getValue('retention-annotations'),
                    getNCategories('retention-n-categories'),
                    getValue('retention-bar-label')
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
                'retention-n-categories',
                'retention-bar-label',
            ],
            rerender
        );
    });
