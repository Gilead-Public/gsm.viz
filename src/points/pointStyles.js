export const POINT_STYLES = [
    'circle',
    'triangle',
    'rect',
    'rectRot',
    'cross',
    'crossRot',
    'star',
    'line',
    'dash',
    'rectRounded',
];

export const MISSING_POINT_STYLE = 'cross';
export const FALLBACK_POINT_STYLES = POINT_STYLES.filter(
    (pointStyle) => pointStyle !== MISSING_POINT_STYLE
);
