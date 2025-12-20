/**
 * Mark Distribution Utilities
 * Calculate distribution of marks across different ranges
 */

/**
 * Calculate mark distribution from marks data
 * @param {Array} marks - Array of mark objects with semester_marks or total_marks
 * @returns {Object} Distribution data for chart
 */
export function calculateMarkDistribution(marks) {
  // Determine if we're dealing with semester marks (0-100) or CA marks (0-60)
  const hasSemesterMarks = marks.some(m => m.semester_marks && m.semester_marks > 0);
  
  // Define ranges based on mark type
  const ranges = hasSemesterMarks
    ? [
        { min: 90, max: 100, label: '90-100', color: 'rgba(34, 197, 94, 0.8)', borderColor: 'rgb(34, 197, 94)' },
        { min: 75, max: 89, label: '75-89', color: 'rgba(59, 130, 246, 0.8)', borderColor: 'rgb(59, 130, 246)' },
        { min: 60, max: 74, label: '60-74', color: 'rgba(168, 85, 247, 0.8)', borderColor: 'rgb(168, 85, 247)' },
        { min: 50, max: 59, label: '50-59', color: 'rgba(249, 115, 22, 0.8)', borderColor: 'rgb(249, 115, 22)' },
        { min: 0, max: 49, label: 'Below 50', color: 'rgba(239, 68, 68, 0.8)', borderColor: 'rgb(239, 68, 68)' }
      ]
    : [
        { min: 55, max: 60, label: '55-60', color: 'rgba(34, 197, 94, 0.8)', borderColor: 'rgb(34, 197, 94)' },
        { min: 46, max: 54, label: '46-54', color: 'rgba(59, 130, 246, 0.8)', borderColor: 'rgb(59, 130, 246)' },
        { min: 37, max: 45, label: '37-45', color: 'rgba(168, 85, 247, 0.8)', borderColor: 'rgb(168, 85, 247)' },
        { min: 28, max: 36, label: '28-36', color: 'rgba(249, 115, 22, 0.8)', borderColor: 'rgb(249, 115, 22)' },
        { min: 0, max: 27, label: 'Below 28', color: 'rgba(239, 68, 68, 0.8)', borderColor: 'rgb(239, 68, 68)' }
      ];

  // Count students in each range - use semester marks if available, otherwise CA average
  const distribution = ranges.map(range => {
    const count = marks.filter(mark => {
      let markValue = 0;
      if (mark.semester_marks && mark.semester_marks > 0) {
        markValue = mark.semester_marks;
      } else if (mark.ca1 || mark.ca2 || mark.ca3) {
        markValue = Math.round((Number(mark.ca1 || 0) + Number(mark.ca2 || 0) + Number(mark.ca3 || 0)) / 3);
      } else {
        markValue = mark.total_marks || 0;
      }
      return markValue >= range.min && markValue <= range.max;
    }).length;
    return { ...range, count };
  });

  return {
    labels: distribution.map(d => d.label),
    datasets: [{
      label: 'No of Counts',
      data: distribution.map(d => d.count),
      backgroundColor: distribution.map(d => d.color),
      borderColor: distribution.map(d => d.borderColor),
      borderWidth: 2
    }],
    distribution // Return full distribution for detailed stats
  };
}

/**
 * Calculate mark distribution for specific subjects
 * @param {Array} marks - Array of mark objects
 * @returns {Object} Subject-wise distribution
 */
export function calculateSubjectDistribution(marks) {
  const subjectMap = {};

  marks.forEach(mark => {
    const subject = mark.subject_name || 'Unknown';
    if (!subjectMap[subject]) {
      subjectMap[subject] = [];
    }
    const markValue = mark.semester_marks || mark.total_marks || 0;
    subjectMap[subject].push(markValue);
  });

  // For each subject, calculate distribution (CA marks: 0-60)
  const ranges = [
    { min: 55, max: 60, label: '55-60' },
    { min: 46, max: 54, label: '46-54' },
    { min: 37, max: 45, label: '37-45' },
    { min: 28, max: 36, label: '28-36' },
    { min: 0, max: 27, label: 'Below 28' }
  ];

  const subjectDistribution = {};
  Object.keys(subjectMap).forEach(subject => {
    const subjectMarks = subjectMap[subject];
    subjectDistribution[subject] = ranges.map(range => 
      subjectMarks.filter(m => m >= range.min && m <= range.max).length
    );
  });

  return subjectDistribution;
}

/**
 * Get distribution statistics summary - CA ONLY for Dashboard
 * @param {Array} marks - Array of mark objects
 * @returns {Object} Statistics based on CA marks only
 */
export function getDistributionStats(marks) {
  // ONLY use CA marks - convert to CA average per subject
  const validMarks = marks
    .map(m => {
      // ONLY use CA components, never semester marks for Dashboard
      if (m.ca1 || m.ca2 || m.ca3) {
        return Math.round((Number(m.ca1 || 0) + Number(m.ca2 || 0) + Number(m.ca3 || 0)) / 3);
      }
      return 0;
    })
    .filter(m => m > 0);

  if (validMarks.length === 0) {
    return { average: 0, highest: 0, lowest: 0, passRate: 0, distinctionRate: 0 };
  }

  const average = Math.round(validMarks.reduce((a, b) => a + b, 0) / validMarks.length * 10) / 10;
  const highest = Math.max(...validMarks);
  const lowest = Math.min(...validMarks);
  // CA Pass: average >= 30
  // CA Distinction: average >= 55 (considered excellent on 0-60 scale)
  const passCount = validMarks.filter(m => m >= 30).length;
  const distinctionCount = validMarks.filter(m => m >= 55).length;
  const passRate = Math.round((passCount / validMarks.length) * 100);
  const distinctionRate = Math.round((distinctionCount / validMarks.length) * 100);

  console.log('[CA STATS DEBUG] CA validMarks:', validMarks);
  console.log('[CA STATS DEBUG] Calculated - Average:', average, 'Highest:', highest, 'Lowest:', lowest, 'Pass Rate (≥30):', passRate, 'Distinction Rate (≥55):', distinctionRate);

  return { average, highest, lowest, passRate, distinctionRate };
}
/**
 * Get distribution statistics summary - SEMESTER ONLY
 * @param {Array} marks - Array of mark objects
 * @returns {Object} Statistics based on semester marks only
 */
export function getSemesterDistributionStats(marks) {
  // ONLY use semester marks
  const validMarks = marks
    .map(m => {
      // ONLY use semester marks, never CA for semester analytics
      if (m.semester_marks && m.semester_marks > 0) {
        return m.semester_marks;
      }
      return 0;
    })
    .filter(m => m > 0);

  if (validMarks.length === 0) {
    return { average: 0, highest: 0, lowest: 0, passRate: 0, distinctionRate: 0 };
  }

  const average = Math.round(validMarks.reduce((a, b) => a + b, 0) / validMarks.length * 10) / 10;
  const highest = Math.max(...validMarks);
  const lowest = Math.min(...validMarks);
  // Semester Pass: mark >= 50
  // Semester Distinction: mark > 90 (strictly greater than)
  const passCount = validMarks.filter(m => m >= 50).length;
  const distinctionCount = validMarks.filter(m => m > 90).length;
  const passRate = Math.round((passCount / validMarks.length) * 100);
  const distinctionRate = Math.round((distinctionCount / validMarks.length) * 100);

  console.log('[SEMESTER STATS DEBUG] Semester validMarks:', validMarks);
  console.log('[SEMESTER STATS DEBUG] Calculated - Average:', average, 'Highest:', highest, 'Lowest:', lowest, 'Pass Rate (≥50):', passRate, 'Distinction Rate (>90):', distinctionRate);

  return { average, highest, lowest, passRate, distinctionRate };
}