fetch('data/eligibility.csv')
    .then((response) => response.text())
    .then((text) => {
        const data = d3
            .csvParse(text)
            .filter((d) => d.ietestcd_concat !== 'NA');

        const container = document.getElementById('ie-criteria-container');

        function buildAnnotations(mode) {
            if (mode === 'none') return {};
            if (mode === 'total-outside')
                return {
                    labels: {
                        total: { display: true, placement: 'outside' },
                    },
                };
            if (mode === 'total-inside')
                return {
                    labels: {
                        total: { display: true, placement: 'inside' },
                    },
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
            dynamicSizing,
            dynamicCategoryAxis,
            annotationsMode,
            nCategories,
            sort,
            xAxis,
            swapped
        ) {
            const categoryCol = swapped ? 'ietestcd_concat' : xAxis;
            const fillCol = swapped ? xAxis : 'ietestcd_concat';
            const categoryLabel = swapped ? 'Criteria' : 'Site';
            const fillLabel = swapped ? 'Site' : 'Criteria';
            const title = swapped
                ? 'Criteria by Site'
                : 'Site by Criteria';

            return {
                mapping: {
                    x: categoryCol,
                    fill: fillCol,
                },
                orientation,
                nCategories,
                scales: {
                    x: {
                        label: categoryLabel,
                        ...(sort === 'total'
                            ? { sort: 'total' }
                            : {}),
                    },
                    y: { label: 'Criteria Count' },
                    fill: {
                        label: fillLabel,
                    },
                },
                labels: {
                    title,
                },
                theme: {
                    dynamicSizing,
                    dynamicCategoryAxis,
                },
                annotations: buildAnnotations(annotationsMode),
            };
        }

        function getSwapped() {
            return document.getElementById('ie-criteria-swap').value === 'yes';
        }

        let instance = gsmViz.default.bars(
            container,
            data,
            buildSpec(
                getValue('ie-criteria-orientation'),
                getDynamicSizing('ie-criteria-dynamic-sizing'),
                getBoolean('ie-criteria-dynamic-category-axis'),
                getValue('ie-criteria-annotations'),
                getNCategories('ie-criteria-n-categories'),
                getValue('ie-criteria-sort'),
                getValue('ie-criteria-x-axis'),
                getSwapped()
            )
        );

        document
            .getElementById('ie-criteria-export-btn')
            .addEventListener('click', () =>
                instance.helpers.exportImage(
                    instance,
                    'ie-criteria-by-site.png'
                )
            );

        function rerender() {
            instance.destroy();
            container.style.height = '';
            container.style.width = '';
            instance = gsmViz.default.bars(
                container,
                data,
                buildSpec(
                    getValue('ie-criteria-orientation'),
                        getDynamicSizing('ie-criteria-dynamic-sizing'),
                    getBoolean('ie-criteria-dynamic-category-axis'),
                    getValue('ie-criteria-annotations'),
                    getNCategories('ie-criteria-n-categories'),
                    getValue('ie-criteria-sort'),
                    getValue('ie-criteria-x-axis'),
                    getSwapped()
                )
            );
        }

        onAnyChange(
            [
                'ie-criteria-orientation',
                'ie-criteria-dynamic-sizing',
                'ie-criteria-dynamic-category-axis',
                'ie-criteria-annotations',
                'ie-criteria-n-categories',
                'ie-criteria-sort',
                'ie-criteria-x-axis',
                'ie-criteria-swap',
            ],
            rerender
        );
    });
