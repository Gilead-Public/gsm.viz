import validateSpec from '../../src/metricDistribution/validateSpec.js';

describe('validateSpec', () => {
    test('accepts an absent or empty spec', () => {
        expect(() => validateSpec(undefined)).not.toThrow();
        expect(() => validateSpec({})).not.toThrow();
    });

    test('accepts every documented option', () => {
        expect(() =>
            validateSpec({
                sections: [
                    {
                        source: 'Numerator',
                        variable: 'compreas',
                        title: 'Reasons for study discontinuation',
                        status: false,
                        topN: 5,
                        values: ['count', 'percent'],
                        labels: { percent: '% Discontinued' },
                    },
                ],
                values: ['percent', 'percentOfDenominator'],
                labels: {
                    count: 'n',
                    percent: '% Discontinued',
                    percentOfDenominator: '% Enrolled',
                },
                topN: 3,
                header: {
                    labels: { Numerator: 'Discontinued' },
                    format: { Metric: ',.2f' },
                    unavailable: { value: 'n/a' },
                },
                colors: { Ongoing: '#4e79a7' },
                theme: { barColor: '#4e79a7', neutralColor: '#bab0ac' },
            })
        ).not.toThrow();
    });

    test('requires a plain object', () => {
        expect(() => validateSpec(null)).toThrow('spec must be a plain object');
        expect(() => validateSpec([])).toThrow('spec must be a plain object');
    });

    test('rejects unsupported options so typos are not ignored', () => {
        expect(() => validateSpec({ topn: 3 })).toThrow(
            'spec.topn is not supported'
        );
        expect(() =>
            validateSpec({
                sections: [
                    { source: 'Numerator', variable: 'x', color: 'red' },
                ],
            })
        ).toThrow('spec.sections[0].color is not supported');
    });

    test('limits spec.header to the header’s labels, format, and unavailable text', () => {
        expect(() => validateSpec({ header: 'percent' })).toThrow(
            'spec.header must be a plain object'
        );
        expect(() => validateSpec({ header: { layout: 'list' } })).toThrow(
            'spec.header.layout is not supported'
        );
    });

    test('requires sections to be an array of source and variable pairs', () => {
        expect(() => validateSpec({ sections: {} })).toThrow(
            'spec.sections must be an array'
        );
        expect(() => validateSpec({ sections: ['compreas'] })).toThrow(
            'spec.sections[0] must be a plain object'
        );
        expect(() =>
            validateSpec({ sections: [{ variable: 'compreas' }] })
        ).toThrow('spec.sections[0].source must be a non-empty string');
        expect(() =>
            validateSpec({ sections: [{ source: 'Numerator' }] })
        ).toThrow('spec.sections[0].variable must be a non-empty string');
    });

    test('rejects a section listed twice', () => {
        expect(() =>
            validateSpec({
                sections: [
                    { source: 'Numerator', variable: 'compreas' },
                    { source: 'Numerator', variable: 'compreas' },
                ],
            })
        ).toThrow('spec.sections lists Numerator / compreas more than once');
    });

    test('checks section title and status types', () => {
        expect(() =>
            validateSpec({
                sections: [{ source: 'Numerator', variable: 'x', title: 1 }],
            })
        ).toThrow('spec.sections[0].title must be a string');
        expect(() =>
            validateSpec({
                sections: [
                    { source: 'Numerator', variable: 'x', status: 'yes' },
                ],
            })
        ).toThrow('spec.sections[0].status must be a boolean');
    });

    test('requires topN to be a positive integer', () => {
        expect(() => validateSpec({ topN: 0 })).toThrow(
            'spec.topN must be a positive integer'
        );
        expect(() =>
            validateSpec({
                sections: [{ source: 'Numerator', variable: 'x', topN: 2.5 }],
            })
        ).toThrow('spec.sections[0].topN must be a positive integer');
    });

    test('requires values to be a non-empty list of known values', () => {
        expect(() => validateSpec({ values: [] })).toThrow(
            "spec.values must be a non-empty array of 'count', 'percent', or 'percentOfDenominator'"
        );
        expect(() => validateSpec({ values: ['share'] })).toThrow(
            "spec.values must be a non-empty array of 'count', 'percent', or 'percentOfDenominator'"
        );
        expect(() => validateSpec({ values: ['count', 'count'] })).toThrow(
            'spec.values must contain unique values'
        );
    });

    test('requires labels to be strings keyed by value', () => {
        expect(() => validateSpec({ labels: 'n' })).toThrow(
            'spec.labels must be a plain object'
        );
        expect(() => validateSpec({ labels: { total: 'N' } })).toThrow(
            'spec.labels.total is not supported'
        );
        expect(() => validateSpec({ labels: { count: 3 } })).toThrow(
            'spec.labels.count must be a string'
        );
    });

    test('requires colors to map categories to colour strings', () => {
        expect(() => validateSpec({ colors: ['#000'] })).toThrow(
            'spec.colors must be a plain object'
        );
        expect(() => validateSpec({ colors: { Ongoing: 1 } })).toThrow(
            'spec.colors.Ongoing must be a string'
        );
    });

    test('requires theme colours to be strings', () => {
        expect(() => validateSpec({ theme: { barColor: 1 } })).toThrow(
            'spec.theme.barColor must be a string'
        );
        expect(() => validateSpec({ theme: { font: 'x' } })).toThrow(
            'spec.theme.font is not supported'
        );
    });
});
