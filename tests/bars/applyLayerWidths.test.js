import applyLayerWidths from '../../src/bars/structureData/applyLayerWidths.js';

describe('bars/structureData/applyLayerWidths', () => {
    test('reverses datasets and assigns ascending barPercentage', () => {
        const datasets = [
            { label: 'A', data: [], backgroundColor: '#aaa' },
            { label: 'B', data: [], backgroundColor: '#bbb' },
            { label: 'C', data: [], backgroundColor: '#ccc' },
        ];
        applyLayerWidths(datasets);
        // After reverse: [C, B, A]. Widths ascend: C=0.3, B=0.6, A=0.9
        expect(datasets[0].label).toBe('C');
        expect(datasets[0].barPercentage).toBeCloseTo(0.3);
        expect(datasets[1].label).toBe('B');
        expect(datasets[1].barPercentage).toBeCloseTo(0.6);
        expect(datasets[2].label).toBe('A');
        expect(datasets[2].barPercentage).toBeCloseTo(0.9);
    });

    test('sets barPercentage to 0.9 for a single dataset', () => {
        const datasets = [{ label: 'A', data: [] }];
        applyLayerWidths(datasets);
        expect(datasets[0].barPercentage).toBeCloseTo(0.9);
    });

    test('tapers linearly for 4 datasets', () => {
        const datasets = [
            { label: 'A', data: [] },
            { label: 'B', data: [] },
            { label: 'C', data: [] },
            { label: 'D', data: [] },
        ];
        applyLayerWidths(datasets);
        // After reverse: [D, C, B, A]. Widths: D=0.3, C=0.5, B=0.7, A=0.9
        expect(datasets[0].barPercentage).toBeCloseTo(0.3);
        expect(datasets[1].barPercentage).toBeCloseTo(0.5);
        expect(datasets[2].barPercentage).toBeCloseTo(0.7);
        expect(datasets[3].barPercentage).toBeCloseTo(0.9);
    });

    test('sets categoryPercentage to 1.0 for all datasets', () => {
        const datasets = [
            { label: 'A', data: [] },
            { label: 'B', data: [] },
        ];
        applyLayerWidths(datasets);
        datasets.forEach((ds) => {
            expect(ds.categoryPercentage).toBe(1.0);
        });
    });

    test('ensures borderWidth is at least 1', () => {
        const datasets = [
            { label: 'A', data: [], borderWidth: 0 },
            { label: 'B', data: [] },
        ];
        applyLayerWidths(datasets);
        datasets.forEach((ds) => {
            expect(ds.borderWidth).toBeGreaterThanOrEqual(1);
        });
    });

    test('sets grouped to false on all datasets', () => {
        const datasets = [
            { label: 'A', data: [] },
            { label: 'B', data: [] },
            { label: 'C', data: [] },
        ];
        applyLayerWidths(datasets);
        datasets.forEach((ds) => {
            expect(ds.grouped).toBe(false);
        });
    });

    test('handles empty datasets array', () => {
        const datasets = [];
        expect(() => applyLayerWidths(datasets)).not.toThrow();
        expect(datasets).toEqual([]);
    });

    test('first fill group ends up at highest index with widest bar', () => {
        const datasets = [
            { label: 'Study', data: [] },
            { label: 'Site', data: [] },
            { label: 'Subject', data: [] },
        ];
        applyLayerWidths(datasets);
        // Study (originally first) should be at the end (drawn first/behind)
        // with the widest bar.
        const study = datasets.find((ds) => ds.label === 'Study');
        const subject = datasets.find((ds) => ds.label === 'Subject');
        expect(study.barPercentage).toBeCloseTo(0.9);
        expect(subject.barPercentage).toBeCloseTo(0.3);
        expect(datasets[datasets.length - 1].label).toBe('Study');
        expect(datasets[0].label).toBe('Subject');
    });

    test('tapers linearly for 2 datasets', () => {
        const datasets = [
            { label: 'A', data: [] },
            { label: 'B', data: [] },
        ];
        applyLayerWidths(datasets);
        // After reverse: [B, A]. B=0.3 (front), A=0.9 (back)
        expect(datasets[0].label).toBe('B');
        expect(datasets[0].barPercentage).toBeCloseTo(0.3);
        expect(datasets[1].label).toBe('A');
        expect(datasets[1].barPercentage).toBeCloseTo(0.9);
    });
});
