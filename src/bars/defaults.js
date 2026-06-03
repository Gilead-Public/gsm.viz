/**
 * Default spec values for the bars module.
 * Mirrors ggplot2 defaults where applicable.
 */
const defaults = {
  orientation: "vertical",
  position: "stack",
  scales: {
    x: {
      type: "category",
      label: null,
    },
    y: {
      type: "linear",
      label: null,
    },
    fill: {},
  },
  labels: {},
  theme: {
    maintainAspectRatio: false,
    animation: false,
  },
};

export default defaults;
