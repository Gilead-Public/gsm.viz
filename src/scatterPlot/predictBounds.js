const defaultThreshold = '-3,-2,2,3';

function parseThresholds(threshold) {
    const parsed = String(threshold ?? defaultThreshold)
        .split(',')
        .map((value) => Number(value.trim()))
        .filter((value) => Number.isFinite(value));

    return parsed.length > 0 ? parsed : [-3, -2, 2, 3];
}

export default function predictBounds(_results_, config) {
    if (Array.isArray(_results_) === false || _results_.length === 0) return [];

    const rows = _results_
        .map((d) => ({
            Numerator: Number(d.Numerator),
            Denominator: Number(d.Denominator),
            Metric: Number(d.Metric),
        }))
        .filter(
            (d) =>
                Number.isFinite(d.Numerator) &&
                Number.isFinite(d.Denominator) &&
                Number.isFinite(d.Metric) &&
                d.Denominator > 0
        );

    if (rows.length === 0) return [];

    const thresholds = [...new Set([...parseThresholds(config?.Threshold), 0])];

    const denominatorMin = Math.min(...rows.map((d) => d.Denominator));
    const denominatorMax = Math.max(...rows.map((d) => d.Denominator));
    const range = denominatorMax - denominatorMin;
    const nStep = Number.isFinite(range) && range !== 0 ? range / 250 : 1;

    const denominatorRange = [];
    const rangeStart = denominatorMin - nStep;
    const rangeEnd = denominatorMax + nStep;

    for (let denominator = rangeStart; denominator <= rangeEnd + nStep / 2; denominator += nStep) {
        if (denominator > 0) denominatorRange.push(denominator);
    }

    const numeratorSum = rows.reduce((sum, d) => sum + d.Numerator, 0);
    const denominatorSum = rows.reduce((sum, d) => sum + d.Denominator, 0);

    if (denominatorSum <= 0) return [];

    const vMu = numeratorSum / denominatorSum;
    const analysisType = config?.AnalysisType === 'rate' ? 'rate' : 'binary';

    const phiTerms = rows.map((d) => {
        const variance =
            analysisType === 'rate'
                ? vMu / d.Denominator
                : (vMu * (1 - vMu)) / d.Denominator;

        if (variance <= 0) return Number.NaN;

        const score = (d.Metric - vMu) / Math.sqrt(variance);

        return score * score;
    });

    const finitePhiTerms = phiTerms.filter((term) => Number.isFinite(term));
    if (finitePhiTerms.length === 0) return [];

    const phi =
        finitePhiTerms.reduce((sum, term) => sum + term, 0) /
        finitePhiTerms.length;

    const bounds = [];

    thresholds.forEach((threshold) => {
        denominatorRange.forEach((denominator) => {
            const variance =
                analysisType === 'rate'
                    ? (phi * vMu) / denominator
                    : (phi * vMu * (1 - vMu)) / denominator;

            if (variance < 0) return;

            const Metric = vMu + threshold * Math.sqrt(variance);
            const Numerator = Metric * denominator;

            if (Numerator < 0 || Number.isFinite(Numerator) === false) return;

            bounds.push({
                Threshold: threshold,
                Denominator: denominator,
                LogDenominator: Math.log(denominator),
                Numerator,
                Metric,
            });
        });
    });

    return bounds;
}