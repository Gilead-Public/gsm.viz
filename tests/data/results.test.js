import results from '../../examples/data/results.json';
import schema from '../../src/data/schema/results.json';
import checkInput from '../../src/data/checkInput.js';
import getType from '../../src/data/checkInput/getType.js';

describe('analysis results schema', () => {
    test('analysis results schema type matches data type of analysis results', () => {
        let resultsType = typeof results;

        if (resultsType === 'object' && Array.isArray(results))
            resultsType = 'array';

        expect(resultsType).toBe(schema.type);
    });

    test('type of analysis results schema items matches data type of analysis results items', () => {
        const result = results[Math.floor(results.length * Math.random())];

        expect(typeof result).toBe(schema.items.type);
    });

    test('properties of analysis results schema items match properties of analysis results items', () => {
        const result = results[Math.floor(results.length * Math.random())];
        const propsResult = Object.keys(result).sort();
        const propsSchema = Object.keys(schema.items.properties).sort();

        expect(propsResult).toEqual(propsSchema);
    });
});
