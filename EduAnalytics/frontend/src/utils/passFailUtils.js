/**
 * Pass/Fail Utility Functions
 * 
 * Pass Criteria:
 * - CA marks: Average >= 30 (CA1+CA2+CA3)/3 >= 30
 * - Semester marks: >= 50 out of 100 per subject
 */

/**
 * Check if a student passed in a subject based on CA marks
 * @param {number} ca1 - CA1 marks (out of 50)
 * @param {number} ca2 - CA2 marks (out of 50)
 * @param {number} ca3 - CA3 marks (out of 50)
 * @returns {boolean} - True if passed (average >= 30)
 */
export const isPassedCA = (ca1, ca2, ca3) => {
  if (ca1 === undefined || ca2 === undefined || ca3 === undefined) return false;
  const avg = (ca1 + ca2 + ca3) / 3;
  // Pass if average >= 30
  return avg >= 30;
};

/**
 * Check if a student passed in a subject based on Semester marks
 * @param {number} semester - Semester marks (out of 100)
 * @returns {boolean} - True if passed (>= 50)
 */
export const isPassedSemester = (semester) => {
  if (semester === undefined || semester === null || semester === 0) return false;
  // Pass if semester >= 50 (out of 100)
  return semester >= 50;
};

/**
 * Determine overall subject pass/fail status
 * A subject is considered passed if:
 * - CA average >= 30 AND (no semester data OR semester >= 50)
 * @param {number} ca1 - CA1 marks (out of 50)
 * @param {number} ca2 - CA2 marks (out of 50)
 * @param {number} ca3 - CA3 marks (out of 50)
 * @param {number} semester - Semester marks (optional, out of 100)
 * @returns {boolean} - True if passed overall
 */
export const isSubjectPassed = (ca1, ca2, ca3, semester = null) => {
  const caAvg = (ca1 + ca2 + ca3) / 3;
  
  // Check CA criteria: average >= 30
  if (caAvg < 30) return false;
  
  // If semester data exists, check semester criteria
  if (semester && semester > 0) {
    return semester >= 50;
  }
  
  // If no semester data, just CA passing is sufficient
  return true;
};

/**
 * Count subjects passed in a batch or student's subject list
 * @param {Array} subjects - Array of subject objects with ca1, ca2, ca3, semester properties
 * @returns {number} - Count of passed subjects
 */
export const countPassedSubjects = (subjects) => {
  if (!Array.isArray(subjects)) return 0;
  
  return subjects.reduce((count, subject) => {
    if (isSubjectPassed(subject.ca1, subject.ca2, subject.ca3, subject.semester)) {
      count++;
    }
    return count;
  }, 0);
};

/**
 * Count subjects failed in a batch or student's subject list
 * @param {Array} subjects - Array of subject objects with ca1, ca2, ca3, semester properties
 * @returns {number} - Count of failed subjects
 */
export const countFailedSubjects = (subjects) => {
  if (!Array.isArray(subjects)) return 0;
  return subjects.length - countPassedSubjects(subjects);
};

/**
 * Calculate pass/fail rate for a batch of students
 * @param {Array} students - Array of student objects, each with subjects array
 * @returns {Object} - { passCount, failCount, passPercentage, failPercentage }
 */
export const calculateBatchPassFailRate = (students) => {
  if (!Array.isArray(students) || students.length === 0) {
    return { passCount: 0, failCount: 0, passPercentage: 0, failPercentage: 0 };
  }
  
  let passCount = 0;
  let failCount = 0;
  
  students.forEach(student => {
    const passedSubjects = countPassedSubjects(student.subjects || []);
    const totalSubjects = (student.subjects || []).length;
    
    // A student passes if they pass all subjects
    if (passedSubjects === totalSubjects && totalSubjects > 0) {
      passCount++;
    } else {
      failCount++;
    }
  });
  
  const total = passCount + failCount;
  const passPercentage = total > 0 ? (passCount / total) * 100 : 0;
  const failPercentage = total > 0 ? (failCount / total) * 100 : 0;
  
  return { passCount, failCount, passPercentage, failPercentage };
};

/**
 * Get detailed pass/fail analysis for subjects in a batch
 * @param {Array} subjects - Array of subjects with marks
 * @param {Array} students - Array of students (optional, for batch analysis)
 * @returns {Array} - Array of subjects with their pass/fail stats
 */
export const getSubjectPassFailStats = (subjects = []) => {
  return subjects.map(subject => {
    const caAverage = (subject.ca1 + subject.ca2 + subject.ca3) / 3;
    const caPass = caAverage >= 30;
    const semesterPass = subject.semester ? subject.semester >= 45 : null;
    const overallPass = isSubjectPassed(subject.ca1, subject.ca2, subject.ca3, subject.semester);
    
    return {
      name: subject.name,
      caAverage: caAverage.toFixed(1),
      semesterMarks: subject.semester,
      caPass,
      semesterPass,
      overallPass
    };
  });
};
