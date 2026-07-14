/**
 * Calculate a canvas dimension (px) that gives every category adequate space.
 *
 * @param {number} numCategories - number of discrete categories to display
 * @param {number} [pxPerCategory=30] - pixels to allocate per category
 * @returns {number} total size in pixels
 */
export default function getDynamicSize(numCategories, pxPerCategory = 30) {
    return numCategories * pxPerCategory;
}
