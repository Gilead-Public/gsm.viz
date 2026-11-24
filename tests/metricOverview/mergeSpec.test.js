import mergeSpec from '../../src/metricOverview/mergeSpec.js';

describe('metricOverview mergeSpec', () => {
    test('defaults to a list of the metric value, numerator and denominator', () => {
        const merged = mergeSpec({});

        expect(merged.layout).toBe('list');
        expect(merged.fields).toEqual(['Metric', 'Numerator', 'Denominator']);
        expect(merged.labels).toEqual({});
        expect(merged.studyId).toBeUndefined();
        expect(merged.groupLevel).toBeUndefined();
        expect(merged.groupId).toBeUndefined();
        expect(merged.snapshotDate).toBeUndefined();
    });

    test('formats the metric as a percent and groups thousands in every default format', () => {
        expect(mergeSpec({}).format).toEqual({
            Metric: ',.1%',
            Numerator: ',',
            Denominator: ',',
            Score: ',.2f',
            Flag: ',',
        });
    });

    test('shows a dash for unavailable values and "No data" when no row matches', () => {
        expect(mergeSpec({}).unavailable).toEqual({
            value: '—',
            empty: 'No data',
        });
    });

    test('lets user options override the defaults key by key', () => {
        const merged = mergeSpec({
            studyId: 'Study 01',
            groupLevel: 'Site',
            groupId: 'Site 01',
            snapshotDate: '2024-01-01',
            layout: 'header',
            fields: ['Metric'],
            labels: { Metric: 'Discontinued' },
            format: { Metric: '.2%' },
            unavailable: { value: 'Not available' },
        });

        expect(merged).toMatchObject({
            studyId: 'Study 01',
            groupLevel: 'Site',
            groupId: 'Site 01',
            snapshotDate: '2024-01-01',
            layout: 'header',
            fields: ['Metric'],
            labels: { Metric: 'Discontinued' },
        });
        expect(merged.format.Metric).toBe('.2%');
        expect(merged.format.Numerator).toBe(',');
        expect(merged.unavailable).toEqual({
            value: 'Not available',
            empty: 'No data',
        });
    });

    test('does not share arrays or objects with the caller or the defaults', () => {
        const spec = { fields: ['Metric'], labels: { Metric: 'Rate' } };
        const merged = mergeSpec(spec);
        merged.fields.push('Score');
        merged.labels.Metric = 'Changed';
        mergeSpec({}).fields.push('Flag');

        expect(spec).toEqual({
            fields: ['Metric'],
            labels: { Metric: 'Rate' },
        });
        expect(mergeSpec({}).fields).toEqual([
            'Metric',
            'Numerator',
            'Denominator',
        ]);
    });
});
