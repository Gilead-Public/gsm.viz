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

        function buildAnnotations(mode) {
            if (mode === 'none') return {};
            return { labels: { [mode]: { display: true } } };
        }

        function buildSpec(year, data, orientation, position, dynamicSizing, annotationsMode) {
            const countryOrder = data.map((d) => d.country);

            return {
                mapping: {
                    x: 'country',
                    y: 'gini',
                },
                orientation,
                position,
                scales: {
                    x: {
                        label: 'Country',
                        order: countryOrder,
                    },
                    y: {
                        label: 'Gini Index (0–100)',
                    },
                },
                labels: {
                    title: `Gini Index by Country (${year})`,
                },
                theme: {
                    dynamicSizing,
                },
                annotations: buildAnnotations(annotationsMode),
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
                getValue('gini-annotations')
            );
            if (instance) instance.destroy();
            instance = gsmViz.default.bars(container, data, spec);
        }

        render();
        onAnyChange(
            [
                'gini-year',
                'gini-orientation',
                'gini-position',
                'gini-dynamic-sizing',
                'gini-annotations',
            ],
            render
        );
    });
