/**
 * Build Chart.js annotation plugin line annotations from spec.annotations.referenceLines.
 *
 * Lines are orientation-aware:
 *   - vertical chart  → horizontal line (yMin/yMax on the value axis)
 *   - horizontal chart → vertical line  (xMin/xMax on the value axis)
 *
 * @param {Object} spec - merged spec
 * @returns {Array|null} array of annotation configs, or null when none are defined
 */
export default function referenceLines(spec) {
    const lines = spec.annotations?.referenceLines;

    if (!Array.isArray(lines) || lines.length === 0) return null;

    const isHorizontal = spec.orientation === 'horizontal';

    return lines.map((line) => {
        const color = line.color ?? '#666666';

        const annotation = {
            type: 'line',
            adjustScaleRange: false,
            borderColor: color,
            borderWidth: line.lineWidth ?? 1,
            borderDash: line.lineDash ?? [],
        };

        if (isHorizontal) {
            annotation.xMin = line.value;
            annotation.xMax = line.value;
        } else {
            annotation.yMin = line.value;
            annotation.yMax = line.value;
        }

        if (line.label) {
            annotation.label = {
                display: true,
                content: line.label,
                color,
                backgroundColor: 'white',
                position: line.labelPosition ?? 'end',
                rotation: 'auto',
                font: { size: 12 },
                padding: 2,
            };
        }

        return annotation;
    });
}
