import defaultFilename from '../../src/points/defaultFilename.js';

describe('points/defaultFilename', () => {
    test.each([
        ['Events by Exposure', 'events-by-exposure.png'],
        ['  MY   CHART  ', 'my-chart.png'],
        ['KRI: Flag/Count (2024)', 'kri-flagcount-2024.png'],
    ])('sanitizes title %p', (title, expected) => {
        expect(defaultFilename({ labels: { title } })).toBe(expected);
    });

    test('uses y-by-x scale labels when title is absent', () => {
        expect(
            defaultFilename({
                scales: {
                    x: { label: 'Participant Exposure' },
                    y: { label: 'Event Count' },
                },
                mapping: { x: 'raw_x', y: 'raw_y' },
            })
        ).toBe('event-count-by-participant-exposure.png');
    });

    test('falls back from missing scale labels to mappings', () => {
        expect(
            defaultFilename({
                scales: { x: { label: 'Exposure' }, y: {} },
                mapping: { x: 'raw_x', y: 'events' },
            })
        ).toBe('events-by-exposure.png');
    });

    test('uses mappings when labels are explicitly hidden', () => {
        expect(
            defaultFilename({
                scales: { x: { label: '' }, y: { label: '' } },
                mapping: { x: 'exposure', y: 'events' },
            })
        ).toBe('events-by-exposure.png');
    });

    test.each([undefined, null, {}, { mapping: { x: 'only-x' } }])(
        'uses the hard fallback for %p',
        (spec) => {
            expect(defaultFilename(spec)).toBe('points.png');
        }
    );

    test('falls through when sanitization removes the full title', () => {
        expect(
            defaultFilename({
                labels: { title: '***' },
                mapping: { x: 'exposure', y: 'events' },
            })
        ).toBe('events-by-exposure.png');
    });
});
