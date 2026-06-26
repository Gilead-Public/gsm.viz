fetch("data/ae.json")
  .then((response) => response.json())
  .then((json) => {
    // --- Parse Dataset-JSON into row objects ---
    const colNames = json.columns.map((c) => c.name);
    const colLabels = Object.fromEntries(
      json.columns.map((c) => [c.name, c.label])
    );
    const data = json.rows.map((row) =>
      Object.fromEntries(colNames.map((name, i) => [name, row[i]]))
    );

    // --- Derive study ID, site IDs, and subject IDs ---
    const studyId = data[0]?.STUDYID || "Study";
    const allSubjects = [...new Set(data.map((d) => d.USUBJID))].sort();
    const subjectToSite = new Map(allSubjects.map((s) => [s, s.split("-")[1]]));
    const allSites = [...new Set(subjectToSite.values())].sort();

    // --- Populate site select ---
    const siteSelect = document.getElementById("ae-site");
    allSites.forEach((site) => {
      const opt = document.createElement("option");
      opt.value = site;
      opt.textContent = site;
      siteSelect.appendChild(opt);
    });

    // --- Variable label lookup ---
    const variables = [
      "AEDECOD",
      "AEBODSYS",
      "AESEV",
      "AESER",
      "AEREL",
      "AEOUT",
    ];

    // --- Populate subject select based on site ---
    function populateSubjects(site) {
      const subjectSelect = document.getElementById("ae-subject");
      subjectSelect.innerHTML = '<option value="" selected>All</option>';
      const subjects = site
        ? allSubjects.filter((s) => subjectToSite.get(s) === site)
        : allSubjects;
      subjects.forEach((subj) => {
        const opt = document.createElement("option");
        opt.value = subj;
        opt.textContent = subj;
        subjectSelect.appendChild(opt);
      });
    }

    populateSubjects("");

    // --- Prevalence calculation ---
    function computePrevalence(population, variable) {
      // Count records per category value.
      const catCounts = new Map();
      let totalRecords = 0;
      for (const d of population) {
        const cat = d[variable];
        if (cat == null || cat === "") continue;
        catCounts.set(cat, (catCounts.get(cat) || 0) + 1);
        totalRecords++;
      }

      if (totalRecords === 0) return [];

      return [...catCounts.entries()].map(([cat, count]) => ({
        category: cat,
        prevalence: (count / totalRecords) * 100,
        count,
        total: totalRecords,
      }));
    }

    // --- Build layered prevalence data ---
    function buildPrevalenceData(variable, site, subject) {
      const studyEnabled = document.getElementById("ae-level-study").checked;
      const siteEnabled = document.getElementById("ae-level-site").checked;
      const subjectEnabled =
        document.getElementById("ae-level-subject").checked;

      const rows = [];

      // Compute each level's prevalence. The first computed level is the
      // "highest" and determines the category sort order.
      let highestLevelPrev = null;

      // Study level — all records
      if (studyEnabled) {
        const studyPrev = computePrevalence(data, variable);
        if (!highestLevelPrev) highestLevelPrev = studyPrev;
        studyPrev.forEach((p) => {
          rows.push({
            [variable]: p.category,
            prevalence: p.prevalence,
            level: studyId,
            count: p.count,
            total: p.total,
          });
        });
      }

      // Site level — records at the selected site
      if (siteEnabled && site) {
        const siteSubjects = new Set(
          allSubjects.filter((s) => subjectToSite.get(s) === site)
        );
        const siteData = data.filter((d) => siteSubjects.has(d.USUBJID));
        const sitePrev = computePrevalence(siteData, variable);
        if (!highestLevelPrev) highestLevelPrev = sitePrev;
        sitePrev.forEach((p) => {
          rows.push({
            [variable]: p.category,
            prevalence: p.prevalence,
            level: "Site " + site,
            count: p.count,
            total: p.total,
          });
        });
      }

      // Subject level — records for the selected subject
      if (subjectEnabled && subject) {
        const subjectPrev = computePrevalence(
          data.filter((d) => d.USUBJID === subject),
          variable
        );
        if (!highestLevelPrev) highestLevelPrev = subjectPrev;
        subjectPrev.forEach((p) => {
          rows.push({
            [variable]: p.category,
            prevalence: p.prevalence,
            level: subject,
            count: p.count,
            total: p.total,
          });
        });
      }

      // Sort order: categories ordered by descending prevalence at the
      // highest visible level.
      let categoryOrder = null;
      if (highestLevelPrev) {
        categoryOrder = [...highestLevelPrev]
          .sort((a, b) => b.prevalence - a.prevalence)
          .map((p) => p.category);
      }

      return { rows, categoryOrder };
    }

    // --- Build fill order and colors ---
    function buildFillConfig(site, subject) {
      const studyEnabled = document.getElementById("ae-level-study").checked;
      const siteEnabled = document.getElementById("ae-level-site").checked;
      const subjectEnabled =
        document.getElementById("ae-level-subject").checked;

      const colors = {};
      if (studyEnabled) colors[studyId] = "#4e79a7";
      if (siteEnabled && site) colors["Site " + site] = "#f28e2b";
      if (subjectEnabled && subject) colors[subject] = "#e15759";

      return colors;
    }

    // --- Build chart spec ---
    function buildSpec(variable, site, subject, categoryOrder) {
      const orientation = getValue("ae-orientation");
      const sort = getValue("ae-sort");
      const nCategories = getNCategories("ae-n-categories");
      const fillColors = buildFillConfig(site, subject);
      const label = colLabels[variable] || variable;

      // When sort is 'total', use the pre-computed order from the highest
      // visible level. When 'alphanumeric', let Chart.js sort naturally.
      const xScale = { label };
      if (sort === "total" && categoryOrder) {
        xScale.order = categoryOrder;
      }

      return {
        mapping: {
          x: variable,
          y: "prevalence",
          fill: "level",
        },
        position: "layer",
        orientation,
        nCategories: nCategories || undefined,
        scales: {
          x: xScale,
          y: { label: "Prevalence (%)", max: 100 },
          fill: {
            label: "Level",
            colors: fillColors,
          },
        },
        labels: {
          title: "AE Prevalence by " + label,
        },
        tooltip: {
          formatter: (value, context, details) => {
            const datum = details.datum;
            const level = datum?.level || "";
            const count = datum?.count ?? "";
            const total = datum?.total ?? "";
            const pct =
              typeof value === "number" ? value.toFixed(1) + "%" : value;
            return `${level}: ${pct} (${count}/${total})`;
          },
        },
        theme: {
          dynamicSizing: true,
        },
      };
    }

    // --- Render ---
    const container = document.getElementById("ae-container");
    let instance = null;

    function render() {
      const variable = getValue("ae-variable");
      const site = getValue("ae-site");
      const subject = getValue("ae-subject");

      const { rows: prevData, categoryOrder } = buildPrevalenceData(
        variable,
        site,
        subject
      );

      if (prevData.length === 0) {
        if (instance) {
          instance.destroy();
          instance = null;
        }
        container.textContent = "No data — enable at least one level.";
        return;
      }

      // Clear previous content and inline sizing so dynamicSizing can
      // compute fresh dimensions without a stale fixed height/width.
      container.textContent = "";
      container.style.height = "";
      container.style.width = "";

      if (instance) instance.destroy();
      instance = gsmViz.default.bars(
        container,
        prevData,
        buildSpec(variable, site, subject, categoryOrder)
      );
    }

    render();

    // --- Event listeners ---
    document.getElementById("ae-export-btn").addEventListener("click", () => {
      if (instance) {
        instance.helpers.exportImage(instance, "ae-prevalence.png");
      }
    });

    // Site change cascades to subject
    document.getElementById("ae-site").addEventListener("change", () => {
      populateSubjects(getValue("ae-site"));
      render();
    });

    onAnyChange(
      [
        "ae-variable",
        "ae-subject",
        "ae-orientation",
        "ae-sort",
        "ae-n-categories",
      ],
      render
    );

    // Level checkboxes
    ["ae-level-study", "ae-level-site", "ae-level-subject"].forEach((id) => {
      document.getElementById(id).addEventListener("change", render);
    });
  });
