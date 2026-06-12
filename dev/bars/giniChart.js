fetch('data/WB_WDI_SI_POV_GINI_WIDEF.csv')
    .then((response) => response.text())
    .then((text) => {
        const raw = d3.csvParse(text);

        // Detect year columns (numeric column names 1963–2025).
        const allCols = Object.keys(raw[0]);
        const yearCols = allCols.filter((col) => /^\d{4}$/.test(col));

        // Find years that have at least one non-empty value.
        const availableYears = yearCols.filter((year) =>
            raw.some((row) => row[year] !== '')
        );

        // Populate year select control.
        const yearSelect = document.getElementById('gini-year');
        availableYears.forEach((year) => {
            const opt = document.createElement('option');
            opt.value = year;
            opt.textContent = year;
            yearSelect.appendChild(opt);
        });

        // Default to the most recent available year.
        yearSelect.value = availableYears[availableYears.length - 1];

        const container = document.getElementById('gini-container');
        let instance = null;

        function getDataForYear(year) {
            return raw
                .filter((row) => row[year] !== '')
                .map((row) => ({
                    country: row['REF_AREA_LABEL'],
                    gini: row[year],
                }))
                .sort((a, b) => Number(b.gini) - Number(a.gini));
        }

        const RDYLBU_5 = [
            '#2c7bb6',
            '#abd9e9',
            '#ffffbf',
            '#fdae61',
            '#d7191c',
        ];
        const GINI_REFERENCE_LINES = [30, 35, 40, 45, 50].map((value, i) => ({
            value,
            label: String(value),
            color: RDYLBU_5[i],
            lineDash: [4, 4],
        }));

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
            year,
            data,
            orientation,
            position,
            dynamicSizing,
            annotationsMode,
            nCategories
        ) {
            const countryOrder = data.map((d) => d.country);

            return {
                mapping: {
                    x: 'country',
                    y: 'gini',
                },
                orientation,
                position,
                nCategories,
                scales: {
                    x: {
                        label: 'Country',
                        order: countryOrder,
                        sort: 'total',
                    },
                    y: {
                        label: 'Gini Index (0–100)',
                    },
                },
                labels: {
                    title: `Gini Index by Country (${year})`,
                    captions: `Includes ${data.length} ${
                        data.length === 1 ? 'country' : 'countries'
                    } with data available.`,
                },
                theme: {
                    dynamicSizing,
                },
                annotations: {
                    ...buildAnnotations(annotationsMode),
                    referenceLines: GINI_REFERENCE_LINES,
                },
            };
        }

        function render() {
            const year = getValue('gini-year');
            const data = getDataForYear(year);
            const spec = buildSpec(
                year,
                data,
                getValue('gini-orientation'),
                getValue('gini-position'),
                getDynamicSizing('gini-dynamic-sizing'),
                getValue('gini-annotations'),
                getNCategories('gini-n-categories')
            );
            if (instance) instance.destroy();
            instance = gsmViz.default.bars(container, data, spec);
        }

        render();

        document
            .getElementById('gini-export-btn')
            .addEventListener('click', () =>
                instance.helpers.exportImage(instance, 'gini-index.png')
            );
        onAnyChange(
            [
                'gini-year',
                'gini-orientation',
                'gini-position',
                'gini-dynamic-sizing',
                'gini-annotations',
                'gini-n-categories',
            ],
            render
        );
    });
