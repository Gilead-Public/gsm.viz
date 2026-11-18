/**
 * Create an element with a class and, optionally, text content.
 *
 * @param {string} tag - element name
 * @param {string} className - class attribute
 * @param {string} [text] - text content
 * @returns {HTMLElement}
 */
export default function makeElement(tag, className, text) {
    const el = document.createElement(tag);
    el.className = className;
    if (text !== undefined) el.textContent = text;
    return el;
}
