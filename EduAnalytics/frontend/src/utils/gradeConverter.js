/**
 * Grade Conversion Utility for Frontend
 * Converts between marks (0-100) and letter grades
 * Matches backend grading scheme exactly
 */

export const GRADE_SCHEME = {
  'O': { min: 91, max: 100, description: 'Outstanding' },
  'A+': { min: 81, max: 90, description: 'Excellent' },
  'A': { min: 71, max: 80, description: 'Very Good' },
  'B+': { min: 61, max: 70, description: 'Good' },
  'B': { min: 56, max: 60, description: 'Average' },
  'C': { min: 50, max: 55, description: 'Satisfactory' },
  'RA': { min: 0, max: 49, description: 'Re-Appear' }
};

/**
 * Convert numeric marks to letter grade
 * @param {number} marks - Marks between 0-100
 * @returns {string} Letter grade (O, A+, A, B+, B, C, RA)
 */
export const getGradeFromMarks = (marks) => {
  if (marks === null || marks === undefined || marks === '') {
    return '';
  }

  const numMarks = parseFloat(marks);
  
  if (isNaN(numMarks)) {
    return '';
  }

  if (numMarks >= 91) return 'O';
  if (numMarks >= 81) return 'A+';
  if (numMarks >= 71) return 'A';
  if (numMarks >= 61) return 'B+';
  if (numMarks >= 56) return 'B';
  if (numMarks >= 50) return 'C';
  return 'RA';
};

/**
 * Get grade description
 * @param {string} grade - Letter grade
 * @returns {string} Full description
 */
export const getGradeDescription = (grade) => {
  if (!grade || !GRADE_SCHEME[grade]) {
    return '';
  }
  const scheme = GRADE_SCHEME[grade];
  return `${grade} (${scheme.min}-${scheme.max}) - ${scheme.description}`;
};

/**
 * Validate if a grade is passing (not RA)
 * @param {string} grade - Letter grade
 * @returns {boolean} True if passing, false if RA or empty
 */
export const isPassGrade = (grade) => {
  if (!grade) return false;
  return grade.toUpperCase() !== 'RA';
};

/**
 * Get color for grade display
 * @param {string} grade - Letter grade
 * @returns {string} Tailwind color class
 */
export const getGradeColor = (grade) => {
  if (!grade) return 'text-gray-500';
  
  const gradeUpper = grade.toUpperCase();
  switch (gradeUpper) {
    case 'O':
      return 'text-green-600 font-bold';
    case 'A+':
      return 'text-green-500 font-bold';
    case 'A':
      return 'text-blue-600 font-semibold';
    case 'B+':
      return 'text-blue-500 font-semibold';
    case 'B':
      return 'text-yellow-600 font-semibold';
    case 'C':
      return 'text-orange-500';
    case 'RA':
      return 'text-red-600 font-bold';
    default:
      return 'text-gray-500';
  }
};

/**
 * Get background color for grade badge
 * @param {string} grade - Letter grade
 * @returns {string} Tailwind bg color class
 */
export const getGradeBgColor = (grade) => {
  if (!grade) return 'bg-gray-100';
  
  const gradeUpper = grade.toUpperCase();
  switch (gradeUpper) {
    case 'O':
      return 'bg-green-100';
    case 'A+':
      return 'bg-green-50';
    case 'A':
      return 'bg-blue-100';
    case 'B+':
      return 'bg-blue-50';
    case 'B':
      return 'bg-yellow-100';
    case 'C':
      return 'bg-orange-100';
    case 'RA':
      return 'bg-red-100';
    default:
      return 'bg-gray-100';
  }
};

/**
 * Get all valid grades
 * @returns {array} Array of grade strings
 */
export const getAllGrades = () => {
  return Object.keys(GRADE_SCHEME);
};
