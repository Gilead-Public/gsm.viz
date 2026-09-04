import getPlugins from '../../src/points/getPlugins.js';

const spec = {
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
});
