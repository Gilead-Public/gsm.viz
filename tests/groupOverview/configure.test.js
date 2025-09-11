import configure from '../../src/groupOverview/configure.js';

describe('configuration', () => {
    const config = configure({});

    test('configure() accepts metric metadata object and returns config object', () => {
        const settings = Object.keys(config).sort();

        expect(settings).toEqual(
            [
                'GroupLevel',
                'SiteRiskMetric',
                'SiteRiskScoreURL',
                'groupLabelKey',
                'groupParticipantCountKey',
                'groupTooltipKeys',
                'resultTooltipKeys',
                'groupClickCallback',
                'metricClickCallback',
            ].sort()
        );
    });
});
