import getPlugins from '../../src/points/getPlugins.js';

const spec = {
    mapping: { x: 'xValue', y: 'yValue' },
    scales: { color: { label: undefined } },
    labels: {
        title: undefined,
        caption: undefined,
        description: undefined,
    },
};

describe('points/getPlugins', () => {
    test('disables title, caption, and legend by default', () => {
        expect(getPlugins(spec)).toEqual({
            title: { display: false, text: '' },
            subtitle: {
                display: false,
                position: 'bottom',
                align: 'start',
                text: '',
            },
            legend: { display: false },
            tooltip: {},
        });
    });

    test('renders title and caption labels', () => {
        expect(
            getPlugins({
                ...spec,
                labels: {
                    title: 'Point chart',
                    caption: 'Source: simulated data',
                    description: 'Accessible description',
                },
            })
        ).toEqual({
            title: { display: true, text: 'Point chart' },
            subtitle: {
                display: true,
                position: 'bottom',
                align: 'start',
                text: 'Source: simulated data',
            },
            legend: { display: false },
            tooltip: {},
        });
    });

    describe('color legend', () => {
        test('shows the legend with the mapping name as its title', () => {
            const plugins = getPlugins({
                ...spec,
                mapping: { ...spec.mapping, color: 'treatment' },
            });

            expect(plugins.legend).toEqual({
                display: true,
                title: {
                    display: true,
                    text: 'treatment',
                },
            });
        });

        test.each([null, ''])('hides the title for explicit %p', (label) => {
            const plugins = getPlugins({
                ...spec,
                mapping: { ...spec.mapping, color: 'treatment' },
                scales: { color: { label } },
            });

            expect(plugins.legend.display).toBe(true);
            expect(plugins.legend.title).toEqual({
                display: false,
                text: '',
            });
        });

        test('uses an explicit legend title', () => {
            const plugins = getPlugins({
                ...spec,
                mapping: { ...spec.mapping, color: 'treatment' },
                scales: { color: { label: 'Treatment arm' } },
            });

            expect(plugins.legend.title).toEqual({
                display: true,
                text: 'Treatment arm',
            });
        });

        test('builds the tooltip plugin from the merged spec', () => {
            const formatter = jest.fn(() => 'Custom');
            const plugins = getPlugins({
                ...spec,
                tooltip: {
                    formatter,
                    format: '{x}',
                    mode: 'nearest',
                    intersect: false,
                },
            });
            const point = {
                x: 1,
                y: 2,
                _key: 0,
                _datum: { xValue: 1, yValue: 2 },
            };
            const context = { raw: point };

            expect(plugins.tooltip.mode).toBe('nearest');
            expect(plugins.tooltip.intersect).toBe(false);
            expect(plugins.tooltip.format).toBeUndefined();
            expect(plugins.tooltip.callbacks.label(context)).toBe('Custom');
            expect(formatter).toHaveBeenCalledWith(
                point,
                context,
                expect.objectContaining({
                    x: 1,
                    y: 2,
                    key: 0,
                    datum: point._datum,
                })
            );
        });
    });
});
