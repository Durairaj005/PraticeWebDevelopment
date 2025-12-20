/**
 * Grading System Utility
 * Converts marks (0-100) to grades and provides grade metadata
 * 
 * Grade Scale:
 * 91–100 → O (Outstanding)
 * 81–90  → A+ (Excellent)
 * 71–80  → A (Very Good)
 * 61–70  → B+ (Good)
 * 56–60  → B (Average)
 * 50–55  → C (Satisfactory)
 * Below 50 → RA (Re-Appear)
 */

/**
 * Get grade for a given mark
 * @param {number} mark - Mark value (0-100)
 * @returns {string} Grade (O, A+, A, B+, B, C, RA)
 */
export const getGrade = (mark) => {
  if (mark === null || mark === undefined) return 'NA';
  
  const m = parseFloat(mark);
  
  if (m >= 91) return 'O';
  if (m >= 81) return 'A+';
  if (m >= 71) return 'A';
  if (m >= 61) return 'B+';
  if (m >= 56) return 'B';
  if (m >= 50) return 'C';
  return 'RA';
};

/**
 * Get grade description
 * @param {string} grade - Grade (O, A+, A, B+, B, C, RA)
 * @returns {string} Grade description
 */
export const getGradeDescription = (grade) => {
  const descriptions = {
    'O': 'Outstanding',
    'A+': 'Excellent',
    'A': 'Very Good',
    'B+': 'Good',
    'B': 'Average',
    'C': 'Satisfactory',
    'RA': 'Re-Appear',
    'NA': 'Not Available'
  };
  return descriptions[grade] || 'Unknown';
};

/**
 * Get color for grade for UI display
 * @param {string} grade - Grade (O, A+, A, B+, B, C, RA)
 * @returns {object} Colors object with bg, text, border
 */
export const getGradeColor = (grade) => {
  const colors = {
    'O': {
      bg: 'bg-green-500/20',
      text: 'text-green-400',
      border: 'border-green-500/30',
      bgFull: 'rgba(34, 197, 94, 0.8)',
      hex: '#22c55e'
    },
    'A+': {
      bg: 'bg-emerald-500/20',
      text: 'text-emerald-400',
      border: 'border-emerald-500/30',
      bgFull: 'rgba(16, 185, 129, 0.8)',
      hex: '#10b981'
    },
    'A': {
      bg: 'bg-blue-500/20',
      text: 'text-blue-400',
      border: 'border-blue-500/30',
      bgFull: 'rgba(59, 130, 246, 0.8)',
      hex: '#3b82f6'
    },
    'B+': {
      bg: 'bg-purple-500/20',
      text: 'text-purple-400',
      border: 'border-purple-500/30',
      bgFull: 'rgba(168, 85, 247, 0.8)',
      hex: '#a855f7'
    },
    'B': {
      bg: 'bg-orange-500/20',
      text: 'text-orange-400',
      border: 'border-orange-500/30',
      bgFull: 'rgba(251, 146, 60, 0.8)',
      hex: '#fb923c'
    },
    'C': {
      bg: 'bg-yellow-500/20',
      text: 'text-yellow-400',
      border: 'border-yellow-500/30',
      bgFull: 'rgba(234, 179, 8, 0.8)',
      hex: '#eab308'
    },
    'RA': {
      bg: 'bg-red-500/20',
      text: 'text-red-400',
      border: 'border-red-500/30',
      bgFull: 'rgba(239, 68, 68, 0.8)',
      hex: '#ef4444'
    },
    'NA': {
      bg: 'bg-gray-500/20',
      text: 'text-gray-400',
      border: 'border-gray-500/30',
      bgFull: 'rgba(107, 114, 128, 0.8)',
      hex: '#6b7280'
    }
  };
  return colors[grade] || colors['NA'];
};

/**
 * Get grade range for a given grade
 * @param {string} grade - Grade (O, A+, A, B+, B, C, RA)
 * @returns {string} Mark range (e.g., "91-100")
 */
export const getGradeRange = (grade) => {
  const ranges = {
    'O': '91-100',
    'A+': '81-90',
    'A': '71-80',
    'B+': '61-70',
    'B': '56-60',
    'C': '50-55',
    'RA': 'Below 50',
    'NA': 'N/A'
  };
  return ranges[grade] || 'Unknown';
};

/**
 * Calculate grade distribution from array of marks
 * @param {array} marks - Array of marks
 * @returns {object} Grade count distribution
 */
export const calculateGradeDistribution = (marks) => {
  const distribution = {
    'O': 0,
    'A+': 0,
    'A': 0,
    'B+': 0,
    'B': 0,
    'C': 0,
    'RA': 0
  };

  marks.forEach(mark => {
    const grade = getGrade(mark);
    if (distribution[grade] !== undefined) {
      distribution[grade]++;
    }
  });

  return distribution;
};

/**
 * Get grade statistics from array of marks
 * @param {array} marks - Array of marks
 * @returns {object} Statistics including average, count, distribution
 */
export const getGradeStatistics = (marks) => {
  if (!marks || marks.length === 0) {
    return {
      average: 0,
      highest: 0,
      lowest: 0,
      count: 0,
      distribution: {}
    };
  }

  const validMarks = marks.filter(m => m !== null && m !== undefined);
  const average = validMarks.reduce((sum, m) => sum + m, 0) / validMarks.length;
  const highest = Math.max(...validMarks);
  const lowest = Math.min(...validMarks);
  const distribution = calculateGradeDistribution(validMarks);

  return {
    average: Math.round(average * 100) / 100,
    highest,
    lowest,
    count: validMarks.length,
    distribution
  };
};

/**
 * Format grade display (Grade - Description)
 * @param {string} grade - Grade
 * @returns {string} Formatted grade display
 */
export const formatGradeDisplay = (grade) => {
  return `${grade} (${getGradeDescription(grade)})`;
};

/**
 * Get pass status based on grade
 * @param {string} grade - Grade
 * @returns {boolean} True if passed (not RA)
 */
export const isGradePassed = (grade) => {
  return grade !== 'RA';
};

/**
 * Compare two grades
 * @param {string} grade1 - First grade
 * @param {string} grade2 - Second grade
 * @returns {number} 1 if grade1 > grade2, -1 if grade1 < grade2, 0 if equal
 */
export const compareGrades = (grade1, grade2) => {
  const gradeOrder = { 'O': 7, 'A+': 6, 'A': 5, 'B+': 4, 'B': 3, 'C': 2, 'RA': 1, 'NA': 0 };
  const grade1Value = gradeOrder[grade1] || 0;
  const grade2Value = gradeOrder[grade2] || 0;
  
  if (grade1Value > grade2Value) return 1;
  if (grade1Value < grade2Value) return -1;
  return 0;
};

export default {
  getGrade,
  getGradeDescription,
  getGradeColor,
  getGradeRange,
  calculateGradeDistribution,
  getGradeStatistics,
  formatGradeDisplay,
  isGradePassed,
  compareGrades
};
