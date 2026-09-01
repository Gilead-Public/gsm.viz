export const statusTrackerData = [
    {
        participantId: 'P-001',
        siteId: 'Site 01',
        lastKnownDay: 43,
        daysSinceContact: 12,
        disposition: 'Ongoing',
        markerSize: 8,
    },
    {
        participantId: 'P-002',
        siteId: 'Site 02',
        lastKnownDay: 28,
        daysSinceContact: 64,
        disposition: 'Potential Lost to Follow-Up',
        markerSize: 8,
    },
    {
        participantId: 'P-003',
        siteId: 'Site 01',
        lastKnownDay: 76,
        daysSinceContact: 0,
        disposition: 'Completed Study',
        markerSize: 8,
    },
];

export function getStatusTrackerSpec(callbacks = {}) {
    return {
        mapping: {
            x: 'lastKnownDay',
            y: 'daysSinceContact',
            key: 'participantId',
            color: 'disposition',
            size: 'markerSize',
        },
        scales: {
            x: { label: 'Last Known Alive Day from Randomization' },
            y: { label: 'Reference to Last Known Alive Day' },
            color: {
                colors: {
                    Ongoing: '#1a9850',
                    'Completed Study': '#2166ac',
                    Death: '#000000',
                    'Potential Lost to Follow-Up': '#f28e2b',
                },
                order: [
                    'Ongoing',
                    'Completed Study',
                    'Death',
                    'Potential Lost to Follow-Up',
                ],
                label: 'Disposition',
            },
            size: { range: [3, 5] },
        },
        tooltip: {
            format: '{siteId} - {participantId}: {disposition}; Last Known Alive Day: {lastKnownDay}; Reference to Last Known Alive Day: {daysSinceContact}',
        },
        callbacks,
        labels: {
            title: 'Patient Status Tracker',
            description:
                'Each point represents one simulated participant disposition.',
        },
    };
}

export const prematureDeathData = [
    {
        subjectId: 'A',
        country: 'USA',
        siteId: 'S1',
        category: 'Death within 30 days',
        eventDay: 20,
        followUpDay: 200,
    },
    {
        subjectId: 'B',
        country: 'USA',
        siteId: 'S1',
        category: 'Death within 31-90 days',
        eventDay: 70,
        followUpDay: 200,
    },
    {
        subjectId: 'C',
        country: 'CAN',
        siteId: 'S2',
        category: 'Study discontinuation within 90 days',
        eventDay: 49,
        followUpDay: 200,
    },
    {
        subjectId: 'D',
        country: 'CAN',
        siteId: 'S2',
        category: 'Alive at 90 days',
        eventDay: 90,
        followUpDay: 200,
    },
    {
        subjectId: 'E',
        country: 'USA',
        siteId: 'S1',
        category: 'Alive, not yet 90 days on study',
        eventDay: 40,
        followUpDay: 40,
    },
];

export const prematureDeathOrder = [
    'Death within 30 days',
    'Death within 31-90 days',
    'Study discontinuation within 90 days',
    'Alive at 90 days',
    'Alive, not yet 90 days on study',
];

export function getPrematureDeathSpec(callbacks = {}) {
    return {
        mapping: {
            x: 'eventDay',
            y: 'followUpDay',
            key: 'subjectId',
            color: 'category',
        },
        scales: {
            x: {
                label: 'Days from Randomization to Event',
                range: [0, 95],
            },
            y: {
                label: 'Days from Randomization to Snapshot',
                range: [0, 210],
            },
            color: {
                colors: {
                    'Death within 30 days': '#b2182b',
                    'Death within 31-90 days': '#ef8a62',
                    'Study discontinuation within 90 days': '#555555',
                    'Alive at 90 days': '#1b7837',
                    'Alive, not yet 90 days on study': '#7fbf7b',
                },
                order: prematureDeathOrder,
                label: 'Category',
            },
        },
        tooltip: {
            format: 'Country: {country}; Site: {siteId}; Subject: {subjectId}; Category: {category}; Days (x): {eventDay}',
        },
        callbacks,
    };
}

export const visualizeScatterData = [
    {
        snapshot: '2025-01',
        groupId: 'A',
        denominator: 10,
        numerator: 2,
        flag: 0,
        flagged: false,
    },
    {
        snapshot: '2025-01',
        groupId: 'B',
        denominator: 100,
        numerator: 16,
        flag: 1,
        flagged: true,
    },
    {
        snapshot: '2025-02',
        groupId: 'A',
        denominator: 20,
        numerator: 4,
        flag: 0,
        flagged: false,
    },
    {
        snapshot: '2025-02',
        groupId: 'C',
        denominator: 500,
        numerator: 38,
        flag: 2,
        flagged: true,
    },
];

export const visualizeScatterBounds = [
    {
        snapshot: '2025-01',
        threshold: 'Review',
        denominator: 5,
        numerator: 3,
    },
    {
        snapshot: '2025-01',
        threshold: 'Review',
        denominator: 1000,
        numerator: 30,
    },
    {
        snapshot: '2025-02',
        threshold: 'Review',
        denominator: 5,
        numerator: 4,
    },
    {
        snapshot: '2025-02',
        threshold: 'Review',
        denominator: 1000,
        numerator: 36,
    },
];

export function getVisualizeScatterSpec() {
    return {
        mapping: {
            x: 'denominator',
            y: 'numerator',
            key: 'groupId',
            color: 'flag',
        },
        scales: {
            x: {
                type: 'log',
                label: 'Site Total (Denominator, log scale)',
                breaks: [5, 10, 50, 100, 500, 1000],
                labels: ['5', '10', '50', '100', '500', '1,000'],
            },
            y: {
                label: 'Site Total (Numerator)',
                beginAtZero: true,
            },
            color: {
                colors: {
                    0: '#999999',
                    1: '#fadb14',
                    2: '#ff4d4f',
                },
                order: [0, 1, 2],
                label: 'Absolute flag',
            },
        },
        annotations: {
            lines: [
                {
                    data: visualizeScatterBounds,
                    mapping: {
                        x: 'denominator',
                        y: 'numerator',
                        group: 'threshold',
                    },
                    order: ['Review'],
                    colors: { Review: '#fadb14' },
                },
            ],
            labels: {
                point: {
                    field: 'groupId',
                    display: 'flagged',
                    align: 'bottom',
                },
            },
        },
        tooltip: {
            format: 'GroupID: {groupId}; Exposure: {denominator}; Events: {numerator}',
        },
        facet: {
            field: 'snapshot',
            order: ['2025-01', '2025-02'],
            scales: {
                x: { free: false },
                y: { free: false },
            },
            legend: { display: false },
        },
    };
}
