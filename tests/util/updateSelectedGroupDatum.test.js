import results from '../../examples/data/results.json';
import updateSelectedGroupDatum from '../../src/util/updateSelectedGroupDatum.js';

describe('expected group datum is returned', () => {
    it('should return the expected group datum', () => {
        const selectedGroupIDs = ['43'];
        const selectedGroupDatum = updateSelectedGroupDatum(
            results,
            selectedGroupIDs
        );
        const expectedGroupDatum = results.find((d) =>
            selectedGroupIDs.includes(d.GroupID)
        );

        expect(expectedGroupDatum).toEqual(
            expect.objectContaining(selectedGroupDatum)
        );
    });
});

describe('no group datum is returned', () => {
    it('should return an empty object given no group IDs', () => {
        const selectedGroupIDs = [];
        const selectedGroupDatum = updateSelectedGroupDatum(
            results,
            selectedGroupIDs
        );

        expect(selectedGroupDatum).toEqual({});
    });

    it('should return an empty object given multiple group IDs', () => {
        const selectedGroupIDs = ['43', '44'];
        const selectedGroupDatum = updateSelectedGroupDatum(
            results,
            selectedGroupIDs
        );

        expect(selectedGroupDatum).toEqual({});
    });
});
