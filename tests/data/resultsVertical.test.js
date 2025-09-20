import resultsVertical from '../../examples/data/deprecated/results_analysis.json';
import schema from '../../src/data/schema/resultsVertical.json';
import checkInput from '../../src/data/checkInput.js';
import getType from '../../src/data/checkInput/getType.js';

describe('additional analysis results schema', () => {
    test('additional analysis results schema type matches data type of additional analysis results', () => {
        let resultsVerticalType = typeof resultsVertical;

        if (resultsVerticalType === 'object' && Array.isArray(resultsVertical))
            resultsVerticalType = 'array';

        expect(resultsVerticalType).toBe(schema.type);
    });

    test('type of additional analysis results schema items matches data type of additional analysis results items', () => {
        const resultVertical =
            resultsVertical[Math.floor(resultsVertical.length * Math.random())];

        expect(typeof resultVertical).toBe(schema.items.type);
    });

    test('properties of additional analysis results schema items match properties of additional analysis results items', () => {
        const resultVertical =
            resultsVertical[Math.floor(resultsVertical.length * Math.random())];
        const propsResult = Object.keys(resultVertical).sort();
        const propsSchema = Object.keys(schema.items.properties).sort();

        expect(propsResult).toEqual(propsSchema);
    });
});
