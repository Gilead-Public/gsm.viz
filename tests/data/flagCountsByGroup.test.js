import flagCountsByGroup from '../../examples/data/deprecated/flag_counts_by_group.json';
import flagCountsByMetric from '../../examples/data/deprecated/flag_counts_by_metric.json';
import schema from '../../src/data/schema/flagCounts.json';
import snapshotDate from '../../src/data/schema/snapshotDate.json';
import checkInput from '../../src/data/checkInput.js';
import getType from '../../src/data/checkInput/getType.js';

schema.items.properties.SnapshotDate = snapshotDate;

describe('Flag counts schema with Flag counts by Group', () => {
    const flagCounts = flagCountsByGroup;

    test('Flag counts schema type matches data type of Flag counts', () => {
        let flagCountsType = typeof flagCounts;

        if (flagCountsType === 'object' && Array.isArray(flagCounts))
            flagCountsType = 'array';

        expect(flagCountsType).toBe(schema.type);
    });

    test('type of Flag counts schema items matches data type of Flag counts items', () => {
        const flagCount =
            flagCounts[Math.floor(flagCounts.length * Math.random())];

        expect(typeof flagCount).toBe(schema.items.type);
    });

    test('properties of Flag counts schema items match properties of Flag counts items', () => {
        const flagCount =
            flagCounts[Math.floor(flagCounts.length * Math.random())];
        const propsResult = Object.keys(flagCount).sort();
        const propsSchema = Object.keys(schema.items.properties)
            .filter((prop) => prop !== 'MetricID')
            .sort();

        expect(propsResult).toEqual(propsSchema);
    });
});

describe('Flag counts schema with Flag counts by metric', () => {
    const flagCounts = flagCountsByMetric;

    test('Flag counts schema type matches data type of Flag counts', () => {
        let flagCountsType = typeof flagCounts;

        if (flagCountsType === 'object' && Array.isArray(flagCounts))
            flagCountsType = 'array';

        expect(flagCountsType).toBe(schema.type);
    });

    test('type of Flag counts schema items matches data type of Flag counts items', () => {
        const flagCount =
            flagCounts[Math.floor(flagCounts.length * Math.random())];

        expect(typeof flagCount).toBe(schema.items.type);
    });

    test('properties of Flag counts schema items match properties of Flag counts items', () => {
        const flagCount =
            flagCounts[Math.floor(flagCounts.length * Math.random())];
        const propsResult = Object.keys(flagCount).sort();
        const propsSchema = Object.keys(schema.items.properties)
            .filter((prop) => prop !== 'GroupID')
            .sort();

        expect(propsResult).toEqual(propsSchema);
    });
});
