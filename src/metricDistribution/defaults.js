export const VALUES = ['count', 'percent', 'percentOfDenominator'];

export const NOT_RECORDED = 'Not recorded';

const defaults = {
    topN: Infinity,
    theme: {
        // The first and the grey colour of the library's categorical palette
        // (see src/bars/defaults.js).
        barColor: '#4e79a7',
        neutralColor: '#bab0ac',
    },
};

export default defaults;

export const MESSAGES = {
    missing: 'Breakdowns are not available for this metric.',
    empty: 'There are no records to break down.',
    emptySection: 'There are no records in this breakdown.',
};

// Text colours with at least 4.5:1 contrast on white.
export const TEXT_COLORS = {
    primary: '#222222',
    muted: '#5f6368',
};
