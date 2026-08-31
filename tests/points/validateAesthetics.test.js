import validateSpec from '../../src/points/validateSpec.js';

const data = [{ xValue: 1, yValue: 2 }];
const minimalSpec = {
    mapping: { x: 'xValue', y: 'yValue' },
};

describe('points continuous aesthetic validation', () => {
    test.each(['size', 'opacity'])(
        'accepts a valid %s mapping and scale',
        (aesthetic) => {
            expect(() =>
                validateSpec(data, {
                    mapping: {
                        ...minimalSpec.mapping,
                        [aesthetic]: 'value',
                    },
                    scales: {
                        [aesthetic]: {
                            range: aesthetic === 'size' ? [2, 10] : [0.2, 0.8],
                        },
                    },
                })
            ).not.toThrow();
        }
    );

    test.each(['size', 'opacity'])(
        'rejects an invalid %s mapping',
        (aesthetic) => {
            expect(() =>
                validateSpec(data, {
                    mapping: {
                        ...minimalSpec.mapping,
                        [aesthetic]: '',
                    },
                })
            ).toThrow(`spec.mapping.${aesthetic} must be a non-empty string`);
        }
    );

    test.each([
        ['size', [], 'must contain two finite numbers'],
        ['size', [0, 10], 'values must be greater than zero'],
        ['size', [10, 2], 'values must be strictly increasing'],
        ['opacity', [0.2], 'must contain two finite numbers'],
        ['opacity', [-0.1, 0.8], 'values must be between 0 and 1'],
        ['opacity', [0.2, 1.1], 'values must be between 0 and 1'],
        ['opacity', [0.8, 0.2], 'values must be strictly increasing'],
    ])('rejects an invalid %s range %#', (aesthetic, range, suffix) => {
        expect(() =>
            validateSpec(data, {
                ...minimalSpec,
                scales: { [aesthetic]: { range } },
            })
        ).toThrow(`spec.scales.${aesthetic}.range ${suffix}`);
    });

    test.each(['size', 'opacity'])(
        'rejects unsupported %s scale fields',
        (aesthetic) => {
            expect(() =>
                validateSpec(data, {
                    ...minimalSpec,
                    scales: {
                        [aesthetic]: {
                            range: [1, 2],
                            unknown: true,
                        },
                    },
                })
            ).toThrow(`spec.scales.${aesthetic}.unknown is not supported`);
        }
    );
});
