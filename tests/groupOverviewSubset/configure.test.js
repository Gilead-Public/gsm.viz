/**
 * @jest-environment jsdom
 */

import configure from '../../src/groupOverviewSubset/configure.js';

describe('groupOverviewSubset configure', () => {
    test('returns defaults when no config is provided', () => {
        const config = configure({});
        expect(config.container).toBeNull();
        expect(config.groupCharacteristics).toEqual({});
        expect(config.initialSubset).toEqual({});
        expect(config.defaultFilters).toEqual([
            'anyFlag',
            'siteRiskScore',
            'numberEnrolled',
        ]);
        expect(config.rangeControl).toBe('inputs');
    });

    test('merges custom settings with defaults', () => {
        const config = configure({
            container: '#my-container',
            groupCharacteristics: { Country: 'country' },
            rangeControl: 'dualRange',
        });
        expect(config.container).toBe('#my-container');
        expect(config.groupCharacteristics).toEqual({ Country: 'country' });
        expect(config.rangeControl).toBe('dualRange');
        // defaults are preserved
        expect(config.initialSubset).toEqual({});
        expect(config.defaultFilters).toEqual([
            'anyFlag',
            'siteRiskScore',
            'numberEnrolled',
        ]);
    });

    test('allows overriding defaultFilters to an empty array', () => {
        const config = configure({ defaultFilters: [] });
        expect(config.defaultFilters).toEqual([]);
    });

    test('handles null config', () => {
        const config = configure(null);
        expect(config.container).toBeNull();
        expect(config.defaultFilters).toHaveLength(3);
    });
});
