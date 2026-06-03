/**
 * Build Chart.js scales configuration from the merged spec.
 *
 * In vertical orientation, the user's x mapping → Chart.js x axis (category),
 * and the user's y mapping → Chart.js y axis (value).
 *
 * In horizontal orientation (coord_flip), axes are swapped:
 * user's x mapping → Chart.js y axis, user's y mapping → Chart.js x axis.
 *
 * @param {Object} spec - merged spec
 * @returns {Object} Chart.js scales config plus _indexAxis
 */
export default function getScales(spec) {
  const { orientation, position, scales: specScales } = spec;
  const horizontal = orientation === "horizontal";
  const stacked = position === "stack";

  const categoryScale = {
    type: specScales.x.type,
    title: {
      display: !!specScales.x.label,
      text: specScales.x.label,
    },
    ...(stacked ? { stacked: true } : {}),
  };

  const valueScale = {
    type: specScales.y.type,
    title: {
      display: !!specScales.y.label,
      text: specScales.y.label,
    },
    beginAtZero: true,
    ...(stacked ? { stacked: true } : {}),
  };

  return {
    x: horizontal ? valueScale : categoryScale,
    y: horizontal ? categoryScale : valueScale,
    _indexAxis: horizontal ? "y" : "x",
  };
}
