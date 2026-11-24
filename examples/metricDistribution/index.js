// Simulated Reporting_Distributions rows; no real participant data. Rows are
// already at one group (the study or one site), as metricDistribution requires.

const StudyID = 'AA-AA-000-0000';
const SnapshotDate = '2026-11-01';

function makeRows(scope, Source, Variable, Total, counts) {
    return counts.map(([Category, Count]) => ({
        GroupID: scope.GroupID,
        GroupLevel: scope.GroupLevel,
        Source,
        Variable,
        Category,
        Count,
        Participants: Count,
        Total,
        Percent: Total > 0 ? +(Count / Total).toFixed(6) : null,
        MetricID: scope.MetricID,
        SnapshotDate,
        StudyID,
    }));
}

function makeResult(scope, Numerator, Denominator) {
    return {
        ...scope,
        StudyID,
        Numerator,
        Denominator,
        Metric: Denominator > 0 ? Numerator / Denominator : null,
        SnapshotDate,
    };
}

// Study discontinuation at study level.
const kri0006 = { MetricID: 'kri0006', GroupLevel: 'Study', GroupID: StudyID };
const studyDiscontinuation = {
    metric: {
        MetricID: 'kri0006',
        Metric: 'Study Discontinuation Rate',
        Numerator: 'Subjects Discontinued - Study',
        Denominator: 'Enrolled Subjects',
    },
    result: makeResult(kri0006, 57, 412),
    distributions: [
        ...makeRows(kri0006, 'Numerator', 'compreas', 57, [
            ['Withdrawal by Participant', 21],
            ['Lost to Follow-Up', 12],
            ['Death', 8],
            ['Study Discontinuation: Other', 12],
            [null, 4],
        ]),
        ...makeRows(kri0006, 'Denominator', 'disposition', 412, [
            ['Withdrawal by Participant', 21],
            ['Lost to Follow-Up', 12],
            ['Death', 8],
            ['Study Discontinuation: Other', 12],
            ['Study Completion', 96],
            ['Ongoing', 259],
            [null, 4],
        ]),
    ],
};

gsmViz.default.metricDistribution(
    '#study-discontinuation',
    studyDiscontinuation,
    {
        sections: [
            {
                source: 'Numerator',
                variable: 'compreas',
                title: 'Reasons for study discontinuation',
                labels: { count: 'Participants' },
            },
            {
                source: 'Denominator',
                variable: 'disposition',
                title: 'Study disposition',
                status: true,
                labels: { percent: '% Enrolled' },
            },
        ],
        // Placeholder status colours for the example; the agreed status
        // colour map is supplied by the consumer.
        colors: {
            Ongoing: '#59a14f',
            'Study Completion': '#76b7b2',
        },
    }
);

// Treatment discontinuation: a participant can have several reasons.
const kri0007 = { MetricID: 'kri0007', GroupLevel: 'Study', GroupID: StudyID };
gsmViz.default.metricDistribution(
    '#treatment-discontinuation',
    {
        metric: {
            MetricID: 'kri0007',
            Metric: 'Treatment Discontinuation Rate',
            Numerator: 'Subjects Discontinued - Treatment',
            Denominator: 'Enrolled Subjects',
        },
        result: makeResult(kri0007, 31, 412),
        distributions: [
            ...makeRows(kri0007, 'Numerator', 'discontinuation_reason', 31, [
                ['Adverse Event', 11],
                ['Progressive Disease', 9],
                ['Physician Decision', 4],
                ['Withdrawal by Participant', 6],
                ['Lack of Efficacy', 3],
                ['Protocol Violation', 1],
                ['Other', 2],
                [null, 2],
            ]),
            ...makeRows(kri0007, 'Denominator', 'treatment_status', 412, [
                ['On treatment', 233],
                ['Treatment completed', 140],
                ['Treatment discontinued', 31],
                ['Not dosed', 8],
                [null, 0],
            ]),
        ],
    },
    {
        sections: [
            {
                source: 'Numerator',
                variable: 'discontinuation_reason',
                title: 'Reasons for treatment discontinuation',
                topN: 4,
            },
            {
                source: 'Denominator',
                variable: 'treatment_status',
                title: 'Treatment status',
                status: true,
            },
        ],
    }
);

// Screen failures at one site, with the default spec.
const kri0012 = { MetricID: 'kri0012', GroupLevel: 'Site', GroupID: '0042' };
gsmViz.default.metricDistribution('#screen-failure', {
    metric: {
        MetricID: 'kri0012',
        Metric: 'Screen Failure Rate',
        Numerator: 'Screen Failures',
        Denominator: 'Screened Subjects',
    },
    result: makeResult(kri0012, 0, 15),
    distributions: [
        ...makeRows(kri0012, 'Denominator', 'screening_status', 15, [
            ['Screen Failure', 0],
            ['Enrolled', 15],
            [null, 0],
        ]),
        ...makeRows(kri0012, 'Numerator', 'sf_reason', 0, [
            ['Inclusion Criteria Not Met', 0],
            ['Exclusion Criteria Met', 0],
            ['Withdrawal by Participant', 0],
            ['Other', 0],
            [null, 0],
        ]),
    ],
});

gsmViz.default.metricDistribution('#missing', {
    metric: studyDiscontinuation.metric,
    result: studyDiscontinuation.result,
});

gsmViz.default.metricDistribution('#empty', {
    metric: studyDiscontinuation.metric,
    result: studyDiscontinuation.result,
    distributions: [],
});
