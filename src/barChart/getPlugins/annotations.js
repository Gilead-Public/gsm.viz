import colorScheme from '../../util/colorScheme.js';

export default function annotations(config) {
    let annotations = null;

    if (config.thresholds) {
        annotations = config.thresholds
            .sort((a, b) => Math.abs(a.Threshold) - Math.abs(b.Threshold))
            .map((x, i) => {
                const content = colorScheme.find((y) =>
                    y.Flag.includes(+x.Flag)
                ).description;

                return {
                    adjustScaleRange: false,
                    borderColor: colorScheme.filter((y) =>
                        y.Flag.includes(+x.Flag)
                    )[0].color,
                    borderDash: [2],
                    borderWidth: 1,
                    label: {
                        backgroundColor: 'white',
                        color: colorScheme.filter((y) =>
                            y.Flag.includes(+x.Flag)
                        )[0].color,
                        content: config.thresholds.descending
                            ? `${content} ↓`
                            : Math.sign(+x.Flag) === 1
                            ? `${content} ↑`
                            : Math.sign(+x.Flag) === -1
                            ? `↓ ${content}`
                            : content,
                        display: true,
                        font: {
                            size: 12,
                        },
                        padding: 2,
                        position: Math.sign(+x.Flag) === 1 ? 'end' : 'start',
                        rotation: 'auto',
                        yValue: x.Threshold,
                        yAdjust: 0,
                    },
                    type: 'line',
                    yMin: x.Threshold,
                    yMax: x.Threshold,
                };
            });
    }

    return annotations;
}
