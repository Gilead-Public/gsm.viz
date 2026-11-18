import mergeSpec from '../../src/metricDistribution/mergeSpec.js';

describe('mergeSpec', () => {
    test('fills defaults for an empty spec', () => {
        expect(mergeSpec({})).toEqual({
            sections: undefined,
            values: undefined,
            labels: {},
            topN: Infinity,
            colors: {},
            theme: { barColor: '#4e79a7', neutralColor: '#bab0ac' },
        });
    });

    test('treats an absent spec as empty', () => {
        expect(mergeSpec(undefined)).toEqual(mergeSpec({}));
    });

    test('keeps user options and merges theme colours over the defaults', () => {
        const sections = [{ source: 'Numerator', variable: 'compreas' }];
        const merged = mergeSpec({
            sections,
            values: ['count'],
            labels: { count: 'Participants' },
            topN: 5,
            colors: { Ongoing: '#59a14f' },
            theme: { neutralColor: '#999999' },
        });
        expect(merged).toEqual({
            sections,
            values: ['count'],
            labels: { count: 'Participants' },
            topN: 5,
            colors: { Ongoing: '#59a14f' },
            theme: { barColor: '#4e79a7', neutralColor: '#999999' },
        });
    });
});
