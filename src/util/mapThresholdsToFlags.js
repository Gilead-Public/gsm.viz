import { ascending, descending } from 'd3';

export default function mapThresholdsToFlags(_thresholds_) {
    // Capture complete set of thresholds.
    const thresholds = [...new Set(_thresholds_)] // remove duplicate thresholds
        .map((Threshold) => +Threshold);

    // Sort negative thresholds in descending order to impute corresponding Flag.
    const negativeThresholds = thresholds
        .filter((Threshold) => Threshold < 0)
        .sort(descending);
    const negativeFlags = negativeThresholds.map((Threshold, i) => {
        return {
            Threshold,
            Flag: -(i + 1),
        };
    });

    // If more than two negative thresholds present, return null.
    if (negativeThresholds.length > 2) {
        console.warn(
            'More than two negative thresholds present. Threshold annotations will not be displayed.'
        );

        return null;
    }

    // Sort positive thresholds in ascending order to impute corresponding Flag.
    const positiveThresholds = thresholds
        .filter((Threshold) => Threshold > 0)
        .sort(ascending);
    const positiveFlags = positiveThresholds.map((Threshold, i) => {
        return {
            Threshold,
            Flag: i + 1,
        };
    });

    // If more than two positive thresholds present, return null.
    if (positiveThresholds.length > 2) {
        console.warn(
            'More than two positive thresholds present. Threshold annotations will not be displayed.'
        );

        return null;
    }

    // If zero Threshold exists, set Flag to 0.
    const zeroFlag = thresholds
        .filter((Threshold) => Threshold === 0)
        .map((Threshold) => {
            return {
                Threshold,
                Flag: 0,
            };
        });

    // Combine negative and positive thresholds/flags.
    let flags = [...negativeFlags, ...zeroFlag, ...positiveFlags].sort(
        (a, b) => a.Flag - b.Flag
    );
    flags.descending = false;

    // If only positive thresholds are provided and the order of the thresholds is not in ascending
    // order, assume the order matters.
    if (
        negativeThresholds.length === 0 &&
        thresholds.join(',') !==
            thresholds
                .map((threshold) => threshold)
                .sort(ascending)
                .join(',')
    ) {
        flags = thresholds.map((Threshold, i) => {
            return {
                Threshold,
                Flag: i + 1,
            };
        });
        flags.descending = true;
    }

    return flags;
}
