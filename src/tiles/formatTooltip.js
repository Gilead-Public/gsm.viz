import { keyOf } from './structureData.js';

/**
 * Build a cell tooltip.
 *
 * `tooltip.formatter(row)` wins over `tooltip.format`. Template placeholders
 * (`{name}`) resolve to the source row field when present, otherwise to the
 * aesthetic aliases (x, y, fill, label, and column for detail cells).
 *
 * @param {Object} tooltip - { format?, formatter? }
 * @param {Object} row - source row
 * @param {Object} aliases - { x, y, fill, label, column? } resolved values
 * @returns {string}
 */
export default function formatTooltip(tooltip, row, aliases) {
    if (typeof tooltip?.formatter === 'function') {
        return keyOf(tooltip.formatter(row));
    }
    if (typeof tooltip?.format === 'string') {
        return tooltip.format.replace(/\{([^{}]+)\}/g, (match, name) =>
            keyOf(
                Object.prototype.hasOwnProperty.call(row, name)
                    ? row[name]
                    : aliases[name]
            )
        );
    }
    // Detail cells also carry the compact column they belong to.
    const x =
        aliases.column === undefined
            ? keyOf(aliases.x)
            : `${keyOf(aliases.column)} ${keyOf(aliases.x)}`;
    const value = keyOf(aliases.label) || keyOf(aliases.fill);
    return `${keyOf(aliases.y)} · ${x}${value ? `: ${value}` : ''}`;
}
