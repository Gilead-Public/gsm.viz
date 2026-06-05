/**
 * Returns the current value of a select element.
 *
 * @param {string} id - element ID
 * @returns {string}
 */
function getValue(id) {
    return document.getElementById(id).value;
}

/**
 * Returns the current dynamic-sizing setting as a boolean.
 *
 * @param {string} id - element ID
 * @returns {boolean}
 */
function getDynamicSizing(id) {
    return document.getElementById(id).value === 'yes';
}

/**
 * Attaches a 'change' listener on each listed element ID that calls fn.
 *
 * @param {string[]} ids - element IDs to listen on
 * @param {Function} fn  - callback to invoke on any change
 */
function onAnyChange(ids, fn) {
    ids.forEach((id) =>
        document.getElementById(id).addEventListener('change', fn)
    );
}
