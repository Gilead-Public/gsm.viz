fetch('data/eligibility.csv')
    .then((response) => response.text())
    .then((text) => {
        const data = d3.csvParse(text);

        data.forEach((d) => {
            d.Eligibility =
                d.ie_violation === 'Y' ? 'Ineligible' : 'No Eligibility Risk';
        });

        const container = document.getElementById('eligibility-container');

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
            xAxis
        ) {
            return {
                mapping: {
                    x: xAxis,
                    fill: 'Eligibility',
                },
                orientation,
                nCategories,
                scales: {
                    x: {
                        label: 'Site',
                        ...(sort === 'total' ? { sort: 'total' } : {}),
                    },
                    y: { label: 'Participant Count' },
                    fill: {
                        label: 'Eligibility',
                        order: ['No Eligibility Risk', 'Ineligible'],
                    },
                },
                labels: {
                    title: 'Participant Count by Site',
                },
                theme: {
                    dynamicSizing,
                    dynamicCategoryAxis,
                },
                annotations: buildAnnotations(annotationsMode),
            };
        }

        let instance = gsmViz.default.bars(
            container,
            data,
            buildSpec(
                getValue('eligibility-orientation'),
                getDynamicSizing('eligibility-dynamic-sizing'),
                getBoolean('eligibility-dynamic-category-axis'),
                getValue('eligibility-annotations'),
                getNCategories('eligibility-n-categories'),
                getValue('eligibility-sort'),
                getValue('eligibility-x-axis')
            )
        );

        document
            .getElementById('eligibility-export-btn')
            .addEventListener('click', () =>
                instance.helpers.exportImage(
                    instance,
                    'eligibility-by-site.png'
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
                    getValue('eligibility-orientation'),
                    getDynamicSizing('eligibility-dynamic-sizing'),
                    getBoolean('eligibility-dynamic-category-axis'),
                    getValue('eligibility-annotations'),
                    getNCategories('eligibility-n-categories'),
                    getValue('eligibility-sort'),
                    getValue('eligibility-x-axis')
                )
            );
        }

        onAnyChange(
            [
                'eligibility-orientation',
                'eligibility-dynamic-sizing',
                'eligibility-dynamic-category-axis',
                'eligibility-annotations',
                'eligibility-n-categories',
                'eligibility-sort',
                'eligibility-x-axis',
            ],
            rerender
        );
    });
