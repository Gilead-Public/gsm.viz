// Faceted version of the KRI scatter: one panel per MetricID using facetPoints.
(() => {
  const files = [
    "../data/results.csv",
    "../data/metricMetadata.csv",
    "../data/groupMetadata.csv",
  ];

  Promise.all(files.map((file) => fetch(file).then((r) => r.text())))
    .then((texts) => texts.map((text) => d3.csvParse(text)))
    .then(([allResults]) => {
      const snapshotDate = d3.max(allResults, (d) => d.SnapshotDate);
      const kriResults = toPointRows(
        allResults.filter(
          (d) => d.SnapshotDate === snapshotDate && d.MetricID.startsWith("kri")
        )
      );
      const metrics = sortMetricIDs([
        ...new Set(kriResults.map((d) => d.MetricID)),
      ]);

      const siteSelect = document.getElementById("kri-facet-site");
      const xTypeSelect = document.getElementById("kri-facet-x-type");
      const flagSelect = document.getElementById("kri-facet-flag-filter");
      const statusEl = document.getElementById("kri-facet-status");
      const container = document.getElementById("kri-facet-container");

      setOptions(siteSelect, [
        { value: "", label: "None" },
        ...[...new Set(kriResults.map((d) => d.GroupID))]
          .sort(d3.ascending)
          .map((id) => ({ value: id, label: id })),
      ]);

      let result = null;
      let selectedSite = "";

      function selectSite(site) {
        selectedSite = site;
        if (!result) return;
        if (!site) {
          result.charts[0]?.helpers.clearSelection(result.charts[0]);
          return;
        }
        const origin = result.charts.find((chart) =>
          chart.data.datasets.some((dataset) =>
            dataset.data.some((point) => point._key === site)
          )
        );
        if (origin) origin.helpers.selectPoint(origin, site);
      }

      function render() {
        const flags = Array.from(flagSelect.selectedOptions).map(
          (o) => o.value
        );
        const rows = kriResults.filter((d) => flags.includes(d.Flag));
        const isLog = xTypeSelect.value === "log";

        result = gsmViz.default.facetPoints(container, rows, {
          mapping: {
            x: "Denominator",
            y: "Numerator",
            key: "GroupID",
            color: "Flag",
          },
          scales: {
            x: {
              type: isLog ? "log" : "linear",
              label: isLog ? "Denominator (Log Scale)" : "Denominator",
            },
            y: { label: "Numerator", beginAtZero: true },
            color: {
              colors: FLAG_COLORS,
              order: FLAG_ORDER,
              label: "Flag",
            },
          },
          tooltip: {
            format: "{GroupID}: {Numerator} / {Denominator}",
          },
          selection: { enabled: true, multiple: true, opacity: 0.2 },
          callbacks: {
            onHover: (point, facetValue) => {
              statusEl.textContent = `Hovering: ${point._datum.GroupID} — ${facetValue}`;
            },
            onSelect: (selection) => {
              const value = selection.values?.[0] ?? "";
              siteSelect.value = value;
              selectedSite = value;
              statusEl.textContent = value ? `Selected: ${value}` : "";
            },
          },
          facet: {
            field: "MetricID",
            order: metrics,
            nCol: 2,
            chartHeight: 280,
            label: { position: "top" },
            scales: {
              x: { free: getScale("kri-facet-x-scale") },
              y: { free: getScale("kri-facet-y-scale") },
            },
            legend: { display: true, sync: true },
          },
        });

        if (selectedSite) selectSite(selectedSite);
      }

      function getScale(id) {
        return document.getElementById(id).value === "free";
      }

      render();

      siteSelect.addEventListener("change", () => selectSite(siteSelect.value));
      onAnyChange(
        [
          "kri-facet-x-type",
          "kri-facet-x-scale",
          "kri-facet-y-scale",
          "kri-facet-flag-filter",
        ],
        render
      );
    });
})();
