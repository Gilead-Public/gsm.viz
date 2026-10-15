// Points-module replica of examples/scatterPlot: numerator vs. denominator
// for one metric, colored by flag, with group/country highlighting.
(() => {
  const files = [
    "../data/results.csv",
    "../data/metricMetadata.csv",
    "../data/groupMetadata.csv",
  ];

  Promise.all(files.map((file) => fetch(file).then((r) => r.text())))
    .then((texts) => texts.map((text) => d3.csvParse(text)))
    .then(([allResults, metricMetadata, groupMetadata]) => {
      const snapshotDate = d3.max(allResults, (d) => d.SnapshotDate);
      const results = allResults.filter((d) => d.SnapshotDate === snapshotDate);
      const metrics = sortMetricIDs([
        ...new Set(results.map((d) => d.MetricID)),
      ]);

      const metricSelect = document.getElementById("kri-metric");
      const groupSelect = document.getElementById("kri-group");
      const countrySelect = document.getElementById("kri-country");
      const xTypeSelect = document.getElementById("kri-x-type");

      // Wide group metadata lookup: GroupID -> { Param: Value }.
      const groups = new Map();
      groupMetadata.forEach(({ GroupID, Param, Value }) => {
        if (!groups.has(GroupID)) groups.set(GroupID, {});
        groups.get(GroupID)[Param] = Value;
      });

      let chart = null;
      let config = null;
      let rows = [];

      function getRows(metricID) {
        const metricRows = toPointRows(filterOnMetricID(results, metricID));
        return metricRows.map((d) => ({
          ...d,
          ...groups.get(d.GroupID),
        }));
      }

      function buildSpec() {
        const tooltipKeys = groupTooltipKeys[config.GroupLevel] || {
          GroupID: "Group",
        };
        return {
          mapping: {
            x: "Denominator",
            y: "Numerator",
            key: "GroupID",
            color: "Flag",
          },
          scales: {
            x: {
              type: xTypeSelect.value === "log" ? "log" : "linear",
              label:
                xTypeSelect.value === "log"
                  ? `${config.Denominator} (Log Scale)`
                  : config.Denominator,
            },
            y: { label: config.Numerator, beginAtZero: true },
            color: {
              colors: FLAG_COLORS,
              order: FLAG_ORDER,
              label: "Flag",
            },
          },
          labels: { title: config.Metric },
          tooltip: {
            formatter: (point) => [
              ...Object.entries(tooltipKeys).map(
                ([key, label]) => `${label}: ${point._datum[key] ?? ""}`
              ),
              `${config.Numerator}: ${point._datum.Numerator}`,
              `${config.Denominator}: ${point._datum.Denominator}`,
            ],
          },
          callbacks: {
            onClick: (point) => {
              groupSelect.value = point._datum.GroupID;
              highlight();
            },
          },
          selection: { enabled: true, multiple: true, opacity: 0.2 },
        };
      }

      function populateGroupControls() {
        const ids = [...new Set(rows.map((d) => d.GroupID))].sort(d3.ascending);
        setOptions(groupSelect, [
          { value: "None", label: "None" },
          ...ids.map((id) => ({ value: id, label: id })),
        ]);

        const countries = [
          ...new Set(rows.map((d) => d.Country).filter((c) => c !== undefined)),
        ].sort(d3.ascending);
        setOptions(countrySelect, [
          { value: "None", label: "None" },
          ...countries.map((c) => ({ value: c, label: c })),
        ]);
        countrySelect.disabled = config.GroupLevel !== "Site";
      }

      function highlight() {
        const known = new Set(rows.map((d) => d.GroupID));
        const keys = new Set();
        if (groupSelect.value !== "None") keys.add(groupSelect.value);
        if (countrySelect.value !== "None") {
          rows
            .filter((d) => d.Country === countrySelect.value)
            .forEach((d) => keys.add(d.GroupID));
        }
        const selected = [...keys].filter((key) => known.has(key));
        if (selected.length > 0) {
          chart.helpers.selectPoint(chart, selected);
        } else {
          chart.helpers.clearSelection(chart);
        }
      }

      function render(metricID) {
        config = selectMetricID(metricMetadata, metricID);
        rows = getRows(metricID);
        populateGroupControls();
        if (chart === null) {
          chart = gsmViz.default.points(
            document.getElementById("kri-container"),
            rows,
            buildSpec()
          );
        } else {
          chart.helpers.updateData(chart, rows, buildSpec());
        }
      }

      setOptions(
        metricSelect,
        metrics.map((id) => ({ value: id, label: id }))
      );
      metricSelect.value = "kri0001";
      render(metricSelect.value);

      metricSelect.addEventListener("change", () => render(metricSelect.value));
      xTypeSelect.addEventListener("change", () =>
        chart.helpers.updateSpec(chart, {
          scales: {
            x: {
              type: xTypeSelect.value === "log" ? "log" : "linear",
              label:
                xTypeSelect.value === "log"
                  ? `${config.Denominator} (Log Scale)`
                  : config.Denominator,
            },
          },
        })
      );
      onAnyChange(["kri-group", "kri-country"], highlight);
      document
        .getElementById("kri-download")
        .addEventListener("click", () => chart.helpers.exportImage(chart));
    });
})();
