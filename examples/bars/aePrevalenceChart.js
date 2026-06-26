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
      const subjectsInPop = [...new Set(population.map((d) => d.USUBJID))];
      const totalSubjects = subjectsInPop.length;
      if (totalSubjects === 0) return [];

      // For each category value, count unique subjects
      const catSubjects = new Map();
      for (const d of population) {
        const cat = d[variable];
        if (cat == null || cat === "") continue;
        if (!catSubjects.has(cat)) catSubjects.set(cat, new Set());
        catSubjects.get(cat).add(d.USUBJID);
      }

      return [...catSubjects.entries()].map(([cat, subjects]) => ({
        category: cat,
        prevalence: (subjects.size / totalSubjects) * 100,
        count: subjects.size,
        total: totalSubjects,
      }));
    }

    // --- Build layered prevalence data ---
    function buildPrevalenceData(variable, site, subject) {
      const studyEnabled = document.getElementById("ae-level-study").checked;
      const siteEnabled = document.getElementById("ae-level-site").checked;
      const subjectEnabled =
        document.getElementById("ae-level-subject").checked;

      const rows = [];

      // Study level — all subjects
      if (studyEnabled) {
        const studyPrev = computePrevalence(data, variable);
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

      // Site level — subjects at the selected site
      if (siteEnabled && site) {
        const siteSubjects = new Set(
          allSubjects.filter((s) => subjectToSite.get(s) === site)
        );
        const siteData = data.filter((d) => siteSubjects.has(d.USUBJID));
        const sitePrev = computePrevalence(siteData, variable);
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

      // Subject level — binary (100% or 0%)
      if (subjectEnabled && subject) {
        const subjectData = data.filter((d) => d.USUBJID === subject);
        const subjectCats = new Set(
          subjectData
            .map((d) => d[variable])
            .filter((v) => v != null && v !== "")
        );

        // Get all categories present in the data for this variable
        const allCats = new Set(rows.map((r) => r[variable]).filter(Boolean));
        // Also add subject's own categories
        subjectCats.forEach((c) => allCats.add(c));

        allCats.forEach((cat) => {
          rows.push({
            [variable]: cat,
            prevalence: subjectCats.has(cat) ? 100 : 0,
            level: subject,
            count: subjectCats.has(cat) ? 1 : 0,
            total: 1,
          });
        });
      }

      return rows;
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
    function buildSpec(variable, site, subject) {
      const orientation = getValue("ae-orientation");
      const sort = getValue("ae-sort");
      const nCategories = getNCategories("ae-n-categories");
      const fillColors = buildFillConfig(site, subject);
      const label = colLabels[variable] || variable;

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
          x: { label, sort },
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

      const prevData = buildPrevalenceData(variable, site, subject);

      if (prevData.length === 0) {
        if (instance) {
          instance.destroy();
          instance = null;
        }
        container.textContent = "No data — enable at least one level.";
        return;
      }

      container.textContent = "";

      if (instance) instance.destroy();
      instance = gsmViz.default.bars(
        container,
        prevData,
        buildSpec(variable, site, subject)
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
