import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Navbar from '../../components/common/Navbar';
import Sidebar from '../../components/common/Sidebar';
import BarChart from '../../components/charts/BarChart';
import DoughnutChart from '../../components/charts/DoughnutChart';
import LineChart from '../../components/charts/LineChart';
import { FaChartPie, FaBookOpen, FaChartLine } from 'react-icons/fa';
import { getGrade, getGradeColor } from '../../utils/gradeUtils';
import { getSemesterDistributionStats } from '../../utils/markDistribution';

export default function ClassPerformance() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [studentData, setStudentData] = useState(null);
  const [classData, setClassData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [hasSemesterData, setHasSemesterData] = useState(false);
  const [gradeStats, setGradeStats] = useState({});
  const [semesterStats, setSemesterStats] = useState({});

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token');
        const batch = localStorage.getItem('batch') || '2024';
        
        if (token) {
          // Fetch student's own dashboard data FIRST to get sem_published flag
          let semPublished = false;
          const response = await fetch(
            `http://localhost:8000/api/v1/student/dashboard`,
            { headers: { 'Authorization': `Bearer ${token}` } }
          );

          if (response.ok) {
            const data = await response.json();
            setStudentData(data);
            semPublished = data?.sem_published || false;
          }

          // Fetch all students in batch for class statistics
          const classRes = await fetch(
            `http://localhost:8000/api/v1/admin/all-students?batch_year=${batch}`
          );
          
          if (classRes.ok) {
            const classInfo = await classRes.json();
            
            // Get marks for all students to calculate class average and grade distribution
            let allStudentAverages = [];
            let allMarks = [];
            let gradeCount = { A: 0, B: 0, C: 0, D: 0, F: 0 };
            let hasSemesterData = false;
            
            for (const student of classInfo.students) {
              const marksRes = await fetch(
                `http://localhost:8000/api/v1/admin/students/${student.student_id}/marks`
              );
              
              if (marksRes.ok) {
                const marksData = await marksRes.json();
                if (marksData.marks && marksData.marks.length > 0) {
                  // Collect all marks for class average by subject calculation
                  allMarks = allMarks.concat(marksData.marks);
                  
                  // Check if ANY semester marks exist
                  if (marksData.marks.some(m => m.semester_marks != null && m.semester_marks > 0)) {
                    hasSemesterData = true;
                  }
                  
                  const avg = marksData.marks.reduce((sum, m) => {
                    // ONLY use semester marks if sem_published is true
                    let subjectAvg;
                    if (semPublished && m.semester_marks != null && m.semester_marks > 0) {
                      // Use ONLY semester marks when semester is published
                      subjectAvg = m.semester_marks;
                    } else {
                      // Use CA average only
                      subjectAvg = ((m.ca1 || 0) + (m.ca2 || 0) + (m.ca3 || 0)) / 3;
                    }
                    return sum + subjectAvg;
                  }, 0) / marksData.marks.length;
                  
                  allStudentAverages.push(avg);
                  
                  // Grade assignment: A>=80, B>=70, C>=60, D>=50, F<50
                  if (avg >= 80) gradeCount.A++;
                  else if (avg >= 70) gradeCount.B++;
                  else if (avg >= 60) gradeCount.C++;
                  else if (avg >= 50) gradeCount.D++;
                  else gradeCount.F++;
                }
              }
            }
            
            const classAverage = allStudentAverages.length > 0 
              ? (allStudentAverages.reduce((a, b) => a + b, 0) / allStudentAverages.length).toFixed(1)
              : 0;
            
            setClassData({
              totalStudents: classInfo.students.length,
              classAverage: classAverage,
              gradeDistribution: gradeCount,
              allAverages: allStudentAverages,
              allMarks: allMarks,
              hasSemesterData: hasSemesterData
            });
            
            // Calculate grade stats by counting each subject grade (not student average)
            const gradeDistribution = {};
            ['O', 'A+', 'A', 'B+', 'B', 'C', 'RA'].forEach(grade => {
              gradeDistribution[grade] = 0;
            });
            
            // Count grades for each subject mark in the class
            allMarks.forEach(mark => {
              const subjectGrade = semPublished && mark.semester_marks != null && mark.semester_marks > 0
                ? getGrade(mark.semester_marks)
                : getGrade(((mark.ca1 || 0) + (mark.ca2 || 0) + (mark.ca3 || 0)) / 3);
              
              if (subjectGrade in gradeDistribution) {
                gradeDistribution[subjectGrade]++;
              }
            });
            
            const totalSubjectGrades = allMarks.length;
            
            console.log('[ClassPerformance] Calculated gradeStats:', {
              distribution: gradeDistribution,
              total: totalSubjectGrades,
              semPublished,
              hasSemesterData,
              allMarks: allMarks.length
            });
            
            setGradeStats({
              distribution: gradeDistribution,
              total: totalSubjectGrades
            });
            
            // Calculate semester statistics
            const semesterStatsData = getSemesterDistributionStats(allMarks);
            setSemesterStats(semesterStatsData);
            
            setHasSemesterData(hasSemesterData);
          }
        }
      } catch (err) {
        console.error('Failed to fetch data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Calculate student's rank - USE THE CORRECT RANK FROM DASHBOARD
  const studentRank = studentData && studentData.rank ? studentData.rank : 'N/A';

  // Fetch student marks separately for "My vs Class Average" chart
  const [studentMarks, setStudentMarks] = useState([]);
  
  useEffect(() => {
    const fetchStudentMarks = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;
        
        const response = await fetch(
          'http://localhost:8000/api/v1/student/marks',
          { headers: { 'Authorization': `Bearer ${token}` } }
        );
        
        if (response.ok) {
          const data = await response.json();
          if (data.marks) {
            setStudentMarks(data.marks);
          }
        }
      } catch (err) {
        console.error('Error fetching student marks:', err);
      }
    };
    
    fetchStudentMarks();
  }, []);

  const subjects = studentMarks?.map(m => {
    // If semester is published, use ONLY semester mark; otherwise use CA average
    const markValue = (studentData?.sem_published && m.semester_marks != null && m.semester_marks > 0) 
      ? m.semester_marks 
      : Math.round(((m.ca1 || 0) + (m.ca2 || 0) + (m.ca3 || 0)) / 3);
    
    return {
      name: m.subject_name,
      myAvg: markValue,
      semester_marks: m.semester_marks,
      ca_marks: Math.round(((m.ca1 || 0) + (m.ca2 || 0) + (m.ca3 || 0)) / 3)
    };
  }) || [];

  // Calculate semester average for the current student
  const semesterAvg = studentData?.sem_published && studentMarks && studentMarks.length > 0
    ? Math.round((studentMarks.reduce((sum, m) => sum + (m.semester_marks || 0), 0) / studentMarks.length) * 10) / 10
    : null;

  // Calculate class average for each subject - use semester if published, CA otherwise
  const classAverageBySubject = classData && classData.allMarks ? 
    classData.allMarks.reduce((acc, mark) => {
      const subjectName = mark.subject_name;
      if (!acc[subjectName]) {
        acc[subjectName] = { total: 0, count: 0 };
      }
      // Use semester marks if published, otherwise CA
      const avgValue = (studentData?.sem_published && mark.semester_marks != null && mark.semester_marks > 0)
        ? mark.semester_marks
        : ((mark.ca1 || 0) + (mark.ca2 || 0) + (mark.ca3 || 0)) / 3;
      acc[subjectName].total += avgValue;
      acc[subjectName].count += 1;
      return acc;
    }, {})
    : {};

  console.log('[ClassPerformance] classData:', classData);
  console.log('[ClassPerformance] classAverageBySubject:', classAverageBySubject);

  const classAverageData = subjects.length > 0 ? {
    labels: subjects.map(s => s.name),
    datasets: [
      {
        label: 'My Mark',
        data: subjects.map(s => s.myAvg),
        type: 'bar',
        backgroundColor: 'rgba(186, 51, 211, 0.85)',
        borderColor: 'rgba(147, 20, 184, 1)',
        borderWidth: 2,
        yAxisID: 'y'
      },
      {
        label: 'Class Average',
        data: subjects.map(s => classAverageBySubject[s.name] ? Math.round(classAverageBySubject[s.name].total / classAverageBySubject[s.name].count) : 0),
        type: 'line',
        borderColor: 'rgba(220, 38, 38, 1)',
        backgroundColor: 'rgba(220, 38, 38, 0.1)',
        borderWidth: 3,
        fill: false,
        tension: 0.4,
        pointRadius: 6,
        pointBackgroundColor: 'rgba(220, 38, 38, 1)',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        yAxisID: 'y'
      }
    ]
  } : {
    labels: [],
    datasets: []
  };

  const gradeDistribution = studentMarks && studentMarks.length > 0 ? {
    labels: ['O (91+)', 'A+ (81-90)', 'A (71-80)', 'B+ (61-70)', 'B (56-60)', 'C (50-55)', 'RA (<50)'],
    datasets: [{
      data: (() => {
        const studentGradeCounts = { O: 0, 'A+': 0, A: 0, 'B+': 0, B: 0, C: 0, RA: 0 };
        
        // Count grades for each subject the student has
        studentMarks.forEach(mark => {
          const markValue = (studentData?.sem_published && mark.semester_marks != null && mark.semester_marks > 0)
            ? mark.semester_marks
            : ((mark.ca1 || 0) + (mark.ca2 || 0) + (mark.ca3 || 0)) / 3;
          
          const grade = getGrade(markValue);
          if (grade in studentGradeCounts) {
            studentGradeCounts[grade]++;
          }
        });
        
        return [
          studentGradeCounts.O,
          studentGradeCounts['A+'],
          studentGradeCounts.A,
          studentGradeCounts['B+'],
          studentGradeCounts.B,
          studentGradeCounts.C,
          studentGradeCounts.RA
        ];
      })(),
      backgroundColor: [
        'rgba(34, 197, 94, 0.8)',    // O - Green
        'rgba(16, 185, 129, 0.8)',   // A+ - Emerald
        'rgba(59, 130, 246, 0.8)',   // A - Blue
        'rgba(168, 85, 247, 0.8)',   // B+ - Purple
        'rgba(251, 146, 60, 0.8)',   // B - Orange
        'rgba(234, 179, 8, 0.8)',    // C - Yellow
        'rgba(239, 68, 68, 0.8)'     // RA - Red
      ]
    }]
  } : {
    labels: [],
    datasets: []
  };

  // CA vs Semester Comparison Data
  const caVsSemesterData = studentMarks && studentMarks.length > 0 ? {
    labels: studentMarks.map(m => m.subject_name),
    datasets: [
      {
        label: 'CA Average',
        data: studentMarks.map(m => Math.round(((m.ca1 || 0) + (m.ca2 || 0) + (m.ca3 || 0)) / 3)),
        backgroundColor: 'rgba(249, 115, 22, 0.7)',
        borderColor: 'rgba(249, 115, 22, 1)',
        borderWidth: 1
      },
      ...(studentMarks.some(m => m.semester_marks && m.semester_marks > 0) ? [{
        label: 'Semester',
        data: studentMarks.map(m => m.semester_marks || 0),
        backgroundColor: 'rgba(59, 130, 246, 0.7)',
        borderColor: 'rgba(59, 130, 246, 1)',
        borderWidth: 1
      }] : [])
    ]
  } : { labels: [], datasets: [] };

  // Subject-wise Semester Comparison Data
  const subjectComparison = studentMarks && studentMarks.length > 0 ? {
    labels: studentMarks.map(m => m.subject_name),
    datasets: [
      {
        label: 'CA1',
        data: studentMarks.map(m => m.ca1 || 0),
        backgroundColor: 'rgba(249, 115, 22, 0.7)'
      },
      {
        label: 'CA2',
        data: studentMarks.map(m => m.ca2 || 0),
        backgroundColor: 'rgba(168, 85, 247, 0.7)'
      },
      {
        label: 'CA3',
        data: studentMarks.map(m => m.ca3 || 0),
        backgroundColor: 'rgba(34, 197, 94, 0.7)'
      },
      ...(studentMarks.some(m => m.semester_marks && m.semester_marks > 0) ? [{
        label: 'Semester',
        data: studentMarks.map(m => m.semester_marks ? (m.semester_marks / 100 * 50) : 0),
        backgroundColor: 'rgba(59, 130, 246, 0.7)'
      }] : [])
    ]
  } : { labels: [], datasets: [] };

  // Chart 1: Student vs Class Grade Distribution Comparison
  const studentGradeDistribution = {};
  ['O', 'A+', 'A', 'B+', 'B', 'C', 'RA'].forEach(grade => {
    studentGradeDistribution[grade] = 0;
  });
  
  if (studentMarks && studentMarks.length > 0) {
    studentMarks.forEach(mark => {
      // Use semester marks if published, otherwise CA
      const avg = (studentData?.sem_published && mark.semester_marks != null && mark.semester_marks > 0)
        ? mark.semester_marks
        : ((mark.ca1 || 0) + (mark.ca2 || 0) + (mark.ca3 || 0)) / 3;
      const grade = getGrade(avg);
      if (grade in studentGradeDistribution) {
        studentGradeDistribution[grade]++;
      }
    });
  }

  const studentVsClassGradeData = {
    labels: ['O', 'A+', 'A', 'B+', 'B', 'C', 'RA'],
    datasets: [
      {
        label: 'My Grade Count',
        data: ['O', 'A+', 'A', 'B+', 'B', 'C', 'RA'].map(g => studentGradeDistribution[g] || 0),
        backgroundColor: 'rgba(168, 85, 247, 0.7)',
        borderColor: 'rgba(168, 85, 247, 1)',
        borderWidth: 2
      },
      {
        label: 'Class Distribution',
        data: ['O', 'A+', 'A', 'B+', 'B', 'C', 'RA'].map(g => gradeStats.distribution?.[g] || 0),
        backgroundColor: 'rgba(34, 197, 94, 0.4)',
        borderColor: 'rgba(34, 197, 94, 1)',
        borderWidth: 2
      }
    ]
  };

  // Chart 2: Subject Performance with Grade Indicators (Animated Line)
  // Calculate maximum grade per subject for the class (highest grade achieved by any student)
  const classMaxGradeBySubject = classData && classData.allMarks && classData.allMarks.length > 0 ? 
    classData.allMarks.reduce((acc, mark) => {
      const subjectName = mark.subject_name;
      if (!acc[subjectName]) {
        acc[subjectName] = [];
      }
      // Get the mark value (semester if published, otherwise CA)
      const markValue = (studentData?.sem_published && mark.semester_marks != null && mark.semester_marks > 0)
        ? mark.semester_marks
        : ((mark.ca1 || 0) + (mark.ca2 || 0) + (mark.ca3 || 0)) / 3;
      acc[subjectName].push(markValue);
      return acc;
    }, {}) : {};
  
  const classMaxGrades = Object.keys(classMaxGradeBySubject).reduce((acc, subject) => {
    const marks = classMaxGradeBySubject[subject];
    const maxMark = Math.max(...marks);
    acc[subject] = getGrade(maxMark);
    return acc;
  }, {});

  // Calculate count of students who achieved the maximum grade per subject
  const maxGradeCountBySubject = Object.keys(classMaxGradeBySubject).reduce((acc, subject) => {
    const marks = classMaxGradeBySubject[subject];
    const maxMark = Math.max(...marks);
    const maxGrade = getGrade(maxMark);
    // Count how many students have the same grade as the max
    const count = marks.filter(mark => getGrade(mark) === maxGrade).length;
    acc[subject] = { grade: maxGrade, count };
    return acc;
  }, {});

  const subjectGradePerformance = studentMarks && studentMarks.length > 0 ? {
    labels: studentMarks.map(m => m.subject_name),
    datasets: [
      {
        label: 'Maximum Grade Achieved in Class',
        data: studentMarks.map(m => {
          const grade = classMaxGrades[m.subject_name] || 'N/A';
          // Map grades to numeric values for visualization
          const gradeValues = { 'O': 9, 'A+': 8.5, 'A': 8, 'B+': 7, 'B': 6, 'C': 5, 'RA': 1 };
          return gradeValues[grade] || 0;
        }),
        borderColor: 'rgba(34, 197, 94, 1)',
        backgroundColor: 'rgba(34, 197, 94, 0.1)',
        borderWidth: 3,
        fill: true,
        tension: 0.4,
        pointRadius: 8,
        pointBackgroundColor: 'rgba(34, 197, 94, 1)',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        // Add grade names as custom data
        gradeNames: studentMarks.map(m => classMaxGrades[m.subject_name] || 'N/A')
      }
    ]
  } : { labels: [], datasets: [] };

  // Chart 3: Student Percentile Distribution (Mark ranges)
  const calculatePercentile = (studentAvg, allAverages) => {
    const sortedAverages = [...allAverages].sort((a, b) => b - a);
    const rank = sortedAverages.findIndex(avg => avg <= studentAvg) + 1;
    return Math.round((rank / allAverages.length) * 100);
  };

  const overallStudentAvg = studentMarks && studentMarks.length > 0 
    ? Math.round(studentMarks.reduce((sum, m) => {
        const markValue = (studentData?.sem_published && m.semester_marks != null && m.semester_marks > 0)
          ? m.semester_marks
          : ((m.ca1 || 0) + (m.ca2 || 0) + (m.ca3 || 0)) / 3;
        return sum + markValue;
      }, 0) / studentMarks.length)
    : 0;

  const studentPercentile = classData?.allAverages 
    ? calculatePercentile(overallStudentAvg, classData.allAverages)
    : 0;

  const markRangeDistribution = {
    labels: ['Below 50', '50-60', '60-70', '70-80', '80-90', '90-100'],
    datasets: [{
      label: 'Class Distribution',
      data: [
        (classData?.allAverages || []).filter(a => a < 50).length,
        (classData?.allAverages || []).filter(a => a >= 50 && a < 60).length,
        (classData?.allAverages || []).filter(a => a >= 60 && a < 70).length,
        (classData?.allAverages || []).filter(a => a >= 70 && a < 80).length,
        (classData?.allAverages || []).filter(a => a >= 80 && a < 90).length,
        (classData?.allAverages || []).filter(a => a >= 90).length
      ],
      backgroundColor: [
        'rgba(239, 68, 68, 0.7)',
        'rgba(251, 146, 60, 0.7)',
        'rgba(234, 179, 8, 0.7)',
        'rgba(168, 85, 247, 0.7)',
        'rgba(59, 130, 246, 0.7)',
        'rgba(34, 197, 94, 0.7)'
      ],
      borderColor: [
        'rgba(239, 68, 68, 1)',
        'rgba(251, 146, 60, 1)',
        'rgba(234, 179, 8, 1)',
        'rgba(168, 85, 247, 1)',
        'rgba(59, 130, 246, 1)',
        'rgba(34, 197, 94, 1)'
      ],
      borderWidth: 2
    }]
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <p className="text-white">Loading class performance data...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <Navbar user={{ name: 'Student', role: 'Student' }} onMenuToggle={setMobileMenuOpen} />
      
      <div className="flex">
        <Sidebar isAdmin={false} mobileOpen={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} />
        
        <main className="flex-1 p-4 sm:p-6">
          <div className="mb-6">
            <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">Semester Analytics</h1>
            <p className="text-sm sm:text-base text-gray-400">Compare your performance with class averages</p>
          </div>

          {/* Student Statistics Section - Similar to Class Statistics */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-8"
          >
            <h2 className="text-xl font-semibold text-white mb-4">Semester Performance Statistics</h2>
            
            <div className="space-y-4">
              {/* Current Semester Average - Full Width */}
              <motion.div
                whileHover={{ scale: 1.01 }}
                className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-6 hover:border-indigo-500/30 transition-all duration-300"
              >
                <p className="text-gray-400 text-sm font-medium mb-2">Current Semester Average</p>
                <p className="text-5xl font-bold text-indigo-400">
                  {studentData?.sem_published ? `${semesterAvg || '-'}` : '-'}
                </p>
                <p className="text-xs text-gray-400 mt-2">{studentData?.sem_published ? 'Based on published results' : 'Results not yet published'}</p>
              </motion.div>

              {/* Semester Subjects & Statistics - 2 Columns */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Subjects with Sem > 80 */}
                <motion.div
                  whileHover={{ scale: 1.01 }}
                  className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-6 hover:border-green-500/30 transition-all duration-300"
                >
                  <p className="text-gray-400 text-sm font-medium mb-2">Subjects Scoring {'>'}80</p>
                  <p className="text-5xl font-bold text-green-400">
                    {studentData?.sem_published 
                      ? studentMarks?.filter(m => m.semester_marks && m.semester_marks > 80).length || 0
                      : '-'
                    }
                  </p>
                  <p className="text-xs text-gray-400 mt-2">
                    {studentData?.sem_published 
                      ? `out of ${studentMarks?.filter(m => m.semester_marks).length || 0} subjects`
                      : 'Not available'
                    }
                  </p>
                </motion.div>

                {/* Semester Achievement Stars */}
                <motion.div
                  whileHover={{ scale: 1.01 }}
                  className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-6 hover:border-blue-500/30 transition-all duration-300"
                >
                  <p className="text-gray-400 text-sm font-medium mb-2">Semester Achievement</p>
                  {studentData?.sem_published ? (
                    <div className="flex items-center gap-4">
                      <div className="flex gap-1">
                        {Array.from({ length: studentMarks?.filter(m => m.semester_marks).length || 0 }).map((_, idx) => {
                          const subjectsAbove90 = studentMarks?.filter(m => m.semester_marks && m.semester_marks > 90).length || 0;
                          return (
                            <div key={idx} className="text-2xl">
                              {idx < subjectsAbove90 ? '⭐' : '☆'}
                            </div>
                          );
                        })}
                      </div>
                      <div>
                        <p className="text-3xl font-bold text-white">
                          {`${studentMarks?.filter(m => m.semester_marks && m.semester_marks > 90).length || 0}/${studentMarks?.filter(m => m.semester_marks).length || 0}`}
                        </p>
                        <p className="text-xs text-gray-400">Marks {'>'} 90</p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-3xl font-bold text-white">-</p>
                  )}
                </motion.div>
              </div>
            </div>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-6">
              <h3 className="text-xl font-semibold text-white mb-4">📊 My Grade Analytics</h3>
              <p className="text-sm text-gray-400 mb-4">Total count of grades across my subjects</p>
              {studentData?.sem_published ? (
                <div className="h-80">
                  {gradeDistribution.labels.length > 0 ? (
                    <DoughnutChart data={gradeDistribution} />
                  ) : (
                    <div className="flex items-center justify-center h-full text-gray-400">
                      No grade data available
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center justify-center h-80 bg-yellow-900/20 border border-yellow-500/30 rounded-lg">
                  <div className="text-center">
                    <p className="text-yellow-400 font-semibold mb-2">⏳ Coming Soon</p>
                    <p className="text-gray-300 text-sm">Grade analytics will be available once semester results are published</p>
                  </div>
                </div>
              )}
            </div>

            {/* Grade Distribution Statistics Table */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-6"
            >
              <h3 className="text-xl font-semibold text-white mb-4">📊 Grade Statistics (All Subjects)</h3>
              <div className="grid grid-cols-2 gap-2 text-sm mb-6 pb-4 border-b border-white/10">
                <div>
                  <p className="text-gray-400">Total Subject Grades</p>
                  <p className="text-2xl font-bold text-white">{gradeStats.total}</p>
                </div>
                <div>
                  <p className="text-gray-400">Class Average</p>
                  <p className="text-2xl font-bold text-white">{classData?.classAverage}</p>
                </div>
              </div>
              
              {gradeStats.total > 0 ? (
                <div className="h-80">
                  <BarChart data={{
                    labels: ['O\n(91+)', 'A+\n(81-90)', 'A\n(71-80)', 'B+\n(61-70)', 'B\n(56-60)', 'C\n(50-55)', 'RA\n(<50)'],
                    datasets: [{
                      label: 'Total Grades in Class',
                      data: [
                        gradeStats.distribution?.O || 0,
                        gradeStats.distribution?.['A+'] || 0,
                        gradeStats.distribution?.A || 0,
                        gradeStats.distribution?.['B+'] || 0,
                        gradeStats.distribution?.B || 0,
                        gradeStats.distribution?.C || 0,
                        gradeStats.distribution?.RA || 0
                      ],
                      backgroundColor: [
                        'rgba(34, 197, 94, 0.8)',    // O - Green
                        'rgba(16, 185, 129, 0.8)',   // A+ - Emerald
                        'rgba(59, 130, 246, 0.8)',   // A - Blue
                        'rgba(168, 85, 247, 0.8)',   // B+ - Purple
                        'rgba(251, 146, 60, 0.8)',   // B - Orange
                        'rgba(234, 179, 8, 0.8)',    // C - Yellow
                        'rgba(239, 68, 68, 0.8)'     // RA - Red
                      ],
                      borderColor: [
                        'rgba(34, 197, 94, 1)',
                        'rgba(16, 185, 129, 1)',
                        'rgba(59, 130, 246, 1)',
                        'rgba(168, 85, 247, 1)',
                        'rgba(251, 146, 60, 1)',
                        'rgba(234, 179, 8, 1)',
                        'rgba(239, 68, 68, 1)'
                      ],
                      borderWidth: 2
                    }]
                  }} />
                </div>
              ) : (
                <div className="flex items-center justify-center h-80 text-gray-400">
                  <p>No grade data available yet</p>
                </div>
              )}
            </motion.div>
          </div>

          {/* 3 Innovative Comparison Charts */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6 mt-6"
          >
            {/* Chart 1: Student vs Class Grade Distribution */}
            <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-6">
              <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                <span className="text-lg">📊</span>
                Grade Comparison
              </h3>
              <p className="text-sm text-gray-400 mb-4">My grade count vs class distribution</p>
              <div className="h-80 mb-4">
                {studentVsClassGradeData.labels.length > 0 ? (
                  <BarChart data={studentVsClassGradeData} />
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-400">
                    No data available
                  </div>
                )}
              </div>
              
              {/* Grade Distribution Table */}
              {gradeStats && Object.keys(gradeStats.distribution).length > 0 && (
                <div className="pt-4 border-t border-white/10">
                  <h4 className="text-sm font-semibold text-white mb-3">Grade Distribution Count</h4>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-white/10">
                          <th className="text-left px-3 py-2 text-gray-400">Grade</th>
                          <th className="text-center px-3 py-2 text-gray-400">Count</th>
                          <th className="text-center px-3 py-2 text-gray-400">Percentage</th>
                        </tr>
                      </thead>
                      <tbody>
                        {['O', 'A+', 'A', 'B+', 'B', 'C', 'RA'].map((grade) => {
                          const count = gradeStats.distribution?.[grade] || 0;
                          const percentage = gradeStats.total > 0 ? Math.round((count / gradeStats.total) * 100) : 0;
                          return (
                            <tr key={grade} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                              <td className="px-3 py-2">
                                <span className={`inline-block px-2 py-1 rounded font-semibold text-xs ${
                                  grade === 'O' ? 'bg-yellow-500/20 text-yellow-300' :
                                  grade === 'A+' ? 'bg-green-500/20 text-green-300' :
                                  grade === 'A' ? 'bg-blue-500/20 text-blue-300' :
                                  grade === 'B+' ? 'bg-purple-500/20 text-purple-300' :
                                  grade === 'B' ? 'bg-indigo-500/20 text-indigo-300' :
                                  grade === 'C' ? 'bg-gray-500/20 text-gray-300' :
                                  'bg-red-500/20 text-red-300'
                                }`}>
                                  {grade}
                                </span>
                              </td>
                              <td className="text-center px-3 py-2">
                                <span className="inline-block px-3 py-1 rounded-full bg-white/10 text-white font-semibold text-sm">
                                  {count}
                                </span>
                              </td>
                              <td className="text-center px-3 py-2 text-gray-300">
                                {percentage}%
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            {/* Chart 2: Maximum Grade Per Subject */}
            <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-6">
              <h3 className="text-xl font-semibold text-white mb-2 flex items-center gap-2">
                <span className="text-lg">🏆</span>
                Maximum Grade Achieved Per Subject
              </h3>
              <div className="mb-4 space-y-2">
                <p className="text-sm text-gray-400">Best performance in each subject across the class</p>
                <p className="text-xs text-gray-500">Shows the highest grade (O, A+, A, B+, B, C, or RA) that any student achieved in each subject with the count of students who achieved it.</p>
              </div>
              <div className="h-80 mb-4">
                {subjectGradePerformance.labels.length > 0 ? (
                  <LineChart data={subjectGradePerformance} />
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-400">
                    No data available
                  </div>
                )}
              </div>
              
              {/* Maximum Grade Count Table */}
              {studentMarks && studentMarks.length > 0 && (
                <div className="mt-4 pt-4 border-t border-white/10">
                  <h4 className="text-sm font-semibold text-white mb-3">Maximum Grade Count by Subject</h4>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-white/10">
                          <th className="text-left px-3 py-2 text-gray-400">Subject</th>
                          <th className="text-center px-3 py-2 text-gray-400">Max Grade</th>
                          <th className="text-center px-3 py-2 text-gray-400">Students</th>
                        </tr>
                      </thead>
                      <tbody>
                        {studentMarks.map((mark, idx) => {
                          const subjectData = maxGradeCountBySubject[mark.subject_name];
                          return (
                            <tr key={idx} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                              <td className="px-3 py-2 text-gray-300">{mark.subject_name}</td>
                              <td className="text-center px-3 py-2">
                                <span className={`inline-block px-2 py-1 rounded font-semibold text-xs ${
                                  subjectData?.grade === 'O' ? 'bg-yellow-500/20 text-yellow-300' :
                                  subjectData?.grade === 'A+' ? 'bg-green-500/20 text-green-300' :
                                  subjectData?.grade === 'A' ? 'bg-blue-500/20 text-blue-300' :
                                  subjectData?.grade === 'B+' ? 'bg-purple-500/20 text-purple-300' :
                                  subjectData?.grade === 'B' ? 'bg-indigo-500/20 text-indigo-300' :
                                  subjectData?.grade === 'C' ? 'bg-gray-500/20 text-gray-300' :
                                  'bg-red-500/20 text-red-300'
                                }`}>
                                  {subjectData?.grade || 'N/A'}
                                </span>
                              </td>
                              <td className="text-center px-3 py-2">
                                <span className="inline-block px-3 py-1 rounded-full bg-white/10 text-white font-semibold text-sm">
                                  {subjectData?.count || 0}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </motion.div>

          {/* Semester Statistics Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-6 mb-6"
          >
            <h3 className="text-xl font-semibold text-white mb-2">📊 Semester Statistics</h3>
            <p className="text-xs text-gray-500 mb-4">Based on Semester marks only - Max 100</p>
            {semesterStats && Object.keys(semesterStats).length > 0 ? (
              <div className="space-y-4">
                <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-lg p-4">
                  <p className="text-gray-400 text-sm">Class Average</p>
                  <p className="text-3xl font-bold text-indigo-400">{semesterStats.average}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
                    <p className="text-gray-400 text-sm">Highest Score</p>
                    <p className="text-2xl font-bold text-green-400">{semesterStats.highest}</p>
                  </div>
                  <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
                    <p className="text-gray-400 text-sm">Lowest Score</p>
                    <p className="text-2xl font-bold text-red-400">{semesterStats.lowest}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
                    <p className="text-gray-400 text-sm">Pass Rate (≥50)</p>
                    <p className="text-2xl font-bold text-blue-400">{semesterStats.passRate}%</p>
                  </div>
                  <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-4">
                    <p className="text-gray-400 text-sm">Excellence ({`>`}90)</p>
                    <p className="text-2xl font-bold text-purple-400">{semesterStats.distinctionRate}%</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-40 text-gray-400">
                <p>Semester statistics not available</p>
              </div>
            )}
          </motion.div>

          {/* Detailed Subject Marks Table */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-6 mb-6"
          >
            <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
              <span className="text-lg">📋</span>
              Detailed Subject Marks
            </h3>
            
            {studentMarks && studentMarks.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/10">
                      <th className="text-left py-3 px-4 text-gray-300 font-semibold">Subject</th>
                      <th className="text-center py-3 px-4 text-blue-400 font-semibold">Semester</th>
                      <th className="text-center py-3 px-4 text-cyan-400 font-semibold">Grade</th>
                      <th className="text-center py-3 px-4 text-white font-semibold">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {studentMarks.map((mark, idx) => {
                      const semesterMark = mark.semester_marks || 0;
                      const grade = getGrade(semesterMark);
                      const gradeColors = getGradeColor(grade);
                      // Status based on semester >= 50
                      const passed = semesterMark >= 50;
                      
                      return (
                        <motion.tr
                          key={idx}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.05 * idx }}
                          className="border-b border-white/5 hover:bg-white/5 transition-colors"
                        >
                          <td className="py-3 px-4 text-white font-medium">{mark.subject_name}</td>
                          <td className="text-center py-3 px-4">
                            <span className="bg-blue-500/20 text-blue-300 px-3 py-1 rounded-full text-xs font-semibold">
                              {mark.semester_marks || '-'}
                            </span>
                          </td>
                          <td className="text-center py-3 px-4">
                            <span className={`${gradeColors.bg} ${gradeColors.text} px-3 py-1 rounded-full text-xs font-bold border ${gradeColors.border}`}>
                              {grade}
                            </span>
                          </td>
                          <td className="text-center py-3 px-4">
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${passed ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'}`}>
                              {passed ? '✓ Passed' : '✗ Failed'}
                            </span>
                          </td>
                        </motion.tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-400">No subject marks data available</p>
              </div>
            )}
          </motion.div>

          {/* CA vs Semester Comparison - Only show when semester is published */}
          {studentData?.sem_published ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6"
            >
              <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-6">
                <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                  <FaBookOpen className="text-indigo-400" />
                  CA Exams vs Semester - Subject-wise
                </h3>
                {!hasSemesterData && (
                  <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-3 mb-4">
                    <p className="text-orange-400 text-sm flex items-center gap-2">
                      <span>Warning:</span>
                      <span>Some semester marks are missing - showing available data only</span>
                    </p>
                  </div>
                )}
                <div className="h-80">
                  <BarChart data={caVsSemesterData} />
                </div>
              </div>

              <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-6">
                <h3 className="text-xl font-semibold text-white mb-4">Subject-wise Semester Comparison</h3>
                {!hasSemesterData && (
                  <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-3 mb-4">
                    <p className="text-orange-400 text-sm flex items-center gap-2">
                      <span>Warning:</span>
                      <span>Some semester marks are missing - showing available data only</span>
                    </p>
                  </div>
                )}
                <div className="h-80">
                  <BarChart data={subjectComparison} />
                </div>
              </div>
            </motion.div>
          ) : null}

          {/* Semester Results Section - Show when semester NOT published */}
          {!studentData?.sem_published && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.75 }}
              className="bg-yellow-500/10 backdrop-blur-sm rounded-xl border-2 border-yellow-500/30 p-8 mb-8"
            >
              <div className="text-center">
                <FaChartPie className="text-6xl text-yellow-400 mb-4 mx-auto opacity-70" />
                <h3 className="text-2xl font-bold text-yellow-300 mb-2">📋 Semester Results Coming Soon</h3>
                <p className="text-yellow-200 mb-2">Semester examination is scheduled to be conducted and evaluated soon.</p>
                <p className="text-yellow-300 text-sm">Once semester marks are entered and published, you'll see:</p>
                <ul className="text-yellow-200 text-sm mt-3 space-y-1">
                  <li>✓ CA vs Semester comparison charts</li>
                  <li>✓ Subject-wise semester performance</li>
                  <li>✓ Combined CA + Semester analysis</li>
                </ul>
              </div>
            </motion.div>
          )}
        </main>
      </div>
    </div>
  );
}
