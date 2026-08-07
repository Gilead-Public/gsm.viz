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

        function buildAnnotations(mode, barLabelMode, avoidCategoryOverlap) {
            const overrides = buildSegmentOverrides(barLabelMode);
            const segmentLabel = overrides
                ? { display: true, avoidCategoryOverlap, ...overrides }
                : null;

            if (mode === 'none') {
                return segmentLabel
                    ? { labels: { segment: segmentLabel } }
                    : {};
            }
            if (mode === 'total-outside')
                return {
                    labels: {
                        total: {
                            display: true,
                            placement: 'outside',
                            avoidCategoryOverlap,
                        },
                        ...(segmentLabel ? { segment: segmentLabel } : {}),
                    },
                };
            if (mode === 'total-inside')
                return {
                    labels: {
                        total: {
                            display: true,
                            placement: 'inside',
                            avoidCategoryOverlap,
                        },
                        ...(segmentLabel ? { segment: segmentLabel } : {}),
                    },
                };
            if (mode === 'segment-outside')
                return {
                    labels: {
                        segment: {
                            display: true,
                            placement: 'end',
                            avoidCategoryOverlap,
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
                            avoidCategoryOverlap,
                            ...overrides,
                        },
                    },
                };
            return {};
        }

        function buildSpec(
            orientation,
            dynamicSizing,
            dynamicCategoryAxis,
            annotationsMode,
            nCategories,
            barLabelMode,
            avoidCategoryOverlap
        ) {
            return {
                mapping: {
                    x: 'invid',
                    fill: 'Reason',
                },
                orientation,
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
                selection: { enabled: true },
                callbacks: {
                    onSelect: (selection) => {
                        const select = document.getElementById(
                            'retention-select-category'
                        );
                        if (!select) return;
                        if (
                            selection.type === 'category' &&
                            selection.values.length === 1
                        ) {
                            select.value = selection.values[0];
                        } else {
                            select.value = '';
                        }
                    },
                },
                theme: {
                    dynamicSizing,
                    dynamicCategoryAxis,
                },
                annotations: buildAnnotations(
                    annotationsMode,
                    barLabelMode,
                    avoidCategoryOverlap
                ),
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
                getDynamicSizing('retention-dynamic-sizing'),
                getBoolean('retention-dynamic-category-axis'),
                getValue('retention-annotations'),
                getNCategories('retention-n-categories'),
                getValue('retention-bar-label'),
                getBoolean('retention-avoid-category-overlap')
            )
        );

        // Populate category dropdown
        const categories = [...new Set(data.map((d) => d.invid))];
        const categorySelect = document.getElementById(
            'retention-select-category'
        );
        categories.forEach((cat) => {
            const opt = document.createElement('option');
            opt.value = cat;
            opt.textContent = cat;
            categorySelect.appendChild(opt);
        });

        // Wire category selection — dropdown drives chart selection
        categorySelect.addEventListener('change', () => {
            const val = categorySelect.value;
            if (val) {
                instance.helpers.selectCategory(instance, val);
            } else {
                instance.helpers.clearSelection(instance);
            }
        });

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
                    getDynamicSizing('retention-dynamic-sizing'),
                    getBoolean('retention-dynamic-category-axis'),
                    getValue('retention-annotations'),
                    getNCategories('retention-n-categories'),
                    getValue('retention-bar-label'),
                    getBoolean('retention-avoid-category-overlap')
                )
            );
        }

        onAnyChange(
            [
                'retention-orientation',
                'retention-dynamic-sizing',
                'retention-dynamic-category-axis',
                'retention-annotations',
                'retention-n-categories',
                'retention-bar-label',
                'retention-avoid-category-overlap',
            ],
            rerender
        );
    });
