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
    });
});
