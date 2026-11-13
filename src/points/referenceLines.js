/**
 * Build annotation-plugin configuration for point reference lines.
 *
 * @param {Object} spec - Merged points specification.
 * @returns {Array|null} Annotation-plugin line configurations.
 */
export default function referenceLines(spec) {
    const lines = spec.annotations?.referenceLines;
    if (!lines?.length) return null;

    return lines.map((line) => {
        const color = line.color ?? '#666666';
        const annotation = {
            type: 'line',
            adjustScaleRange: true,
            borderColor: color,
            borderWidth: line.width ?? 1,
            borderDash: line.dash ? [...line.dash] : [],
            [`${line.axis}Min`]: line.value,
            [`${line.axis}Max`]: line.value,
        };

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
