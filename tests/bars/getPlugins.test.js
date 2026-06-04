import getPlugins from '../../src/bars/getPlugins.js';

describe('bars/getPlugins', () => {
    describe('title', () => {
        test('displays title when labels.title is set', () => {
            const spec = {
                mapping: {},
                scales: { fill: {} },
                labels: { title: 'My Chart' },
            };
            const plugins = getPlugins(spec);
            expect(plugins.title.display).toBe(true);
            expect(plugins.title.text).toBe('My Chart');
        });

        test('hides title when labels.title is absent', () => {
            const spec = {
                mapping: {},
                scales: { fill: {} },
                labels: {},
            };
            const plugins = getPlugins(spec);
            expect(plugins.title.display).toBe(false);
        });
    });

    describe('legend visibility', () => {
        test('shows legend when mapping.fill is set', () => {
            const spec = {
                mapping: { fill: 'group' },
                scales: { fill: {} },
                labels: {},
            };
            const plugins = getPlugins(spec);
            expect(plugins.legend.display).toBe(true);
        });

        test('hides legend when mapping.fill is absent', () => {
            const spec = {
                mapping: {},
                scales: { fill: {} },
                labels: {},
            };
            const plugins = getPlugins(spec);
            expect(plugins.legend.display).toBe(false);
        });
    });

    describe('legend title (fill label)', () => {
        test('defaults legend title to mapping.fill variable name', () => {
            const spec = {
                mapping: { fill: 'group' },
                scales: { fill: {} },
                labels: {},
            };
            const plugins = getPlugins(spec);
            expect(plugins.legend.title.display).toBe(true);
            expect(plugins.legend.title.text).toBe('group');
        });

        test('uses scales.fill.label when provided', () => {
            const spec = {
                mapping: { fill: 'group' },
                scales: { fill: { label: 'Treatment Arm' } },
                labels: {},
            };
            const plugins = getPlugins(spec);
            expect(plugins.legend.title.display).toBe(true);
            expect(plugins.legend.title.text).toBe('Treatment Arm');
        });

        test('disables legend title when scales.fill.label is null', () => {
            const spec = {
                mapping: { fill: 'group' },
                scales: { fill: { label: null } },
                labels: {},
            };
            const plugins = getPlugins(spec);
            expect(plugins.legend.title.display).toBe(false);
        });

        test('disables legend title when scales.fill.label is empty string', () => {
            const spec = {
                mapping: { fill: 'group' },
                scales: { fill: { label: '' } },
                labels: {},
            };
            const plugins = getPlugins(spec);
            expect(plugins.legend.title.display).toBe(false);
        });

        test('no legend title when mapping.fill is absent', () => {
            const spec = {
                mapping: {},
                scales: { fill: {} },
                labels: {},
            };
            const plugins = getPlugins(spec);
            expect(plugins.legend.title.display).toBe(false);
        });
    });
});
