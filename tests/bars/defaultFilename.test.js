import defaultFilename from '../../src/bars/defaultFilename.js';

describe('defaultFilename', () => {
    describe('priority 1 — spec.labels.title', () => {
        test('uses title when present', () => {
            expect(
                defaultFilename({ labels: { title: 'Retention Status by Site' } })
            ).toBe('retention-status-by-site.png');
        });

        test('lowercases the title', () => {
            expect(defaultFilename({ labels: { title: 'MY CHART' } })).toBe(
                'my-chart.png'
            );
        });

        test('strips characters invalid in filenames', () => {
            expect(
                defaultFilename({ labels: { title: 'KRI: Flag/Count (2024)' } })
            ).toBe('kri-flagcount-2024.png');
        });

        test('trims leading and trailing whitespace', () => {
            expect(
                defaultFilename({ labels: { title: '  my chart  ' } })
            ).toBe('my-chart.png');
        });

        test('replaces multiple spaces with a single dash', () => {
            expect(
                defaultFilename({ labels: { title: 'a  b   c' } })
            ).toBe('a-b-c.png');
        });
    });

    describe('priority 2 — spec.scales.fill.label by spec.scales.x.label', () => {
        test('uses fill label by x label when title is absent', () => {
            expect(
                defaultFilename({
                    scales: {
                        fill: { label: 'Retention Status' },
                        x: { label: 'Site ID' },
                    },
                })
            ).toBe('retention-status-by-site-id.png');
        });

        test('does not use this priority when fill label is missing', () => {
            const result = defaultFilename({
                scales: { x: { label: 'Site ID' } },
                mapping: { x: 'invid' },
            });
            expect(result).toBe('invid.png');
        });

        test('does not use this priority when x label is missing', () => {
            const result = defaultFilename({
                scales: { fill: { label: 'Flag' } },
                mapping: { x: 'MetricID' },
            });
            expect(result).toBe('metricid.png');
        });

        test('sanitizes both parts', () => {
            expect(
                defaultFilename({
                    scales: {
                        fill: { label: 'Flag (Status)' },
                        x: { label: 'Metric ID' },
                    },
                })
            ).toBe('flag-status-by-metric-id.png');
        });
    });

    describe('priority 3 — spec.mapping.fill by spec.mapping.x', () => {
        test('uses fill+x mapping when title and scale labels are absent', () => {
            expect(
                defaultFilename({
                    mapping: { fill: 'Flag', x: 'MetricID' },
                })
            ).toBe('flag-by-metricid.png');
        });

        test('uses only x mapping when fill mapping is absent', () => {
            expect(
                defaultFilename({
                    mapping: { x: 'invid' },
                })
            ).toBe('invid.png');
        });

        test('sanitizes mapping keys', () => {
            expect(
                defaultFilename({
                    mapping: { fill: 'My Fill', x: 'My X' },
                })
            ).toBe('my-fill-by-my-x.png');
        });
    });

    describe('hard fallback', () => {
        test('returns "bars.png" when spec is empty', () => {
            expect(defaultFilename({})).toBe('bars.png');
        });

        test('returns "bars.png" when spec is null', () => {
            expect(defaultFilename(null)).toBe('bars.png');
        });

        test('returns "bars.png" when spec is undefined', () => {
            expect(defaultFilename(undefined)).toBe('bars.png');
        });

        test('returns "bars.png" when mapping.x is also absent', () => {
            expect(defaultFilename({ mapping: {} })).toBe('bars.png');
        });
    });

    describe('title takes priority over scale labels', () => {
        test('prefers title over fill-by-x scale labels', () => {
            expect(
                defaultFilename({
                    labels: { title: 'My Chart' },
                    scales: {
                        fill: { label: 'Flag' },
                        x: { label: 'Metric' },
                    },
                })
            ).toBe('my-chart.png');
        });
    });

    describe('scale labels take priority over mapping', () => {
        test('prefers fill+x scale labels over mapping', () => {
            expect(
                defaultFilename({
                    scales: {
                        fill: { label: 'Flag' },
                        x: { label: 'Metric' },
                    },
                    mapping: { fill: 'rawFill', x: 'rawX' },
                })
            ).toBe('flag-by-metric.png');
        });
    });
});
