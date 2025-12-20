import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import Navbar from '../../components/common/Navbar';
import Sidebar from '../../components/common/Sidebar';
import StatCard from '../../components/cards/StatCard';
import CircularKPI from '../../components/cards/CircularKPI';
import BarChart from '../../components/charts/BarChart';
import LineChart from '../../components/charts/LineChart';
import RadarChart from '../../components/charts/RadarChart';
import { FaChartLine, FaTrophy, FaBookOpen, FaAward, FaDownload, FaFilePdf, FaClipboardCheck, FaCheckCircle, FaChartPie, FaStar } from 'react-icons/fa';
import { countPassedSubjects, countFailedSubjects, isSubjectPassed } from '../../utils/passFailUtils';
import { calculateMarkDistribution, getDistributionStats } from '../../utils/markDistribution';
import { formatMark } from '../../utils/formatMarks';
import { getGrade, getGradeColor } from '../../utils/gradeUtils';

export default function StudentDashboard() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [studentData, setStudentData] = useState(null);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [classMarkDistribution, setClassMarkDistribution] = useState(null);
  const [classDistributionStats, setClassDistributionStats] = useState(null);
  const [classData, setClassData] = useState(null);
  const [achievements, setAchievements] = useState({ earned: 0, total: 0, subjectsAbove50: [] });
  const [semesterAchievements, setSemesterAchievements] = useState({ earned: 0, total: 0, subjectsAbove80: [] });

  // Fetch student marks from backend
  useEffect(() => {
    const fetchStudentData = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        const studentId = localStorage.getItem('studentId');
        const registerNo = localStorage.getItem('registerNo');
        
        if (!token) {
          setError('No authentication token found. Please log in.');
          setLoading(false);
          return;
        }

        // Fetch student dashboard data
        const dashResponse = await fetch(
          'http://localhost:8000/api/v1/student/dashboard',
          {
            headers: { 'Authorization': `Bearer ${token}` }
          }
        );

        if (!dashResponse.ok) {
          throw new Error('Failed to fetch dashboard data');
        }

        const dashData = await dashResponse.json();
        
        console.log('[StudentDashboard] dashData from backend:', dashData);
        console.log('[StudentDashboard] sem_published value:', dashData?.sem_published);

        // Fetch student marks
        const marksResponse = await fetch(
          'http://localhost:8000/api/v1/student/marks',
          {
            headers: { 'Authorization': `Bearer ${token}` }
          }
        );

        if (!marksResponse.ok) {
          throw new Error('Failed to fetch marks');
        }

        const marksData = await marksResponse.json();
        const marks = Array.isArray(marksData.marks) ? marksData.marks : [];

        // Process marks data into subject format
        const subjectsMap = {};
        marks.forEach(mark => {
          if (!subjectsMap[mark.subject_name]) {
            subjectsMap[mark.subject_name] = {
              name: mark.subject_name,
              ca1: 0,
              ca2: 0,
              ca3: 0,
              semester: 0,
              maxMarks: 100
            };
          }
          
          if (mark.ca1) subjectsMap[mark.subject_name].ca1 = mark.ca1;
          if (mark.ca2) subjectsMap[mark.subject_name].ca2 = mark.ca2;
          if (mark.ca3) subjectsMap[mark.subject_name].ca3 = mark.ca3;
          if (mark.semester_marks) subjectsMap[mark.subject_name].semester = mark.semester_marks;
        });

        const subjectsArray = Object.values(subjectsMap);

        // Calculate achievements - count subjects with CA avg >= 55
        const subjectsAbove50 = subjectsArray.filter(subject => {
          const caAvg = ((subject.ca1 || 0) + (subject.ca2 || 0) + (subject.ca3 || 0)) / 3;
          return caAvg >= 55;
        });

        // Calculate semester achievements - count subjects with semester marks > 80
        const subjectsAbove80 = subjectsArray.filter(subject => {
          return subject.semester && subject.semester > 80;
        });
        
        setAchievements({
          earned: subjectsAbove50.length,
          total: subjectsArray.length,
          subjectsAbove50: subjectsAbove50.map(s => s.name)
        });

        setSemesterAchievements({
          earned: subjectsAbove80.length,
          total: subjectsArray.filter(s => s.semester && s.semester > 0).length,
          subjectsAbove80: subjectsAbove80.map(s => s.name)
        });

        // Calculate averages
        const ca1Avg = subjectsArray.length > 0 
          ? Math.round(subjectsArray.reduce((sum, s) => sum + (s.ca1 || 0), 0) / subjectsArray.length) 
          : 0;
        const ca2Avg = subjectsArray.length > 0 
          ? Math.round(subjectsArray.reduce((sum, s) => sum + (s.ca2 || 0), 0) / subjectsArray.length) 
          : 0;
        const ca3Avg = subjectsArray.length > 0 
          ? Math.round(subjectsArray.reduce((sum, s) => sum + (s.ca3 || 0), 0) / subjectsArray.length) 
          : 0;
        
        // Overall CA average (average of all CA marks per component across all subjects)
        const overallCAAverage = subjectsArray.length > 0 
          ? Math.round((subjectsArray.reduce((sum, s) => sum + (s.ca1 || 0) + (s.ca2 || 0) + (s.ca3 || 0), 0) / (subjectsArray.length * 3)) * 100) / 100
          : 0;

        // Calculate semester average if available
        const semesterSubjects = subjectsArray.filter(s => s.semester && s.semester > 0);
        const semesterAverage = semesterSubjects.length > 0
          ? Math.round((semesterSubjects.reduce((sum, s) => sum + s.semester, 0) / semesterSubjects.length) * 100) / 100
          : 0;

        // Determine which average to display as main
        const hasSemesterData = semesterSubjects.length > 0;
        const mainAverage = hasSemesterData ? semesterAverage : overallCAAverage;

        setStudentData({
          name: dashData.name || registerNo,
          registerNo: dashData.register_no || registerNo,
          semester: '1',
          batch: dashData.batch_year || '2024',
          average: mainAverage,  // Use semester if available, otherwise CA
          rank: dashData.rank || 1, // Use actual rank from backend
          ca1Avg,
          ca2Avg,
          ca3Avg,
          semesterAvg: semesterAverage,  // Always store semester average
          caAverage: overallCAAverage,  // Always store CA average
          sem_published: dashData.sem_published || false,  // Add SEM published status
          hasSemesterData: hasSemesterData  // Track if semester data exists
        });

        setSubjects(subjectsArray);
        console.log('[StudentDashboard] subjectsArray set:', subjectsArray);
        setError(null);
      } catch (err) {
        console.error('Error fetching student data:', err);
        setError(`Error loading data: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };

    fetchStudentData();
  }, []);

  // Fetch class mark distribution
  useEffect(() => {
    const fetchClassDistribution = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          console.warn('No token available for class stats');
          return;
        }

        // Get student's batch from their data
        const batchRes = await fetch('http://localhost:8000/api/v1/student/dashboard', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const dashData = await batchRes.json();
        const batch = dashData.batch_year || '2025';

        // Fetch all students in the class with auth
        const studentsRes = await fetch(`http://localhost:8000/api/v1/admin/all-students?batch_year=${batch}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const studentsData = await studentsRes.json();
        
        let allMarks = [];
        
        // Fetch marks for each student
        for (const student of studentsData.students || []) {
          try {
            const marksRes = await fetch(`http://localhost:8000/api/v1/admin/students/${student.student_id}/marks`, {
              headers: { 'Authorization': `Bearer ${token}` }
            });
            const marksData = await marksRes.json();
            if (marksData.marks) {
              allMarks = [...allMarks, ...marksData.marks];
            }
          } catch (err) {
            console.error(`Error fetching marks for student ${student.student_id}:`, err);
          }
        }

        // Debug: Log collected marks
        console.log('[CLASS STATS DEBUG] All marks collected:', allMarks);
        console.log('[CLASS STATS DEBUG] Number of marks:', allMarks.length);
        if (allMarks.length > 0) {
          console.log('[CLASS STATS DEBUG] Sample mark:', allMarks[0]);
        }

        // Calculate class insights (average per student and total students)
        let allStudentAverages = [];
        const studentMarksMap = {};
        
        // Group marks by student
        allMarks.forEach(mark => {
          if (!studentMarksMap[mark.student_id]) {
            studentMarksMap[mark.student_id] = [];
          }
          studentMarksMap[mark.student_id].push(mark);
        });
        
        // Calculate each student's average
        Object.values(studentMarksMap).forEach(studentMarks => {
          const avg = studentMarks.reduce((sum, m) => {
            const caAvg = ((m.ca1 || 0) + (m.ca2 || 0) + (m.ca3 || 0)) / 3;
            return sum + caAvg;
          }, 0) / studentMarks.length;
          allStudentAverages.push(avg);
        });
        
        const classAverage = allStudentAverages.length > 0 
          ? (allStudentAverages.reduce((a, b) => a + b, 0) / allStudentAverages.length).toFixed(1)
          : 0;
        
        setClassData({
          totalStudents: studentsData.students?.length || 0,
          classAverage: classAverage
        });

        // Calculate distribution
        if (allMarks.length > 0) {
          const distribution = calculateMarkDistribution(allMarks);
          setClassMarkDistribution(distribution);
          const stats = getDistributionStats(allMarks);
          console.log('[CLASS STATS DEBUG] Calculated stats:', stats);
          setClassDistributionStats(stats);
        }
      } catch (err) {
        console.error('Error fetching class distribution:', err);
      }
    };

    if (studentData) {
      fetchClassDistribution();
    }
  }, [studentData]);

  // Calculate pass/fail statistics using utility functions
  const subjectsPassed = countPassedSubjects(subjects);
  const subjectsFailed = countFailedSubjects(subjects);
  const totalSubjects = subjects.length;

  const downloadPDF = () => {
    try {
      const doc = new jsPDF();
      
      let yPos = 20;
      
      // Title
      doc.setFontSize(18);
      doc.setTextColor(0, 0, 0);
      doc.text('Student Performance Report', 105, yPos, { align: 'center' });
      yPos += 10;
      
      // Date
      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 105, yPos, { align: 'center' });
      yPos += 15;
      
      // Student Details
      doc.setFontSize(12);
      doc.setTextColor(0, 0, 0);
      doc.text('Student Information', 20, yPos);
      yPos += 8;
      
      doc.setFontSize(11);
      doc.text(`Name: ${studentData.name}`, 20, yPos);
      yPos += 7;
      doc.text(`Register No: ${studentData.registerNo}`, 20, yPos);
      yPos += 7;
      doc.text(`Semester: ${studentData.semester}`, 20, yPos);
      doc.text(`Batch: ${studentData.batch}`, 80, yPos);
      yPos += 7;
      doc.text(`Overall Average: ${studentData.average}%`, 20, yPos);
      doc.text(`Class Rank: #${studentData.rank}`, 80, yPos);
      yPos += 15;
      
      // CA Performance Summary
      doc.setFontSize(12);
      doc.text('CA Performance Summary', 20, yPos);
      yPos += 8;
      
      doc.setFontSize(11);
      doc.text(`CA1 Average: ${formatMark(studentData.ca1Avg, true)}`, 20, yPos);
      yPos += 7;
      doc.text(`CA2 Average: ${formatMark(studentData.ca2Avg, true)}`, 20, yPos);
      yPos += 7;
      doc.text(`CA3 Average: ${formatMark(studentData.ca3Avg, true)}`, 20, yPos);
      yPos += 7;
      if (studentData.semesterAvg && studentData.semesterAvg > 0) {
        doc.text(`Semester Average: ${formatMark(studentData.semesterAvg, true)}`, 20, yPos);
        yPos += 7;
      }
      yPos += 8;
      
      // Subject-wise Performance
      const hasSemesterData = subjects.some(s => s.semester && s.semester > 0);
      doc.setFontSize(12);
      doc.text('Subject-wise Performance', 20, yPos);
      yPos += 8;
      
      doc.setFontSize(11);
      // Headers
      doc.text('Subject', 20, yPos);
      doc.text('CA1', 60, yPos);
      doc.text('CA2', 80, yPos);
      doc.text('CA3', 100, yPos);
      if (hasSemesterData) {
        doc.text('Sem', 120, yPos);
        doc.text('Avg', 140, yPos);
      } else {
        doc.text('Avg', 120, yPos);
      }
      yPos += 7;
      
      // Subject data
      subjects.forEach(sub => {
        doc.text(sub.name, 20, yPos);
        doc.text(formatMark(sub.ca1), 60, yPos);
        doc.text(formatMark(sub.ca2), 80, yPos);
        doc.text(formatMark(sub.ca3), 100, yPos);
        if (hasSemesterData && sub.semester && sub.semester > 0) {
          doc.text(formatMark(sub.semester), 120, yPos);
          const avg = ((sub.ca1 + sub.ca2 + sub.ca3 + sub.semester) / 4).toFixed(2);
          doc.text(avg, 140, yPos);
        } else {
          const avg = ((sub.ca1 + sub.ca2 + sub.ca3) / 3).toFixed(2);
          doc.text(avg, 120, yPos);
        }
        yPos += 7;
      });
      
      yPos += 10;
      
      // Performance Trends Analysis
      doc.setFontSize(12);
      doc.text('CA Progress Trends', 20, yPos);
      yPos += 8;
      
      doc.setFontSize(11);
      subjects.forEach(sub => {
        const improvement = sub.ca3 - sub.ca1;
        const trend = improvement > 0 ? 'Improving' : improvement < 0 ? 'Declining' : 'Stable';
        doc.text(`${sub.name}: ${trend} (${improvement > 0 ? '+' : ''}${improvement} points)`, 20, yPos);
        yPos += 6;
      });
      
      // Add new page for detailed analysis
      doc.addPage();
      yPos = 20;
      
      doc.setFontSize(14);
      doc.text('Detailed Performance Analysis', 20, yPos);
      yPos += 10;
      
      // Strengths
      doc.setFontSize(12);
      doc.text('Strengths:', 20, yPos);
      yPos += 8;
      doc.setFontSize(10);
      
      // Find top subjects
      const topSubjects = subjects
        .map(s => ({ 
          name: s.name, 
          avg: hasSemesterData && s.semester 
            ? (s.ca1 + s.ca2 + s.ca3 + s.semester) / 4 
            : (s.ca1 + s.ca2 + s.ca3) / 3 
        }))
        .sort((a, b) => b.avg - a.avg)
        .slice(0, 2);
      
      topSubjects.forEach(sub => {
        doc.text(`- Excellent performance in ${sub.name} (${sub.avg.toFixed(1)}%)`, 25, yPos);
        yPos += 6;
      });
      
      doc.text(`- Consistent class rank position (#${studentData.rank})`, 25, yPos);
      yPos += 10;
      
      // Areas for Improvement
      doc.setFontSize(12);
      doc.text('Areas for Improvement:', 20, yPos);
      yPos += 8;
      doc.setFontSize(10);
      
      // Find subjects needing improvement
      const weakSubjects = subjects
        .map(s => ({ 
          name: s.name, 
          avg: hasSemesterData && s.semester 
            ? (s.ca1 + s.ca2 + s.ca3 + s.semester) / 4 
            : (s.ca1 + s.ca2 + s.ca3) / 3 
        }))
        .filter(s => s.avg < studentData.average)
        .sort((a, b) => a.avg - b.avg)
        .slice(0, 2);
      
      if (weakSubjects.length > 0) {
        weakSubjects.forEach(sub => {
          doc.text(`- Focus more on ${sub.name} (${sub.avg.toFixed(1)}%)`, 25, yPos);
          yPos += 6;
        });
      } else {
        doc.text('- Maintain current performance across all subjects', 25, yPos);
        yPos += 6;
      }
      
      yPos += 10;
      
      // Recommendations
      doc.setFontSize(12);
      doc.text('Recommendations:', 20, yPos);
      yPos += 8;
      doc.setFontSize(10);
      doc.text('- Continue regular study habits', 25, yPos);
      yPos += 6;
      doc.text('- Practice more on weaker subjects', 25, yPos);
      yPos += 6;
      doc.text('- Participate actively in class discussions', 25, yPos);
      yPos += 6;
      doc.text('- Seek help from teachers when needed', 25, yPos);
      yPos += 15;
      
      // Performance Metrics Summary
      doc.setFontSize(12);
      doc.text('Overall Performance Metrics', 20, yPos);
      yPos += 8;
      
      doc.setFontSize(11);
      doc.text(`Total Subjects: ${subjects.length}`, 20, yPos);
      yPos += 7;
      doc.text(`Average Score: ${studentData.average}%`, 20, yPos);
      yPos += 7;
      doc.text(`Highest Subject Average: ${topSubjects[0]?.avg.toFixed(1)}%`, 20, yPos);
      yPos += 7;
      if (weakSubjects.length > 0) {
        doc.text(`Lowest Subject Average: ${weakSubjects[0]?.avg.toFixed(1)}%`, 20, yPos);
        yPos += 7;
      }
      
      // Footer
      yPos += 10;
      doc.setFontSize(9);
      doc.setTextColor(128, 128, 128);
      doc.text('This is a computer-generated document', 105, yPos, { align: 'center' });
      
      doc.save(`${studentData.registerNo}_Performance_Report.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Error generating PDF report. Please try again.');
    }
  };

  // CA vs Semester Comparison Data
  // CA Comparison Data - CA marks only (No Semester)
  const caComparisonData = {
    labels: subjects.length > 0 ? subjects.map(s => s.name) : ['Math', 'Physics', 'Chemistry', 'CS', 'English'],
    datasets: [
      {
        label: 'CA1',
        data: subjects.map(s => s.ca1 || 0),
        backgroundColor: 'rgba(249, 115, 22, 0.7)',
      },
      {
        label: 'CA2',
        data: subjects.map(s => s.ca2 || 0),
        backgroundColor: 'rgba(168, 85, 247, 0.7)',
      },
      {
        label: 'CA3',
        data: subjects.map(s => s.ca3 || 0),
        backgroundColor: 'rgba(34, 197, 94, 0.7)',
      }
    ]
  };

  // CA Progress Trend - CA marks only
  const caProgressLabels = ['CA1', 'CA2', 'CA3'];
  const caProgressValues = studentData ? [studentData.ca1Avg, studentData.ca2Avg, studentData.ca3Avg] : [0, 0, 0];
  
  const caProgressData = {
    labels: caProgressLabels,
    datasets: [{
      label: 'My CA Average',
      data: caProgressValues,
      borderColor: 'rgb(34, 197, 94)',
      backgroundColor: 'rgba(34, 197, 94, 0.1)',
      fill: true,
      tension: 0.4,
      pointRadius: 6,
      pointHoverRadius: 8
    }]
  };
  
  // Subject Performance - CA average only
  const subjectData = {
    labels: subjects.map(s => s.name),
    datasets: [{
      label: 'CA Average',
      data: subjects.map(s => Math.round((Number(s.ca1 || 0) + Number(s.ca2 || 0) + Number(s.ca3 || 0)) / 3)),
      backgroundColor: 'rgba(99, 102, 241, 0.7)',
      borderColor: 'rgb(99, 102, 241)',
      borderWidth: 2
    }]
  };


  // Performance Percentile - Student rank within class distribution
  const performancePercentile = classData ? {
    labels: [
      `🏆 Top 10%\nExcellent\n(Best Performer)`,
      `⭐ Top 25%\nVery Good\n(Well Done)`,
      `✓ Top 50%\nGood\n(Above Average)`,
      `📈 Top 75%\nAverage\n(Acceptable)`,
      `⚠️ Bottom 25%\nNeeds Work\n(Improve Now)`
    ],
    datasets: [{
      label: 'Your Rank',
      data: [
        studentData?.rank <= Math.ceil(classData.totalStudents * 0.1) ? 100 : 0,
        studentData?.rank <= Math.ceil(classData.totalStudents * 0.25) ? 100 : 0,
        studentData?.rank <= Math.ceil(classData.totalStudents * 0.5) ? 100 : 0,
        studentData?.rank <= Math.ceil(classData.totalStudents * 0.75) ? 100 : 0,
        studentData?.rank > Math.ceil(classData.totalStudents * 0.75) ? 100 : 0
      ],
      backgroundColor: [
        'rgba(34, 197, 94, 0.8)',
        'rgba(59, 130, 246, 0.8)',
        'rgba(168, 85, 247, 0.8)',
        'rgba(251, 146, 60, 0.8)',
        'rgba(239, 68, 68, 0.8)'
      ],
      borderColor: [
        'rgb(34, 197, 94)',
        'rgb(59, 130, 246)',
        'rgb(168, 85, 247)',
        'rgb(251, 146, 60)',
        'rgb(239, 68, 68)'
      ],
      borderWidth: 2
    }]
  } : {
    labels: [],
    datasets: []
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <Navbar user={{ name: studentData?.name || 'Student', role: 'Student' }} onMenuToggle={setMobileMenuOpen} />
      
      <div className="flex">
        <Sidebar isAdmin={false} mobileOpen={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} />
        
        <main className="flex-1 min-h-screen bg-gray-900 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          {/* Loading State */}
          {loading && (
            <div className="flex items-center justify-center h-screen">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                className="w-12 h-12 border-4 border-indigo-600 border-t-purple-600 rounded-full"
              />
            </div>
          )}

          {/* Error State */}
          {error && !loading && (
            <div className="p-6 bg-red-900/20 border border-red-500/50 rounded-lg mb-6">
              <p className="text-red-300 text-lg font-semibold">⚠️ {error}</p>
              <p className="text-red-300 text-sm mt-2">Please check the database and upload your marks first.</p>
            </div>
          )}

          {/* Main Content */}
          {!loading && studentData && (
            <div className="w-full max-w-7xl mx-auto">
              <motion.div 
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
              >
                <div className="flex-1">
                  <h1 className="text-4xl font-bold text-white mb-2">Welcome, {studentData.name}! 👋</h1>
                  <p className="text-gray-400 text-lg">Register: <span className="text-indigo-400 font-semibold">{studentData.registerNo}</span> | Batch: <span className="text-purple-400 font-semibold">{studentData.batch}</span></p>
                  <p className="text-gray-300 text-sm mt-1">Here's your complete academic performance overview</p>
                  
                  {/* SEM Published Status Badge - Only show if semester_marks exist */}
                  <div className="mt-3 flex items-center gap-2">
                    {studentData.sem_published && subjects.some(s => s.semester && s.semester > 0) ? (
                      <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="flex items-center gap-2 px-3 py-1 bg-green-900/40 border border-green-500/60 rounded-full"
                      >
                        <FaCheckCircle className="text-green-400 text-sm" />
                        <span className="text-green-400 font-semibold text-sm">✓ Semester Results Published</span>
                      </motion.div>
                    ) : (
                      <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="flex items-center gap-2 px-3 py-1 bg-yellow-900/40 border border-yellow-500/60 rounded-full"
                      >
                        <FaClipboardCheck className="text-yellow-400 text-sm" />
                        <span className="text-yellow-400 font-semibold text-sm">⏳ Semester Results Pending</span>
                      </motion.div>
                    )}
                  </div>
                </div>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={downloadPDF}
                  className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold rounded-lg shadow-lg transition-all whitespace-nowrap"
                >
                  <FaFilePdf className="text-xl" />
                  Download Report
                </motion.button>
              </motion.div>

          {/* Unified Student Statistics Card - Like Class Statistics Layout */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-6"
          >
            <h2 className="text-xl font-semibold text-white mb-4">Student Statistics</h2>
            
            <div className="space-y-4">
              {/* Current Average - Full Width */}
              <motion.div
                whileHover={{ scale: 1.01 }}
                className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-6 hover:border-indigo-500/30 transition-all duration-300"
              >
                <p className="text-gray-400 text-sm font-medium mb-2">Current Average</p>
                <p className="text-5xl font-bold text-indigo-400">{`${studentData.semesterAvg || 0}%`}</p>
              </motion.div>

              {/* Class Rank & Subjects Passed - 2 Columns */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <motion.div
                  whileHover={{ scale: 1.01 }}
                  className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-6 hover:border-purple-500/30 transition-all duration-300"
                >
                  <p className="text-gray-400 text-sm font-medium mb-2">Class Rank</p>
                  <p className="text-5xl font-bold text-purple-400">{`#${studentData.rank || 'N/A'}`}</p>
                  <p className="text-xs text-green-400 mt-2">↑ +3 positions</p>
                </motion.div>

                <motion.div
                  whileHover={{ scale: 1.01 }}
                  className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-6 hover:border-green-500/30 transition-all duration-300"
                >
                  <p className="text-gray-400 text-sm font-medium mb-2">Subjects Passed</p>
                  <p className="text-5xl font-bold text-green-400">{`${subjectsPassed}/${totalSubjects}`}</p>
                </motion.div>
              </div>

              {/* Achievements & Semester Excellence - 2 Columns */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* CA Achievements */}
                <motion.div
                  whileHover={{ scale: 1.01 }}
                  className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-6 hover:border-orange-500/30 transition-all duration-300"
                >
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-gray-400 text-sm font-medium">Achievements</p>
                    <FaAward className="text-xl text-orange-400" />
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <div className="flex gap-1">
                      {Array.from({ length: achievements.total }).map((_, idx) => (
                        <motion.div
                          key={idx}
                          initial={{ scale: 0, rotate: -180 }}
                          animate={{ scale: 1, rotate: 0 }}
                          transition={{ delay: idx * 0.05 }}
                        >
                          <FaStar
                            className={`text-lg ${
                              idx < achievements.earned
                                ? 'text-yellow-400'
                                : 'text-gray-600'
                            }`}
                            fill={idx < achievements.earned ? 'currentColor' : 'none'}
                          />
                        </motion.div>
                      ))}
                    </div>
                    <div>
                      <p className="text-3xl font-bold text-white">
                        {achievements.earned}/{achievements.total}
                      </p>
                      <p className="text-xs text-gray-400">CA avg {'>='} 55</p>
                    </div>
                  </div>

                  {/* CA Subjects Tooltip */}
                  {achievements.subjectsAbove50.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-white/10">
                      <p className="text-xs text-gray-400 mb-2">Achieved:</p>
                      <div className="flex flex-wrap gap-1">
                        {achievements.subjectsAbove50.slice(0, 2).map((subject, idx) => (
                          <span
                            key={idx}
                            className="text-xs bg-orange-500/20 text-orange-300 px-2 py-1 rounded"
                          >
                            {subject.split(' ').slice(0, 2).join(' ')}
                          </span>
                        ))}
                        {achievements.subjectsAbove50.length > 2 && (
                          <span className="text-xs text-gray-400 px-2 py-1">
                            +{achievements.subjectsAbove50.length - 2}
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </motion.div>

                {/* Semester Excellence */}
                <motion.div
                  whileHover={{ scale: 1.01 }}
                  className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-6 hover:border-blue-500/30 transition-all duration-300"
                >
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-gray-400 text-sm font-medium">Semester Excellence</p>
                    <FaTrophy className="text-xl text-blue-400" />
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <div className="flex gap-1">
                      {Array.from({ length: semesterAchievements.total || 0 }).map((_, idx) => (
                        <motion.div
                          key={idx}
                          initial={{ scale: 0, rotate: -180 }}
                          animate={{ scale: 1, rotate: 0 }}
                          transition={{ delay: idx * 0.05 }}
                        >
                          <FaStar
                            className={`text-lg ${
                              idx < semesterAchievements.earned
                                ? 'text-blue-400'
                                : 'text-gray-600'
                            }`}
                            fill={idx < semesterAchievements.earned ? 'currentColor' : 'none'}
                          />
                        </motion.div>
                      ))}
                    </div>
                    <div>
                      <p className="text-3xl font-bold text-white">
                        {semesterAchievements.total > 0 
                          ? `${semesterAchievements.earned}/${semesterAchievements.total}`
                          : '-'
                        }
                      </p>
                      <p className="text-xs text-gray-400">Marks {'>'} 80</p>
                    </div>
                  </div>

                  {/* Semester Subjects Tooltip */}
                  {semesterAchievements.subjectsAbove80.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-white/10">
                      <p className="text-xs text-gray-400 mb-2">Achieved:</p>
                      <div className="flex flex-wrap gap-1">
                        {semesterAchievements.subjectsAbove80.slice(0, 2).map((subject, idx) => (
                          <span
                            key={idx}
                            className="text-xs bg-blue-500/20 text-blue-300 px-2 py-1 rounded"
                          >
                            {subject.split(' ').slice(0, 2).join(' ')}
                          </span>
                        ))}
                        {semesterAchievements.subjectsAbove80.length > 2 && (
                          <span className="text-xs text-gray-400 px-2 py-1">
                            +{semesterAchievements.subjectsAbove80.length - 2}
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </motion.div>
              </div>
            </div>
          </motion.div>

          {/* Class Insights */}
          {classData && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-6 mb-6"
            >
              <h3 className="text-xl font-semibold text-white mb-4">📈 Class Insights</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                <div className="p-4 bg-white/5 rounded-lg">
                  <p className="text-gray-400 text-sm mb-1">Your Rank</p>
                  <p className="text-3xl font-bold text-white">
                    {typeof studentData.rank === 'number' ? `#${studentData.rank}` : studentData.rank}
                  </p>
                  {classData && (
                    <p className="text-green-400 text-sm mt-1">
                      of {classData.totalStudents} students
                    </p>
                  )}
                </div>
                <div className="p-4 bg-white/5 rounded-lg">
                  <p className="text-gray-400 text-sm mb-1">Total Students</p>
                  <p className="text-3xl font-bold text-white">
                    {classData?.totalStudents || 'N/A'}
                  </p>
                </div>
                <div className="p-4 bg-white/5 rounded-lg">
                  <p className="text-gray-400 text-sm mb-1">Class Average</p>
                  <p className="text-3xl font-bold text-white">
                    {classData?.classAverage || 'N/A'}%
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          {/* Detailed Marks Table */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-6 mb-6"
          >
            <h2 className="text-2xl font-bold text-white mb-6">📊 Detailed Subject Marks</h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left py-3 px-4 text-gray-300 font-semibold">Subject</th>
                    <th className="text-center py-3 px-4 text-orange-400 font-semibold">CA1</th>
                    <th className="text-center py-3 px-4 text-purple-400 font-semibold">CA2</th>
                    <th className="text-center py-3 px-4 text-green-400 font-semibold">CA3</th>
                    <th className="text-center py-3 px-4 text-indigo-400 font-semibold">CA Avg</th>
                    <th className="text-center py-3 px-4 text-white font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {subjects.map((subject, idx) => {
                    const caAvg = Math.round((subject.ca1 + subject.ca2 + subject.ca3) / 3);
                    // Status based on CA average >= 30
                    const passed = caAvg >= 30;
                    
                    return (
                      <tr key={idx} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                        <td className="py-4 px-4 text-white font-medium">{subject.name}</td>
                        <td className="py-4 px-4 text-center text-orange-300 font-semibold">{subject.ca1 || '-'}</td>
                        <td className="py-4 px-4 text-center text-purple-300 font-semibold">{subject.ca2 || '-'}</td>
                        <td className="py-4 px-4 text-center text-green-300 font-semibold">{subject.ca3 || '-'}</td>
                        <td className="py-4 px-4 text-center text-indigo-300 font-bold text-lg">{caAvg}</td>
                        <td className="py-4 px-4 text-center">
                          <span className={`px-3 py-1 rounded-full text-sm font-semibold ${passed ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'}`}>
                            {passed ? '✓ Passed' : '✗ Failed'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </motion.div> 

          {/* Performance Percentile - Student Ranking */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-6 mb-6"
          >
            <div className="mb-6">
              <h3 className="text-xl font-semibold text-white mb-2">📊 Your Performance Ranking in Class</h3>
              <p className="text-sm text-gray-400 mb-3">See where you stand among your classmates</p>
              <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-lg p-3 mb-4">
                <p className="text-indigo-300 text-sm font-semibold">
                  Your Rank: <span className="text-lg font-bold">#{studentData?.rank}</span> out of <span className="text-lg font-bold">{classData?.totalStudents}</span> students
                </p>
              </div>
            </div>
            <div className="h-80">
              {performancePercentile.labels.length > 0 ? (
                <BarChart data={performancePercentile} />
              ) : (
                <div className="flex items-center justify-center h-full text-gray-400">
                  Loading performance data...
                </div>
              )}
            </div>
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3">
                <p className="text-green-400 text-sm font-semibold">🏆 Excellent</p>
                <p className="text-gray-300 text-xs mt-1">Top 10% - Best of the best!</p>
              </div>
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
                <p className="text-blue-400 text-sm font-semibold">⭐ Very Good</p>
                <p className="text-gray-300 text-xs mt-1">Top 25% - Well done!</p>
              </div>
              <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-3">
                <p className="text-purple-400 text-sm font-semibold">✓ Good</p>
                <p className="text-gray-300 text-xs mt-1">Top 50% - Above average</p>
              </div>
              <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg p-3">
                <p className="text-orange-400 text-sm font-semibold">📈 Average</p>
                <p className="text-gray-300 text-xs mt-1">Top 75% - Room to improve</p>
              </div>
            </div>
          </motion.div>

          {/* Class Mark Distribution */}
          {classMarkDistribution && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.9 }}
              className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6"
            >
              <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-6">
                <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                  <FaChartPie className="text-yellow-400" />
                  Class Mark Distribution
                </h3>
                <div className="h-80">
                  <BarChart data={classMarkDistribution} />
                </div>
              </div>

              <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-6">
                <h3 className="text-xl font-semibold text-white mb-2">📚 Class Statistics (CA Marks)</h3>
                <p className="text-xs text-gray-500 mb-4">Based on Continuous Assessment (CA) marks only - Max 60</p>
                {classDistributionStats && (
                  <div className="space-y-4">
                    <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-lg p-4">
                      <p className="text-gray-400 text-sm">Class Average</p>
                      <p className="text-3xl font-bold text-indigo-400">{classDistributionStats.average}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
                        <p className="text-gray-400 text-sm">Highest Score</p>
                        <p className="text-2xl font-bold text-green-400">{classDistributionStats.highest}</p>
                      </div>
                      <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
                        <p className="text-gray-400 text-sm">Lowest Score</p>
                        <p className="text-2xl font-bold text-red-400">{classDistributionStats.lowest}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
                        <p className="text-gray-400 text-sm">Pass Rate (≥30)</p>
                        <p className="text-2xl font-bold text-blue-400">{classDistributionStats.passRate}%</p>
                      </div>
                      <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-4">
                        <p className="text-gray-400 text-sm">Excellence (≥55)</p>
                        <p className="text-2xl font-bold text-purple-400">{classDistributionStats.distinctionRate}%</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}            </div>
          )}
        </main>
      </div>
    </div>
  );
}