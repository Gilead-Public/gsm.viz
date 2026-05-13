/**
 * Build Chart.js plugins configuration from the merged spec.
 *
 * @param {Object} spec - merged spec
 * @returns {Object} Chart.js plugins config
 */
export default function getPlugins(spec) {
  const { labels } = spec;

  return {
    title: {
      display: !!labels.title,
      text: labels.title || "",
    },
    tooltip: {
      enabled: true,
    },
    legend: {
      display: !!spec.mapping.fill,
    },
    datalabels: {
      display: false,
    },
  };
}
