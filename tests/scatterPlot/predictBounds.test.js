import fs from 'fs';
import path from 'path';

import results from '../../examples/data/results.json';
import metricMetadata from '../../examples/data/metricMetadata.json';
import resultsPredicted from '../../examples/data/resultsPredicted.json';

import predictBounds from '../../src/scatterPlot/predictBounds.js';

const MetricID = 'kri0001';
const resultsSubset = results.filter((d) => d.MetricID === MetricID);
const metricMetadatum = metricMetadata.find((d) => d.MetricID === MetricID);

describe('predictBounds()', () => {
    test('generates bounds data from example results input', () => {
        const bounds = predictBounds(resultsSubset, metricMetadatum);

        expect(bounds.length).toBeGreaterThan(0);
        expect(
            bounds.every(
                (d) =>
                    Number.isFinite(d.Threshold) &&
                    Number.isFinite(d.Denominator) &&
                    Number.isFinite(d.LogDenominator) &&
                    Number.isFinite(d.Numerator) &&
                    Number.isFinite(d.Metric)
            )
        ).toBe(true);

        expect(bounds.every((d) => d.Denominator > 0)).toBe(true);
        expect(bounds.every((d) => d.Numerator >= 0)).toBe(true);
    });

    test('uses default thresholds when config threshold is missing', () => {
        const bounds = predictBounds(resultsSubset, {});
        const thresholds = [...new Set(bounds.map((d) => d.Threshold))].sort(
            (a, b) => a - b
        );

        expect(thresholds).toEqual([-3, -2, 0, 2, 3]);
    });

    test('matches expected bounds values from resultsPredicted.csv', () => {
        const csvPath = path.resolve(
            process.cwd(),
            'examples/data/resultsPredicted.csv'
        );
        const csv = fs.readFileSync(csvPath, 'utf8').trim().split(/\r?\n/);

        const headers = csv[0].split(',');
        const metricIndex = headers.indexOf('MetricID');
        const thresholdIndex = headers.indexOf('Threshold');
        const numeratorIndex = headers.indexOf('Numerator');
        const denominatorIndex = headers.indexOf('Denominator');

        const rows = csv.slice(1).map((line) => {
            const values = line.split(',');

            return {
                MetricID: values[metricIndex],
                Threshold: Number(values[thresholdIndex]),
                Numerator: Number(values[numeratorIndex]),
                Denominator: Number(values[denominatorIndex]),
            };
        });

        const targetMetric = 'cou0001';
        const metricRows = rows.filter((d) => d.MetricID === targetMetric);

        const anchor0 = metricRows.find(
            (d) => d.Threshold === 0 && Number.isInteger(d.Denominator)
        );
        const anchor3 = metricRows.find(
            (d) =>
                d.Threshold === 3 &&
                d.Denominator === anchor0.Denominator &&
                Number.isFinite(d.Numerator)
        );

        const vMu = anchor0.Numerator / anchor0.Denominator;
        const metric3 = anchor3.Numerator / anchor3.Denominator;
        const phi =
            (Math.pow((metric3 - vMu) / 3, 2) * anchor3.Denominator) /
            (vMu * (1 - vMu));

        const denominator = anchor0.Denominator;
        const delta = Math.sqrt((phi * vMu * (1 - vMu)) / denominator);

        const syntheticResults = [
            {
                Numerator: (vMu + delta) * denominator,
                Denominator: denominator,
                Metric: vMu + delta,
            },
            {
                Numerator: (vMu - delta) * denominator,
                Denominator: denominator,
                Metric: vMu - delta,
            },
        ];

        const calculated = predictBounds(syntheticResults, {
            Threshold: '-3,-2,2,3',
            AnalysisType: 'binary',
        }).filter((d) => d.Denominator === denominator);

        const expected = metricRows.filter(
            (d) => d.Denominator === denominator
        );

        expected.forEach((row) => {
            const match = calculated.find((d) => d.Threshold === row.Threshold);

            expect(match).toBeDefined();
            expect(match.Numerator).toBeCloseTo(row.Numerator, 6);
        });
    });

    test('matches expected bounds values from resultsPredicted.json', () => {
        const targetMetric = 'cou0001';
        const metricRows = resultsPredicted
            .filter((d) => d.MetricID === targetMetric)
            .map((d) => ({
                Threshold: Number(d.Threshold),
                Numerator: Number(d.Numerator),
                Denominator: Number(d.Denominator),
            }));

        const anchor0 = metricRows.find(
            (d) => d.Threshold === 0 && Number.isInteger(d.Denominator)
        );
        const anchor3 = metricRows.find(
            (d) =>
                d.Threshold === 3 &&
                d.Denominator === anchor0.Denominator &&
                Number.isFinite(d.Numerator)
        );

        const vMu = anchor0.Numerator / anchor0.Denominator;
        const metric3 = anchor3.Numerator / anchor3.Denominator;
        const phi =
            (Math.pow((metric3 - vMu) / 3, 2) * anchor3.Denominator) /
            (vMu * (1 - vMu));

        const denominator = anchor0.Denominator;
        const delta = Math.sqrt((phi * vMu * (1 - vMu)) / denominator);

        const syntheticResults = [
            {
                Numerator: (vMu + delta) * denominator,
                Denominator: denominator,
                Metric: vMu + delta,
            },
            {
                Numerator: (vMu - delta) * denominator,
                Denominator: denominator,
                Metric: vMu - delta,
            },
        ];

        const calculated = predictBounds(syntheticResults, {
            Threshold: '-3,-2,2,3',
            AnalysisType: 'binary',
        }).filter((d) => d.Denominator === denominator);

        const expected = metricRows.filter(
            (d) => d.Denominator === denominator
        );

        expected.forEach((row) => {
            const match = calculated.find((d) => d.Threshold === row.Threshold);

            expect(match).toBeDefined();
            expect(match.Numerator).toBeCloseTo(row.Numerator, 6);
        });
    });

    describe('AnalysisType handling', () => {
        // Poisson/rate data: vMu > 1 triggers negative variance under
        // the binomial formula, so only the Poisson branch produces valid bounds.
        const poissonData = [
            { Numerator: 30, Denominator: 10, Metric: 3.0 },
            { Numerator: 25, Denominator: 10, Metric: 2.5 },
            { Numerator: 35, Denominator: 10, Metric: 3.5 },
        ];

        test('AnalysisType "poisson" uses Poisson variance and produces valid bounds when vMu > 1', () => {
            const bounds = predictBounds(poissonData, {
                AnalysisType: 'poisson',
                Threshold: '-2,2',
            });

            expect(bounds.length).toBeGreaterThan(0);
            expect(
                bounds.every(
                    (d) =>
                        Number.isFinite(d.Metric) &&
                        Number.isFinite(d.Numerator) &&
                        d.Numerator >= 0
                )
            ).toBe(true);
        });

        test('AnalysisType "poisson" is case-insensitive', () => {
            const bounds = predictBounds(poissonData, {
                AnalysisType: 'Poisson',
                Threshold: '-2,2',
            });

            expect(bounds.length).toBeGreaterThan(0);
        });

        test('AnalysisType "identity" returns empty array (no bounds)', () => {
            const bounds = predictBounds(poissonData, {
                AnalysisType: 'identity',
                Threshold: '-2,2',
            });

            expect(bounds).toEqual([]);
        });

        test('missing AnalysisType defaults to binary formula', () => {
            // Binary data with vMu < 1 so the formula is valid.
            const binaryData = [
                { Numerator: 3, Denominator: 10, Metric: 0.3 },
                { Numerator: 5, Denominator: 10, Metric: 0.5 },
            ];
            const bounds = predictBounds(binaryData, {
                Threshold: '-2,2',
            });

            expect(bounds.length).toBeGreaterThan(0);
        });

        test('without "poisson", vMu > 1 data returns empty bounds (binomial goes negative)', () => {
            const bounds = predictBounds(poissonData, {
                Threshold: '-2,2',
            });

            // Binomial formula produces negative variance when vMu > 1,
            // leading to NaN → filtered out → empty.
            expect(bounds).toEqual([]);
        });
    });
});
