// Gapminder-style bubble chart built on the points module: GDP vs. life
// expectancy by country, colored by continent, sized by a selectable measure.
(() => {
  const yearInput = document.getElementById("gapminder-year");
  const yearLabel = document.getElementById("gapminder-year-label");
  const playButton = document.getElementById("gapminder-play");
  const sizeSelect = document.getElementById("gapminder-size");
  const statusEl = document.getElementById("gapminder-status");

  const CONTINENT_COLORS = {
    Africa: "#e15759",
    Asia: "#f28e2b",
    Europe: "#4e79a7",
    "North America": "#59a14f",
    Oceania: "#b07aa1",
    "South America": "#edc948",
  };
  const SIZE_LABELS = {
    co2_consump: "CO2 consumption",
    services: "Services (% of GDP)",
    hdi_index: "HDI",
  };
  const PLAY_INTERVAL_MS = 700;

  fetch("../bars/data/gapminder_data_graphs.csv")
    .then((response) => response.text())
    .then((text) => d3.csvParse(text))
    .then((raw) => {
      const rows = raw.map((d) => ({
        country: d.country,
        continent: d.continent,
        year: Number(d.year),
        life_exp: d.life_exp === "" ? NaN : Number(d.life_exp),
        hdi_index: d.hdi_index === "" ? NaN : Number(d.hdi_index),
        co2_consump: d.co2_consump === "" ? NaN : Number(d.co2_consump),
        gdp: d.gdp === "" ? NaN : Number(d.gdp),
        services: d.services === "" ? NaN : Number(d.services),
      }));
      const [minYear, maxYear] = d3.extent(rows, (d) => d.year);
      const continents = Object.keys(CONTINENT_COLORS);

      yearInput.min = minYear;
      yearInput.max = maxYear;
      yearInput.value = minYear;

      // Fixed axis ranges keep bubbles comparable while the year changes.
      const gdpValues = rows.map((d) => d.gdp).filter(Number.isFinite);
      const lifeValues = rows.map((d) => d.life_exp).filter(Number.isFinite);
      const xRange = [d3.min(gdpValues) * 0.8, d3.max(gdpValues) * 1.25];
      const yRange = [
        Math.floor(d3.min(lifeValues) / 5) * 5,
        Math.ceil(d3.max(lifeValues) / 5) * 5,
      ];

      function yearRows() {
        const sizeKey = sizeSelect.value;
        return rows.filter(
          (d) =>
            d.year === Number(yearInput.value) &&
            Number.isFinite(d.gdp) &&
            Number.isFinite(d.life_exp) &&
            Number.isFinite(d[sizeKey])
        );
      }

      function buildSpec() {
        const sizeKey = sizeSelect.value;
        return {
          mapping: {
            x: "gdp",
            y: "life_exp",
            key: "country",
            color: "continent",
            size: sizeKey,
          },
          scales: {
            x: {
              type: "log",
              label: "GDP per capita (Log Scale)",
              range: xRange,
            },
            y: { label: "Life expectancy (years)", range: yRange },
            color: {
              colors: CONTINENT_COLORS,
              order: continents,
              label: "Continent",
            },
            size: { range: [3, 28] },
          },
          labels: {
            title: `Life expectancy vs. GDP, ${yearInput.value}`,
            description: `Bubble size shows ${SIZE_LABELS[sizeKey]}.`,
          },
          tooltip: {
            formatter: (point) => [
              point._datum.country,
              `GDP per capita: ${point._datum.gdp}`,
              `Life expectancy: ${point._datum.life_exp}`,
              `${SIZE_LABELS[sizeKey]}: ${point._datum[sizeKey]}`,
            ],
          },
          callbacks: {
            onHover: (point) => {
              statusEl.textContent = `${point._datum.country}, ${point._datum.continent}`;
            },
          },
          selection: { enabled: true, multiple: true, opacity: 0.15 },
        };
      }

      const chart = gsmViz.default.points(
        document.getElementById("gapminder-container"),
        yearRows(),
        buildSpec()
      );
      yearLabel.textContent = yearInput.value;

      function update() {
        yearLabel.textContent = yearInput.value;
        chart.helpers.updateData(chart, yearRows(), buildSpec());
      }

      let timer = null;
      function stop() {
        clearInterval(timer);
        timer = null;
        playButton.textContent = "Play";
      }

      yearInput.addEventListener("input", update);
      sizeSelect.addEventListener("change", update);
      playButton.addEventListener("click", () => {
        if (timer !== null) return stop();
        playButton.textContent = "Pause";
        if (Number(yearInput.value) >= maxYear) {
          yearInput.value = minYear;
        }
        timer = setInterval(() => {
          yearInput.value = Number(yearInput.value) + 1;
          update();
          if (Number(yearInput.value) >= maxYear) stop();
        }, PLAY_INTERVAL_MS);
      });
    });
})();
