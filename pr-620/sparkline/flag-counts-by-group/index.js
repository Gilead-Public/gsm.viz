const dataFiles = [
    '../../data/deprecated/flag_counts_by_group.csv',
    '../../data/deprecated/meta_workflow.csv',
];

const dataPromises = dataFiles.map((dataFile) =>
    fetch(dataFile).then((response) => response.text())
);

Promise.all(dataPromises)
    .then((texts) => texts.map((text) => d3.csvParse(text)))
    .then((datasets) => {
        const flagCounts = datasets[0];
        const workflows = datasets[1];
        const groupIDs = [...new Set(flagCounts.map((d) => d.GroupID))];
        const container = document.getElementById('container');

        for (const groupID of groupIDs) {
            // container
            const subcontainer = document.createElement('div');
            subcontainer.id = `container_${groupID}`;
            container.appendChild(subcontainer);
            subcontainer.style.display = 'inline-block';

            // data
            const data = flagCounts.filter((d) => d.GroupID === groupID);
            data.forEach((d) => {
                d.n_at_risk_or_flagged = +d.n_at_risk + +d.n_flagged;
            });

            // configuration
            const config = {};
            config.x = 'SnapshotDate';
            config.y = 'n_at_risk_or_flagged';
            config.color = null;
            config.nSnapshots = 25;

            const instance = gsmViz.default.sparkline(
                subcontainer,
                data,
                config
            );
        }
    });
