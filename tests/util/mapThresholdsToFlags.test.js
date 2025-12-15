import mapThresholdsToFlags from '../../src/util/mapThresholdsToFlags.js';

describe('map thresholds to flags', () => {
    test('same number of flags returned as number of thresholds', () => {
        expect(mapThresholdsToFlags([-3, -2, 0, 2, 3]).length).toEqual(5);
    });

    test('thresholds are sorted', () => {
        expect(
            mapThresholdsToFlags([0, -2, 2, -3, 3]).map(
                (Flag) => Flag.Threshold
            )
        ).toEqual([-3, -2, 0, 2, 3]);
    });

    test('positive thresholds are mapped appropriately', () => {
        expect(
            mapThresholdsToFlags([0, 2, 3]).map((Flag) => Flag.Flag)
        ).toEqual([0, 1, 2]);
    });

    test('negative thresholds are mapped appropriately', () => {
        expect(
            mapThresholdsToFlags([-3, -2, 0]).map((Flag) => Flag.Flag)
        ).toEqual([-2, -1, 0]);
    });

    test('incomplete thresholds are mapped appropriately', () => {
        expect(
            mapThresholdsToFlags([2, 0, -2, -3]).map((Flag) => Flag.Flag)
        ).toEqual([-2, -1, 0, 1]);
    });

    test('more than two positive thresholds returns null', () => {
        expect(mapThresholdsToFlags([0, 1, 2, 3])).toBeNull();
    });

    test('more than two negative thresholds returns null', () => {
        expect(mapThresholdsToFlags([0, -1, -2, -3])).toBeNull();
    });

    test('zero threshold is mapped appropriately', () => {
        expect(mapThresholdsToFlags([0]).map((Flag) => Flag.Flag)).toEqual([0]);
    });

    test('thresholds in descending order are mapped appropriately', () => {
        expect(
            mapThresholdsToFlags([0.75, 0.5]).map((Flag) => Flag.Flag)
        ).toEqual([1, 2]);
    });
});
