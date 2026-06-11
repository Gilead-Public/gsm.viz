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
 * Returns the current value of a boolean-style select (yes/no) as a boolean.
 *
 * @param {string} id - element ID
 * @returns {boolean}
 */
function getBoolean(id) {
    return document.getElementById(id).value === 'yes';
}

/**
 * Returns the current dynamic-sizing setting as a boolean.
 *
 * @param {string} id - element ID
 * @returns {boolean}
 */
function getDynamicSizing(id) {
    return getBoolean(id);
}

/**
 * Returns the current value of a number input as a positive integer, or
 * undefined when the field is empty or the value is not a valid positive
 * integer.
 *
 * @param {string} id - element ID
 * @returns {number|undefined}
 */
function getNCategories(id) {
    const val = parseInt(document.getElementById(id).value, 10);
    return Number.isInteger(val) && val >= 1 ? val : undefined;
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
