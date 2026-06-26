import applyLayerWidths from '../../src/bars/structureData/applyLayerWidths.js';

describe('bars/structureData/applyLayerWidths', () => {
    test('sets barPercentage with linear taper for multiple datasets', () => {
        const datasets = [
            { label: 'A', data: [], backgroundColor: '#aaa' },
            { label: 'B', data: [], backgroundColor: '#bbb' },
            { label: 'C', data: [], backgroundColor: '#ccc' },
        ];
        applyLayerWidths(datasets);
        expect(datasets[0].barPercentage).toBeCloseTo(0.9);
        expect(datasets[1].barPercentage).toBeCloseTo(0.6);
        expect(datasets[2].barPercentage).toBeCloseTo(0.3);
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
        expect(datasets[0].barPercentage).toBeCloseTo(0.9);
        expect(datasets[1].barPercentage).toBeCloseTo(0.7);
        expect(datasets[2].barPercentage).toBeCloseTo(0.5);
        expect(datasets[3].barPercentage).toBeCloseTo(0.3);
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

    test('does not mutate datasets beyond expected properties', () => {
        const datasets = [
            { label: 'A', data: [1, 2], backgroundColor: '#aaa' },
            { label: 'B', data: [3, 4], backgroundColor: '#bbb' },
        ];
        applyLayerWidths(datasets);
        expect(datasets[0].label).toBe('A');
        expect(datasets[0].data).toEqual([1, 2]);
        expect(datasets[1].label).toBe('B');
        expect(datasets[1].data).toEqual([3, 4]);
    });

    test('handles empty datasets array', () => {
        const datasets = [];
        expect(() => applyLayerWidths(datasets)).not.toThrow();
        expect(datasets).toEqual([]);
    });

    test('tapers linearly for 2 datasets', () => {
        const datasets = [
            { label: 'A', data: [] },
            { label: 'B', data: [] },
        ];
        applyLayerWidths(datasets);
        expect(datasets[0].barPercentage).toBeCloseTo(0.9);
        expect(datasets[1].barPercentage).toBeCloseTo(0.3);
    });
});
