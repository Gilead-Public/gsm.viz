import titleCase from './titleCase';

/**
 * Format group attributes for tooltip.
 *
 * @param {Object} group - Group metadata.
 * @param {Object} config - Configuration object.
 *
 * @returns {Array} The tooltip content.
 */
export default function formatGroupTooltipLabel(group, config) {
    if (!group) {
        return [];
    }

    // Format group attribute keys if unspecified.
    const tooltipKeys = ![null, undefined].includes(config.groupTooltipKeys)
        ? config.groupTooltipKeys
        : Object.keys(group)
              // remove attributes created in gsmViz from the tooltip
              .filter(
                  (key) =>
                      [
                          'groupLabel',
                          'GroupLabel',
                          'nRedFlags',
                          'nAmberFlags',
                          'nGreenFlags',
                      ].includes(key) === false
              )
              .reduce((acc, key) => {
                  // title-case key:
                  // - replace underscores with spaces
                  // - insert spaces between camelCase words
                  // - capitalize first letter of each word
                  // - replace 'Id' with 'ID'
                  const label = key
                      .replace(/_/g, ' ')
                      .replace(/([a-z])([A-Z])/g, '$1 $2')
                      .replace(/\b\w/g, (char) => char.toUpperCase())
                      .replace('Id', 'ID');

                  acc[key] = label;

                  return acc;
              }, {});

    // Map group attributes to tooltip content.
    const tooltipContent = [];
    for (const [key, label] of Object.entries(tooltipKeys)) {
        if (group[key] !== undefined) {
            let value = group[key];

            tooltipContent.push(`${label}: ${value}`);
        }
    }

    return tooltipContent;
}
