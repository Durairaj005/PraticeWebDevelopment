/**
 * Format marks to 2 decimal places
 * @param {number} value - The mark value to format
 * @param {boolean} addPercent - Whether to add % symbol (default: false)
 * @returns {string} Formatted mark (e.g., "75.50" or "75.50%")
 */
export function formatMark(value, addPercent = false) {
  if (value === null || value === undefined) return '-';
  const formatted = parseFloat(value).toFixed(2);
  return addPercent ? `${formatted}%` : formatted;
}

/**
 * Format array of marks to 2 decimal places
 * @param {array} marks - Array of mark values
 * @param {boolean} addPercent - Whether to add % symbol (default: false)
 * @returns {array} Array of formatted marks
 */
export function formatMarks(marks, addPercent = false) {
  if (!Array.isArray(marks)) return [];
  return marks.map(mark => formatMark(mark, addPercent));
}

/**
 * Format marks object (e.g., {ca1: 75.5, ca2: 80.1})
 * @param {object} marksObj - Object with mark properties
 * @param {boolean} addPercent - Whether to add % symbol (default: false)
 * @returns {object} Object with formatted marks
 */
export function formatMarksObject(marksObj, addPercent = false) {
  if (!marksObj || typeof marksObj !== 'object') return marksObj;
  
  const formatted = {};
  Object.keys(marksObj).forEach(key => {
    if (typeof marksObj[key] === 'number') {
      formatted[key] = formatMark(marksObj[key], addPercent);
    } else {
      formatted[key] = marksObj[key];
    }
  });
  return formatted;
}
