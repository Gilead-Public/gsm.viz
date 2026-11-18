// Simulated Reporting_Distributions inputs for qualification. No real
// participant data: every count below is invented. Rows are already at one
// group (study or site), as the widget requires, and Percent is Count / Total
// rounded to six decimals, as the pipeline publishes it.

const StudyID = 'AA-AA-000-0000';
const SnapshotDate = '2026-11-01';

function rows(scope, Source, Variable, Total, counts) {
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

function result(scope, Numerator, Denominator) {
    return {
        StudyID,
        GroupLevel: scope.GroupLevel,
        GroupID: scope.GroupID,
        MetricID: scope.MetricID,
        Numerator,
        Denominator,
        Metric: Denominator > 0 ? Numerator / Denominator : null,
        SnapshotDate,
    };
}

const studyDiscontinuation = {
    MetricID: 'kri0006',
    GroupLevel: 'Study',
    GroupID: StudyID,
};

const treatmentDiscontinuation = {
    MetricID: 'kri0007',
    GroupLevel: 'Study',
    GroupID: StudyID,
};

const screenFailure = {
    MetricID: 'kri0012',
    GroupLevel: 'Site',
    GroupID: '0042',
};

export const cases = [
    {
        name: 'study discontinuation, labelled and coloured',
        data: {
            metric: {
                MetricID: 'kri0006',
                Metric: 'Study Discontinuation Rate',
                Numerator: 'Subjects Discontinued - Study',
                Denominator: 'Enrolled Subjects',
            },
            result: result(studyDiscontinuation, 57, 412),
            distributions: [
                ...rows(studyDiscontinuation, 'Numerator', 'compreas', 57, [
                    ['Withdrawal by Participant', 21],
                    ['Lost to Follow-Up', 12],
                    ['Death', 8],
                    ['Study Discontinuation: Other', 12],
                    [null, 4],
                ]),
                ...rows(
                    studyDiscontinuation,
                    'Denominator',
                    'disposition',
                    412,
                    [
                        ['Withdrawal by Participant', 21],
                        ['Lost to Follow-Up', 12],
                        ['Death', 8],
                        ['Study Discontinuation: Other', 12],
                        ['Study Completion', 96],
                        ['Ongoing', 259],
                        [null, 4],
                    ]
                ),
            ],
        },
        spec: {
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
            colors: {
                Ongoing: '#59a14f',
                'Study Completion': '#4e79a7',
            },
        },
    },
    {
        name: 'treatment discontinuation, multi-value reasons with top N',
        data: {
            metric: {
                MetricID: 'kri0007',
                Metric: 'Treatment Discontinuation Rate',
                Numerator: 'Subjects Discontinued - Treatment',
                Denominator: 'Enrolled Subjects',
            },
            result: result(treatmentDiscontinuation, 31, 412),
            distributions: [
                ...rows(
                    treatmentDiscontinuation,
                    'Numerator',
                    'discontinuation_reason',
                    31,
                    [
                        ['Adverse Event', 11],
                        ['Progressive Disease', 9],
                        ['Physician Decision', 4],
                        ['Withdrawal by Participant', 6],
                        ['Lack of Efficacy', 3],
                        ['Protocol Violation', 1],
                        ['Other', 2],
                        [null, 2],
                    ]
                ),
                ...rows(
                    treatmentDiscontinuation,
                    'Denominator',
                    'treatment_status',
                    412,
                    [
                        ['On treatment', 233],
                        ['Treatment completed', 140],
                        ['Treatment discontinued', 31],
                        ['Not dosed', 8],
                        [null, 0],
                    ]
                ),
            ],
        },
        spec: {
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
        },
    },
    {
        name: 'screen failure at one site with no screen failures, default spec',
        data: {
            metric: {
                MetricID: 'kri0012',
                Metric: 'Screen Failure Rate',
                Numerator: 'Screen Failures',
                Denominator: 'Screened Subjects',
            },
            result: result(screenFailure, 0, 15),
            distributions: [
                ...rows(screenFailure, 'Denominator', 'screening_status', 15, [
                    ['Screen Failure', 0],
                    ['Enrolled', 15],
                    [null, 0],
                ]),
                ...rows(screenFailure, 'Numerator', 'sf_reason', 0, [
                    ['Inclusion Criteria Not Met', 0],
                    ['Exclusion Criteria Met', 0],
                    ['Withdrawal by Participant', 0],
                    ['Other', 0],
                    [null, 0],
                ]),
            ],
        },
        spec: {},
    },
];
