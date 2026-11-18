const by = 'Group'; // 'kri'

const dataFiles = [
    `../data/deprecated/flag_counts_by_${by}.csv`,
    '../data/metricMetadata.csv',
    '../data/groupMetadata.csv',
];

const dataPromises = dataFiles.map((dataFile) =>
    fetch(dataFile).then((response) => response.text())
);

Promise.all(dataPromises)
    .then((texts) => texts.map((text) => d3.csvParse(text)))
    .then((datasets) => {
        const workflowID = 'kri0001';

        // site metadata
        const sites = datasets[2];

        // data
        datasets[0].forEach((d) => {
            d.n_at_risk_or_flagged = +d.n_at_risk + +d.n_flagged;
        });

        let flagCounts = datasets[0];
        if (by === 'kri')
            flagCounts = flagCounts.filter((d) => d.MetricID === workflowID);

        // config
        const config =
            by === 'kri'
                ? {
                      ...datasets[1].find(
                          (workflow) => workflow.MetricID === workflowID
                      ),
                      //discreteUnit: 'Country',
                  }
                : {
                      selectedGroupIDs: '13',
                      discreteUnit: 'Site',
                  };
        config.y = 'n_flagged';
        //config.aggregateLabel = 'Country';

        // visualization
        const instance = gsmViz.default.timeSeries(
            document.getElementById('container'),
            flagCounts,
            config,
            null,
            null,
            sites
        );

        if (by === 'kri') kri(config, datasets, true);
        else
            document.getElementById('kri').parentElement.style.display = 'none';

        if (by === 'Group') site(datasets, true);
        else
            document.getElementById('GroupID').parentElement.style.display =
                'none';
    });
