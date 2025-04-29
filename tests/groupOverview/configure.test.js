import configure from '../../src/groupOverview/configure.js';

describe('configuration', () => {
    const config = configure({});

    test('configure() accepts metric metadata object and returns config object', () => {
        const settings = Object.keys(config).sort();

        expect(settings).toEqual(
            [
                'GroupLevel',
                'groupLabelKey',
                'groupParticipantCountKey',
                'groupTooltipKeys',
                'setResultTooltipKeys',
                'groupClickCallback',
                'metricClickCallback',
            ].sort()
        );
    });
});
