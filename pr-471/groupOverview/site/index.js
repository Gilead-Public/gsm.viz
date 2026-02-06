const dataFiles = [
    '../../data/results.csv',
    '../../data/metricMetadata.csv',
    '../../data/groupMetadata.csv',
];

const dataPromises = dataFiles.map((dataFile) =>
    fetch(dataFile).then((response) => response.text())
);

Promise.all(dataPromises)
    .then((texts) => texts.map((text) => d3.csvParse(text)))
    .then((datasets) => {
        const GroupLevel = 'Site';

        let metricPrefix;
        if (GroupLevel === 'Site') {
            metricPrefix = 'kri';
        } else if (GroupLevel === 'Country') {
            metricPrefix = 'cou';
        } else if (GroupLevel === 'Study') {
            metricPrefix = 'qtl';
        }

        const regex = new RegExp(`^${metricPrefix}`);

        const SnapshotDate = d3.max(datasets[0], (d) => d.SnapshotDate);
        datasets[0] = datasets[0].filter(
            (d) => d.SnapshotDate === SnapshotDate
        );
        const results = datasets[0].filter(
            (d) => regex.test(d.MetricID) || d.MetricID === 'srs0001'
        );
        const metricMetadata = datasets[1].filter((d) =>
            regex.test(d.MetricID)
        );
        const groupMetadata = datasets[2];

        // transpose [ metricMetadata ] to one row per:
        // - MetricID
        // - GroupLevel
        // - comma-separated value of Flag and RiskScoreWeights, which contain the same number of values
        // then merge onto [ results ] by MetricID, GroupLevel, and Flag
        // to get RiskScoreWeight onto each result row
        const metricMetadataTransposed = [];
        metricMetadata.forEach((d) => {
            const flags = d.Flag.split(',');
            const weights = d.RiskScoreWeight.split(',');
            flags.forEach((flag, i) => {
                metricMetadataTransposed.push({
                    ...d,
                    Flag: flag,
                    Weight: +weights[i],
                });
            });
        });

        // merge transposed metric metadata onto results by MetricID, GroupLevel, and Flag
        results.forEach((d) => {
            const metadata = metricMetadataTransposed.find(
                (m) =>
                    m.MetricID === d.MetricID &&
                    m.GroupLevel === GroupLevel &&
                    m.Flag === d.Flag
            );
            if (metadata) {
                d.Weight = metadata.Weight;
            } else {
                d.Weight = NaN;
            }
        });

        const groupLabelKey = {
            Site: 'InvestigatorLastName',
            Country: null,
            Study: 'nickname',
        };

        const groupOverviewTable = gsmViz.default.groupOverview(
            document.getElementById('container'),
            results,
            {
                GroupLevel,
                groupLabelKey: groupLabelKey[GroupLevel],
                groupTooltipKeys: groupTooltipKeys[GroupLevel],
                SiteRiskScoreMetricID: 'srs0001',
                //groupClickCallback: function (datum) {
                //},
                //metricClickCallback: function (datum) {
                //},
            },
            groupMetadata,
            metricMetadata
        );

        // Add interactive filter controls to the group overview table.
        const groupOverviewFilters = gsmViz.default.groupOverviewSubset(
            groupOverviewTable,
            {
                groupCharacteristics: {
                    Country: 'country',
                    Status: 'Status',
                },
                initialSubset: {
                    anyFlag: 'red',
                },
            }
        );

        addEventListener('riskSignalSelected');
        addEventListener('groupSelected');
    });
