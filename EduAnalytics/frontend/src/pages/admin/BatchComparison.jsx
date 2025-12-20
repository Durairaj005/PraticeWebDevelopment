import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Navbar from '../../components/common/Navbar';
import Sidebar from '../../components/common/Sidebar';
import CircularKPI from '../../components/cards/CircularKPI';
import BarChart from '../../components/charts/BarChart';
import LineChart from '../../components/charts/LineChart';
import DoughnutChart from '../../components/charts/DoughnutChart';
import { FaChartLine, FaExchangeAlt, FaClipboardCheck, FaTrophy, FaBookOpen, FaDownload, FaCheckCircle, FaTimesCircle, FaChartPie } from 'react-icons/fa';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { calculateBatchPassFailRate } from '../../utils/passFailUtils';
import { calculateMarkDistribution, getDistributionStats } from '../../utils/markDistribution';
import { formatMark } from '../../utils/formatMarks';

export default function BatchComparison() {
  const [batch1, setBatch1] = useState('');
  const [batch2, setBatch2] = useState('');
  const [showComparison, setShowComparison] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [batch1Data, setBatch1Data] = useState(null);
  const [batch2Data, setBatch2Data] = useState(null);
  const [loading, setLoading] = useState(false);
  const [batches, setBatches] = useState([]);
  const [batch1Distribution, setBatch1Distribution] = useState(null);
  const [batch2Distribution, setBatch2Distribution] = useState(null);
  const [batch1Stats, setBatch1Stats] = useState(null);
  const [batch2Stats, setBatch2Stats] = useState(null);

  // Fetch all batches on mount
  useEffect(() => {
    const fetchBatches = async () => {
      try {
        const response = await fetch(
          'http://localhost:8000/api/v1/admin/batches'
        );

        if (response.ok) {
          const data = await response.json();
          const batchList = data.batches || [];
          console.log('Fetched batches:', batchList);
          setBatches(batchList.map((b, i) => ({
            id: b.batch_year || b.id,
            name: `Batch ${b.batch_year || b.id}`
          })));
        } else {
          console.error('Failed to fetch batches, status:', response.status);
        }
      } catch (err) {
        console.error('Failed to fetch batches:', err);
      }
    };

    fetchBatches();
  }, []);

  // Fetch batch data when comparison is shown or batches change
  useEffect(() => {
    if (!showComparison) return;

    const fetchBatchData = async () => {
      try {
        setLoading(true);

        // Fetch batch 1 data
        const res1 = await fetch(
          `http://localhost:8000/api/v1/admin/all-students?batch_year=${batch1}`
        );
        console.log('Batch 1 response status:', res1.status);

        // Fetch batch 2 data
        const res2 = await fetch(
          `http://localhost:8000/api/v1/admin/all-students?batch_year=${batch2}`
        );
        console.log('Batch 2 response status:', res2.status);

        if (res1.ok) {
          const data1 = await res1.json();
          console.log('Batch 1 students:', data1.students);
          const studentsWithMarks = await Promise.all(
            (data1.students || []).map(async (student) => {
              try {
                const marksRes = await fetch(
                  `http://localhost:8000/api/v1/admin/students/${student.student_id}/marks`
                );
                if (marksRes.ok) {
                  const marksData = await marksRes.json();
                  return { ...student, marks: marksData.marks || [] };
                }
              } catch (e) {}
              return { ...student, marks: [] };
            })
          );
          setBatch1Data(studentsWithMarks);
          console.log('Batch 1 data with marks:', studentsWithMarks);
        } else {
          console.error('Batch 1 fetch failed:', res1.status, res1.statusText);
        }

        if (res2.ok) {
          const data2 = await res2.json();
          console.log('Batch 2 students:', data2.students);
          const studentsWithMarks = await Promise.all(
            (data2.students || []).map(async (student) => {
              try {
                const marksRes = await fetch(
                  `http://localhost:8000/api/v1/admin/students/${student.student_id}/marks`
                );
                if (marksRes.ok) {
                  const marksData = await marksRes.json();
                  return { ...student, marks: marksData.marks || [] };
                }
              } catch (e) {}
              return { ...student, marks: [] };
            })
          );
          setBatch2Data(studentsWithMarks);
          console.log('Batch 2 data with marks:', studentsWithMarks);
        } else {
          console.error('Batch 2 fetch failed:', res2.status, res2.statusText);
        }
      } catch (err) {
        console.error('Failed to fetch batch data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchBatchData();
  }, [showComparison, batch1, batch2]);

  // Calculate mark distributions when batch data changes
  useEffect(() => {
    if (batch1Data && Array.isArray(batch1Data)) {
      const allMarks = [];
      batch1Data.forEach(student => {
        if (student.marks && Array.isArray(student.marks)) {
          allMarks.push(...student.marks);
        }
      });
      console.log('[Batch1 Marks Debug]', allMarks.slice(0, 3)); // Log first 3 marks
      if (allMarks.length > 0) {
        const dist = calculateMarkDistribution(allMarks);
        const stats = getDistributionStats(allMarks);
        console.log('[Batch1 Stats]', stats);
        setBatch1Distribution(dist);
        setBatch1Stats(stats);
      }
    }

    if (batch2Data && Array.isArray(batch2Data)) {
      const allMarks = [];
      batch2Data.forEach(student => {
        if (student.marks && Array.isArray(student.marks)) {
          allMarks.push(...student.marks);
        }
      });
      console.log('[Batch2 Marks Debug]', allMarks.slice(0, 3)); // Log first 3 marks
      if (allMarks.length > 0) {
        const dist = calculateMarkDistribution(allMarks);
        const stats = getDistributionStats(allMarks);
        console.log('[Batch2 Stats]', stats);
        setBatch2Distribution(dist);
        setBatch2Stats(stats);
      }
    }
  }, [batch1Data, batch2Data]);

  const handleCompare = () => {
    if (batch1 && batch2 && batch1 !== batch2) {
      setShowComparison(true);
    }
  };

  // Calculate pass/fail data for each batch - ONLY for semester analysis
  const calculatePassFailData = (students, onlySemesterData = true) => {
    if (!students || students.length === 0) {
      return { passPercentage: 0, failPercentage: 0, passCount: 0, failCount: 0 };
    }
    
    let passCount = 0;
    const totalStudents = students.length;
    
    // Pass/Fail logic ONLY for semester-related analysis
    // A student passes if ALL subjects have semester >= 50 AND no RA status
    students.forEach(student => {
      if (student.marks && Array.isArray(student.marks) && student.marks.length > 0) {
        // Check if student has any semester marks
        const hasSemesterData = student.marks.some(m => m.semester_marks && m.semester_marks > 0);
        
        // Only evaluate if semester data exists
        if (onlySemesterData && !hasSemesterData) {
          // No semester data - don't count as pass/fail
          return;
        }
        
        // A student passes only if ALL subjects have:
        // 1. semester marks >= 50 AND
        // 2. No RA (Reassessment) status
        const hasPassed = student.marks.every(m => {
          // Skip evaluation if no semester data for this subject
          if (!m.semester_marks || m.semester_marks === 0) return true;
          
          const hasRA = m.ra || m.status === 'RA';
          return m.semester_marks >= 50 && !hasRA;
        });
        
        if (hasPassed) passCount++;
      }
    });
    
    const failCount = totalStudents - passCount;
    return {
      passPercentage: totalStudents > 0 ? (passCount / totalStudents) * 100 : 0,
      failPercentage: totalStudents > 0 ? (failCount / totalStudents) * 100 : 0,
      passCount,
      failCount
    };
  };

  // Calculate CA averages for each CA round
  const calculateCAData = (students) => {
    if (!students || students.length === 0) {
      return { ca1: 0, ca2: 0, ca3: 0, semester_marks: 0, overall: 0 };
    }

    let ca1Total = 0, ca2Total = 0, ca3Total = 0, semesterTotal = 0;
    let ca1Count = 0, ca2Count = 0, ca3Count = 0, semesterCount = 0;

    students.forEach(student => {
      if (student.marks && Array.isArray(student.marks)) {
        student.marks.forEach(mark => {
          if (mark.ca1 != null && mark.ca1 > 0) { ca1Total += mark.ca1; ca1Count++; }
          if (mark.ca2 != null && mark.ca2 > 0) { ca2Total += mark.ca2; ca2Count++; }
          if (mark.ca3 != null && mark.ca3 > 0) { ca3Total += mark.ca3; ca3Count++; }
          // Use 'semester' field (not semester_marks) as per API schema
          if (mark.semester_marks != null && mark.semester_marks > 0) { semesterTotal += mark.semester_marks; semesterCount++; }
        });
      }
    });

    const ca1Avg = ca1Count > 0 ? ca1Total / ca1Count : 0;
    const ca2Avg = ca2Count > 0 ? ca2Total / ca2Count : 0;
    const ca3Avg = ca3Count > 0 ? ca3Total / ca3Count : 0;
    const semesterAvg = semesterCount > 0 ? semesterTotal / semesterCount : 0;

    // Calculate overall as average of available components (CA average + semester, if semester exists)
    let overallTotal = 0;
    let overallCount = 0;
    if (ca1Avg > 0) { overallTotal += ca1Avg; overallCount++; }
    if (ca2Avg > 0) { overallTotal += ca2Avg; overallCount++; }
    if (ca3Avg > 0) { overallTotal += ca3Avg; overallCount++; }
    if (semesterAvg > 0) { overallTotal += semesterAvg; overallCount++; }

    return {
      ca1: ca1Avg,
      ca2: ca2Avg,
      ca3: ca3Avg,
      semester_marks: semesterAvg,
      overall: overallCount > 0 ? overallTotal / overallCount : 0
    };
  };

  const batch1PassFail = calculatePassFailData(batch1Data);
  const batch2PassFail = calculatePassFailData(batch2Data);
  const batch1CA = calculateCAData(batch1Data);
  const batch2CA = calculateCAData(batch2Data);

  const downloadReport = () => {
    try {
      const doc = new jsPDF();
      
      let yPos = 20;
      
      // Title
      doc.setFontSize(18);
      doc.setTextColor(0, 0, 0);
      doc.text('Batch Comparison Report', 105, yPos, { align: 'center' });
      yPos += 10;
      
      // Date
      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 105, yPos, { align: 'center' });
      yPos += 15;
      
      // Batch Names
      doc.setFontSize(12);
      doc.setTextColor(0, 0, 0);
      doc.text(`Batch 1: ${batch1}`, 20, yPos);
      yPos += 8;
      doc.text(`Batch 2: ${batch2}`, 20, yPos);
      yPos += 15;
      
      // Overall Statistics
      doc.setFontSize(14);
      doc.text('Overall Statistics', 20, yPos);
      yPos += 10;
      
      doc.setFontSize(11);
      doc.text('Metric', 20, yPos);
      doc.text(`Batch ${batch1}`, 80, yPos);
      doc.text(`Batch ${batch2}`, 140, yPos);
      yPos += 8;
      
      doc.text('Average Performance', 20, yPos);
      doc.text('85.2%', 80, yPos);
      doc.text('80.5%', 140, yPos);
      yPos += 7;
      
      doc.text('Class Strength', 20, yPos);
      doc.text('60 students', 80, yPos);
      doc.text('58 students', 140, yPos);
      yPos += 7;
      
      doc.text('Pass Percentage', 20, yPos);
      doc.text(`${batch1PassFail.passPercentage.toFixed(1)}%`, 80, yPos);
      doc.text(`${batch2PassFail.passPercentage.toFixed(1)}%`, 140, yPos);
      yPos += 7;
      
      doc.text('Fail Percentage', 20, yPos);
      doc.text(`${batch1PassFail.failPercentage.toFixed(1)}%`, 80, yPos);
      doc.text(`${batch2PassFail.failPercentage.toFixed(1)}%`, 140, yPos);
      yPos += 7;
      
      doc.text('Top Scorer Average', 20, yPos);
      doc.text('95%', 80, yPos);
      doc.text('92%', 140, yPos);
      yPos += 7;
      
      doc.text('Attendance Rate', 20, yPos);
      doc.text('92%', 80, yPos);
      doc.text('88%', 140, yPos);
      yPos += 15;
      
      // Pass/Fail Analysis
      doc.setFontSize(14);
      doc.text('Pass/Fail Distribution', 20, yPos);
      yPos += 10;
      
      doc.setFontSize(11);
      doc.text(`Batch ${batch1}: ${batch1PassFail.passCount} Passed, ${batch1PassFail.failCount} Failed`, 20, yPos);
      yPos += 7;
      doc.text(`Batch ${batch2}: ${batch2PassFail.passCount} Passed, ${batch2PassFail.failCount} Failed`, 20, yPos);
      yPos += 15;
      
      // Subject-wise Comparison
      doc.setFontSize(14);
      doc.text('Subject-wise Comparison', 20, yPos);
      yPos += 10;
      
      doc.setFontSize(11);
      doc.text('Subject', 20, yPos);
      doc.text(`Batch ${batch1}`, 80, yPos);
      doc.text(`Batch ${batch2}`, 140, yPos);
      yPos += 8;
      
      const subjects = [
        ['Mathematics', '88%', '85%'],
        ['Physics', '82%', '78%'],
        ['Chemistry', '86%', '82%'],
        ['Computer Science', '90%', '85%'],
        ['English', '80%', '78%']
      ];
      
      subjects.forEach(([subject, score1, score2]) => {
        doc.text(subject, 20, yPos);
        doc.text(score1, 80, yPos);
        doc.text(score2, 140, yPos);
        yPos += 7;
      });
      
      yPos += 8;
      
      // Performance Trend
      doc.setFontSize(14);
      doc.text('Performance Trend', 20, yPos);
      yPos += 10;
      
      doc.setFontSize(11);
      doc.text('Semester', 20, yPos);
      doc.text(`Batch ${batch1}`, 80, yPos);
      doc.text(`Batch ${batch2}`, 140, yPos);
      yPos += 8;
      
      const semesters = [
        ['Semester 1', '75%', '72%'],
        ['Semester 2', '78%', '75%'],
        ['Semester 3', '82%', '78%'],
        ['Semester 4', '85%', '80%']
      ];
      
      semesters.forEach(([sem, score1, score2]) => {
        doc.text(sem, 20, yPos);
        doc.text(score1, 80, yPos);
        doc.text(score2, 140, yPos);
        yPos += 7;
      });
      
      // Add new page for CA Analysis
      doc.addPage();
      yPos = 20;
      
      doc.setFontSize(14);
      doc.text('CA Performance Analysis', 20, yPos);
      yPos += 10;
      
      doc.setFontSize(11);
      doc.text('Assessment', 20, yPos);
      doc.text(`Batch ${batch1}`, 80, yPos);
      doc.text(`Batch ${batch2}`, 140, yPos);
      yPos += 8;
      
      const caData = [
        ['CA1 Average', '78%', '74%'],
        ['CA2 Average', '81%', '76%'],
        ['CA3 Average', '83%', '78%'],
        ['Semester Average', '85%', '80%']
      ];
      
      caData.forEach(([ca, score1, score2]) => {
        doc.text(ca, 20, yPos);
        doc.text(score1, 80, yPos);
        doc.text(score2, 140, yPos);
        yPos += 7;
      });
      
      // Save the PDF
      doc.save(`Batch_Comparison_Report.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Error generating PDF report. Please try again.');
    }
  };

  // Calculate average marks by subject for each batch
  const calculateSubjectAverages = (students) => {
    const subjectMap = {};
    if (!students || students.length === 0) return {};
    
    students.forEach(student => {
      if (student.marks && Array.isArray(student.marks)) {
        student.marks.forEach(mark => {
          if (!subjectMap[mark.subject_name]) {
            subjectMap[mark.subject_name] = { total: 0, count: 0 };
          }
          const avg = (mark.ca1 + mark.ca2 + mark.ca3 + (mark.semester_marks || 0)) / 4;
          subjectMap[mark.subject_name].total += avg;
          subjectMap[mark.subject_name].count += 1;
        });
      }
    });
    
    return subjectMap;
  };

  const batch1Subjects = calculateSubjectAverages(batch1Data);
  const batch2Subjects = calculateSubjectAverages(batch2Data);
  
  // Get unique subjects from both batches
  const allSubjects = Object.keys({ ...batch1Subjects, ...batch2Subjects });
  const subjectLabels = allSubjects.slice(0, 5);
  
  const subjectComparisonData = {
    labels: subjectLabels.length > 0 ? subjectLabels : ['Math', 'Physics', 'Chemistry', 'CS', 'English'],
    datasets: [
      {
        label: `Batch ${batch1}`,
        data: subjectLabels.length > 0 
          ? subjectLabels.map(s => batch1Subjects[s] ? Math.round(batch1Subjects[s].total / batch1Subjects[s].count) : 0)
          : [0, 0, 0, 0, 0],
        backgroundColor: 'rgba(99, 102, 241, 0.7)',
        borderColor: 'rgb(99, 102, 241)',
        borderWidth: 2
      },
      {
        label: `Batch ${batch2}`,
        data: subjectLabels.length > 0
          ? subjectLabels.map(s => batch2Subjects[s] ? Math.round(batch2Subjects[s].total / batch2Subjects[s].count) : 0)
          : [0, 0, 0, 0, 0],
        backgroundColor: 'rgba(168, 85, 247, 0.7)',
        borderColor: 'rgb(168, 85, 247)',
        borderWidth: 2
      }
    ]
  };

  // Calculate CA averages for each batch
  const calculateCAAverage = (students, ca) => {
    if (!students || students.length === 0) return 0;
    let total = 0, count = 0;
    students.forEach(student => {
      if (student.marks && Array.isArray(student.marks)) {
        student.marks.forEach(mark => {
          if (ca === 'ca1') total += mark.ca1;
          else if (ca === 'ca2') total += mark.ca2;
          else if (ca === 'ca3') total += mark.ca3;
          else if (ca === 'semester') total += mark.semester_marks || 0;
          count += 1;
        });
      }
    });
    return count > 0 ? Math.round(total / count) : 0;
  };

  // CA Performance Comparison between batches
  const caComparisonData = {
    labels: ['CA1', 'CA2', 'CA3', 'Semester'],
    datasets: [
      {
        label: `Batch ${batch1}`,
        data: [
          batch1CA.ca1,
          batch1CA.ca2,
          batch1CA.ca3,
          batch1CA.semester
        ],
        borderColor: 'rgb(99, 102, 241)',
        backgroundColor: 'rgba(99, 102, 241, 0.1)',
        fill: true,
        tension: 0.4,
        pointRadius: 6,
        pointHoverRadius: 8
      },
      {
        label: `Batch ${batch2}`,
        data: [
          batch2CA.ca1,
          batch2CA.ca2,
          batch2CA.ca3,
          batch2CA.semester
        ],
        borderColor: 'rgb(168, 85, 247)',
        backgroundColor: 'rgba(168, 85, 247, 0.1)',
        fill: true,
        tension: 0.4,
        pointRadius: 6,
        pointHoverRadius: 8
      }
    ]
  };

  // CA vs Semester by Subject - CA charts always show, Semester only if available
  const hasSemesterData = batch1Data && batch1Data.some?.(s => s.marks?.some?.(m => m.semester_marks && m.semester_marks > 0)) || 
                         batch2Data && batch2Data.some?.(s => s.marks?.some?.(m => m.semester_marks && m.semester_marks > 0)) || false;
  
  const caVsSemesterComparison = {
    labels: subjectLabels.length > 0 ? subjectLabels : ['Math', 'Physics', 'Chemistry', 'CS', 'English'],
    datasets: [
      {
        label: `${batch1} CA Avg`,
        data: subjectLabels.length > 0 
          ? subjectLabels.map(s => batch1Subjects[s] ? Math.round(batch1Subjects[s].total / batch1Subjects[s].count * 0.6) : 0)
          : [0, 0, 0, 0, 0],
        backgroundColor: 'rgba(249, 115, 22, 0.7)',
      },
      {
        label: `${batch2} CA Avg`,
        data: subjectLabels.length > 0
          ? subjectLabels.map(s => batch2Subjects[s] ? Math.round(batch2Subjects[s].total / batch2Subjects[s].count * 0.6) : 0)
          : [0, 0, 0, 0, 0],
        backgroundColor: 'rgba(168, 85, 247, 0.5)',
      },
      ...(hasSemesterData ? [{
        label: `${batch1} Semester`,
        data: subjectLabels.length > 0
          ? subjectLabels.map(s => batch1Subjects[s] ? Math.round(batch1Subjects[s].total / batch1Subjects[s].count * 0.4) : 0)
          : [0, 0, 0, 0, 0],
        backgroundColor: 'rgba(59, 130, 246, 0.7)',
      }] : []),
      ...(hasSemesterData ? [{
        label: `${batch2} Semester`,
        data: subjectLabels.length > 0
          ? subjectLabels.map(s => batch2Subjects[s] ? Math.round(batch2Subjects[s].total / batch2Subjects[s].count * 0.4) : 0)
          : [0, 0, 0, 0, 0],
        backgroundColor: 'rgba(99, 102, 241, 0.5)',
      }] : [])
    ]
  };

  const trendData = {
    labels: ['Sem 1', 'Sem 2', 'Sem 3', 'Sem 4'],
    datasets: [
      {
        label: `Batch ${batch1}`,
        data: [
          calculateCAAverage(batch1Data, 'ca1'),
          calculateCAAverage(batch1Data, 'ca2'),
          calculateCAAverage(batch1Data, 'ca3'),
          calculateCAAverage(batch1Data, 'semester')
        ],
        borderColor: 'rgb(99, 102, 241)',
        backgroundColor: 'rgba(99, 102, 241, 0.1)',
        fill: true,
        tension: 0.4
      },
      {
        label: `Batch ${batch2}`,
        data: [
          calculateCAAverage(batch2Data, 'ca1'),
          calculateCAAverage(batch2Data, 'ca2'),
          calculateCAAverage(batch2Data, 'ca3'),
          calculateCAAverage(batch2Data, 'semester')
        ],
        borderColor: 'rgb(168, 85, 247)',
        backgroundColor: 'rgba(168, 85, 247, 0.1)',
        fill: true,
        tension: 0.4
      }
    ]
  };

  // Pass/Fail Rate Data
  const batch1PassFailData = {
    labels: ['Pass', 'Fail'],
    datasets: [
      {
        label: `Batch ${batch1}`,
        data: [batch1PassFail.passPercentage, batch1PassFail.failPercentage],
        backgroundColor: [
          'rgba(34, 197, 94, 0.8)',
          'rgba(239, 68, 68, 0.8)'
        ],
        borderColor: [
          'rgb(34, 197, 94)',
          'rgb(239, 68, 68)'
        ],
        borderWidth: 2
      }
    ]
  };

  const batch2PassFailData = {
    labels: ['Pass', 'Fail'],
    datasets: [
      {
        label: `Batch ${batch2}`,
        data: [batch2PassFail.passPercentage, batch2PassFail.failPercentage],
        backgroundColor: [
          'rgba(34, 197, 94, 0.8)',
          'rgba(239, 68, 68, 0.8)'
        ],
        borderColor: [
          'rgb(34, 197, 94)',
          'rgb(239, 68, 68)'
        ],
        borderWidth: 2
      }
    ]
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <Navbar user={{ name: 'Admin', role: 'Administrator' }} onMenuToggle={setMobileMenuOpen} />
      
      <div className="flex">
        <Sidebar isAdmin={true} mobileOpen={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} />
        
        <main className="flex-1 p-4 sm:p-6">
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            <div className="flex items-center gap-3 mb-2">
              <FaExchangeAlt className="text-2xl sm:text-3xl text-indigo-400" />
              <h1 className="text-2xl sm:text-3xl font-bold text-white">Batch Comparison</h1>
            </div>
            <p className="text-sm sm:text-base text-gray-400">Compare performance between current and past batches</p>
          </motion.div>

          {/* Batch Selection */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6"
          >
            <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-4 hover:bg-white/10 transition-all">
              <label className="block text-sm font-medium text-gray-400 mb-2">Batch 1</label>
              <select 
                value={batch1}
                onChange={(e) => { setBatch1(e.target.value); setShowComparison(false); }}
                className="w-full px-4 py-3 bg-gray-800 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                style={{ colorScheme: 'dark' }}
              >
                <option value="">-- Select Batch --</option>
                {batches.map(batch => (
                  <option key={batch.id} value={batch.id} className="bg-gray-800 text-white">
                    {batch.name}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-4 hover:bg-white/10 transition-all">
              <label className="block text-sm font-medium text-gray-400 mb-2">Batch 2</label>
              <select 
                value={batch2}
                onChange={(e) => { setBatch2(e.target.value); setShowComparison(false); }}
                className="w-full px-4 py-3 bg-gray-800 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                style={{ colorScheme: 'dark' }}
              >
                <option value="">-- Select Batch --</option>
                {batches.map(batch => (
                  <option key={batch.id} value={batch.id} className="bg-gray-800 text-white">
                    {batch.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-4 flex items-end">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleCompare}
                disabled={!batch1 || !batch2 || batch1 === batch2}
                className="w-full px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold rounded-lg shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                Compare Batches
              </motion.button>
            </div>

            <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-4 flex items-end">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={downloadReport}
                disabled={!showComparison}
                className="w-full px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold rounded-lg shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
              >
                <FaDownload /> Download Report
              </motion.button>
            </div>
          </motion.div>

          {batch1 === batch2 && batch1 && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 mb-6"
            >
              <p className="text-red-400 text-sm">
                ⚠️ Please select two different batches to compare
              </p>
            </motion.div>
          )}

          {(!batch1 || !batch2) && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-6 text-center"
            >
              <p className="text-blue-400 text-lg font-semibold">
                👆 Select two different batches to compare their performance
              </p>
            </motion.div>
          )}

          {showComparison && batch1 !== batch2 && (
            <>
            {loading && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 mb-6"
              >
                <p className="text-blue-400 text-sm">⏳ Loading batch data and comparing...</p>
              </motion.div>
            )}
            {!loading && showComparison && (!batch1Data || !batch2Data || batch1Data.length === 0 || batch2Data.length === 0) && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-4 mb-6"
              >
                <p className="text-orange-400 text-sm">⚠️ No data found for one or both batches</p>
              </motion.div>
            )}
          {/* Stats Cards */}
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6"
          >
            {/* Batch 1 Performance Card */}
            <motion.div 
              variants={itemVariants} 
              className="bg-gradient-to-br from-indigo-600 to-indigo-700 rounded-xl p-6 text-white transform hover:scale-105 transition-transform"
            >
              <p className="text-sm opacity-80 mb-4 font-semibold">Batch {batch1} Performance</p>
              <div className="space-y-3">
                <div>
                  <p className="text-xs opacity-70 mb-1">Overall Average</p>
                  <h3 className="text-3xl font-bold">{batch1Data && batch1Data.length > 0 ? formatMark(batch1CA.overall, true) : '—'}</h3>
                </div>
                <div className="border-t border-white/20 pt-3">
                  <p className="text-xs opacity-70 mb-1">Pass Rate</p>
                  <p className="text-2xl font-bold">{batch1PassFail.passPercentage.toFixed(1)}%</p>
                  <p className="text-xs opacity-60 mt-1">{batch1PassFail.passCount} passed</p>
                </div>
                <div>
                  <p className="text-xs opacity-70 mb-1">Fail Rate</p>
                  <p className="text-2xl font-bold text-red-200">{batch1PassFail.failPercentage.toFixed(1)}%</p>
                  <p className="text-xs opacity-60 mt-1">{batch1PassFail.failCount} failed</p>
                </div>
              </div>
            </motion.div>

            {/* Batch 2 Performance Card */}
            <motion.div 
              variants={itemVariants} 
              className="bg-gradient-to-br from-purple-600 to-purple-700 rounded-xl p-6 text-white transform hover:scale-105 transition-transform"
            >
              <p className="text-sm opacity-80 mb-4 font-semibold">Batch {batch2} Performance</p>
              <div className="space-y-3">
                <div>
                  <p className="text-xs opacity-70 mb-1">Overall Average</p>
                  <h3 className="text-3xl font-bold">{batch2Data && batch2Data.length > 0 ? formatMark(batch2CA.overall, true) : '—'}</h3>
                </div>
                <div className="border-t border-white/20 pt-3">
                  <p className="text-xs opacity-70 mb-1">Pass Rate</p>
                  <p className="text-2xl font-bold">{batch2PassFail.passPercentage.toFixed(1)}%</p>
                  <p className="text-xs opacity-60 mt-1">{batch2PassFail.passCount} passed</p>
                </div>
                <div>
                  <p className="text-xs opacity-70 mb-1">Fail Rate</p>
                  <p className="text-2xl font-bold text-red-200">{batch2PassFail.failPercentage.toFixed(1)}%</p>
                  <p className="text-xs opacity-60 mt-1">{batch2PassFail.failCount} failed</p>
                </div>
              </div>
            </motion.div>

            {/* Comparison Card */}
            <motion.div 
              variants={itemVariants} 
              className="bg-gradient-to-br from-emerald-600 to-emerald-700 rounded-xl p-6 text-white transform hover:scale-105 transition-transform"
            >
              <p className="text-sm opacity-80 mb-4 font-semibold">Comparison</p>
              <div className="space-y-3">
                <div>
                  <p className="text-xs opacity-70 mb-1">Average Performance Diff</p>
                  <h3 className="text-3xl font-bold">
                    {batch1CA.overall > batch2CA.overall ? '+' : ''}{(batch1CA.overall - batch2CA.overall).toFixed(1)}%
                  </h3>
                  <p className="text-xs opacity-60 mt-1">{batch1CA.overall > batch2CA.overall ? 'Batch ' + batch1 + ' ahead' : 'Batch ' + batch2 + ' ahead'}</p>
                </div>
                <div className="border-t border-white/20 pt-3">
                  <p className="text-xs opacity-70 mb-1">Pass Rate Difference</p>
                  <p className="text-2xl font-bold">
                    {batch1PassFail.passPercentage > batch2PassFail.passPercentage ? '+' : ''}{(batch1PassFail.passPercentage - batch2PassFail.passPercentage).toFixed(1)}%
                  </p>
                  <p className="text-xs opacity-60 mt-1">{batch1PassFail.passPercentage > batch2PassFail.passPercentage ? 'Higher' : 'Lower'} pass rate in Batch {batch1}</p>
                </div>
                <div>
                  <p className="text-xs opacity-70 mb-1">Total Students</p>
                  <p className="text-lg font-semibold">{batch1Data?.length || 0} vs {batch2Data?.length || 0}</p>
                </div>
              </div>
            </motion.div>
          </motion.div>

          {/* ==============================
              SECTION 1: CA PERFORMANCE ANALYSIS
              ============================== */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-8"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-1 h-8 bg-gradient-to-b from-blue-400 to-cyan-400 rounded"></div>
              <h2 className="text-3xl font-bold text-white">📊 CA Performance Analysis</h2>
            </div>

            {/* CA KPIs Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
              <CircularKPI
                value={batch1CA.ca1}
                maxValue={100}
                label={`${batch1} CA1`}
                icon={FaClipboardCheck}
                color="orange"
                delay={0}
              />
              <CircularKPI
                value={batch1CA.ca2}
                maxValue={100}
                label={`${batch1} CA2`}
                icon={FaClipboardCheck}
                color="purple"
                delay={0.1}
              />
              <CircularKPI
                value={batch2CA.ca1}
                maxValue={100}
                label={`${batch2} CA1`}
                icon={FaClipboardCheck}
                color="indigo"
                delay={0.2}
              />
              <CircularKPI
                value={batch2CA.ca2}
                maxValue={100}
                label={`${batch2} CA2`}
                icon={FaClipboardCheck}
                color="cyan"
                delay={0.3}
              />
            </div>

            {/* CA Progression & Subject Comparison */}
            <motion.div 
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6"
            >
              <motion.div variants={itemVariants} className="bg-gradient-to-br from-blue-600/20 to-cyan-600/20 backdrop-blur-sm rounded-xl border border-blue-500/30 p-6 hover:shadow-2xl hover:shadow-blue-500/20 transition-all">
                <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                  <FaChartLine className="text-cyan-400" />
                  CA Progression Trend
                </h3>
                <p className="text-xs text-gray-400 mb-4">Shows how CA1, CA2, CA3 trends compare between batches</p>
                <div className="h-80">
                  <LineChart data={caComparisonData} />
                </div>
              </motion.div>

              <motion.div variants={itemVariants} className="bg-gradient-to-br from-indigo-600/20 to-blue-600/20 backdrop-blur-sm rounded-xl border border-indigo-500/30 p-6 hover:shadow-2xl hover:shadow-indigo-500/20 transition-all">
                <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                  <FaBookOpen className="text-indigo-400" />
                  Subject-wise CA Performance
                </h3>
                <p className="text-xs text-gray-400 mb-4">Compares CA averages across all subjects</p>
                <div className="h-80">
                  <BarChart data={subjectComparisonData} />
                </div>
              </motion.div>
            </motion.div>

            {/* CA Summary Statistics Table */}
            <motion.div 
              variants={itemVariants}
              initial="hidden"
              animate="visible"
              className="bg-gradient-to-br from-blue-600/10 to-cyan-600/10 backdrop-blur-sm rounded-xl border border-blue-500/30 p-6"
            >
              <h3 className="text-xl font-semibold text-white mb-4">CA Statistical Summary</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-blue-500/20">
                      <th className="text-left py-3 px-4 text-gray-400">Metric</th>
                      <th className="text-center py-3 px-4 text-blue-400 font-semibold">Batch {batch1}</th>
                      <th className="text-center py-3 px-4 text-indigo-400 font-semibold">Batch {batch2}</th>
                      <th className="text-center py-3 px-4 text-green-400 font-semibold">Difference</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-blue-500/10 hover:bg-blue-500/5">
                      <td className="py-3 px-4 text-gray-300">CA1 Average</td>
                      <td className="text-center py-3 px-4 text-blue-300 font-semibold">{batch1CA.ca1.toFixed(2)}</td>
                      <td className="text-center py-3 px-4 text-indigo-300 font-semibold">{batch2CA.ca1.toFixed(2)}</td>
                      <td className="text-center py-3 px-4 font-semibold" style={{color: batch1CA.ca1 > batch2CA.ca1 ? '#4ade80' : '#ef4444'}}>
                        {(batch1CA.ca1 - batch2CA.ca1).toFixed(2)}
                      </td>
                    </tr>
                    <tr className="border-b border-blue-500/10 hover:bg-blue-500/5">
                      <td className="py-3 px-4 text-gray-300">CA2 Average</td>
                      <td className="text-center py-3 px-4 text-blue-300 font-semibold">{batch1CA.ca2.toFixed(2)}</td>
                      <td className="text-center py-3 px-4 text-indigo-300 font-semibold">{batch2CA.ca2.toFixed(2)}</td>
                      <td className="text-center py-3 px-4 font-semibold" style={{color: batch1CA.ca2 > batch2CA.ca2 ? '#4ade80' : '#ef4444'}}>
                        {(batch1CA.ca2 - batch2CA.ca2).toFixed(2)}
                      </td>
                    </tr>
                    <tr className="border-b border-blue-500/10 hover:bg-blue-500/5">
                      <td className="py-3 px-4 text-gray-300">CA3 Average</td>
                      <td className="text-center py-3 px-4 text-blue-300 font-semibold">{batch1CA.ca3.toFixed(2)}</td>
                      <td className="text-center py-3 px-4 text-indigo-300 font-semibold">{batch2CA.ca3.toFixed(2)}</td>
                      <td className="text-center py-3 px-4 font-semibold" style={{color: batch1CA.ca3 > batch2CA.ca3 ? '#4ade80' : '#ef4444'}}>
                        {(batch1CA.ca3 - batch2CA.ca3).toFixed(2)}
                      </td>
                    </tr>
                    <tr className="border-b border-blue-500/10 hover:bg-blue-500/5">
                      <td className="py-3 px-4 text-gray-300 font-semibold">CA Average</td>
                      <td className="text-center py-3 px-4 bg-blue-500/20 text-blue-300 font-bold rounded">{((batch1CA.ca1 + batch1CA.ca2 + batch1CA.ca3) / 3).toFixed(2)}</td>
                      <td className="text-center py-3 px-4 bg-indigo-500/20 text-indigo-300 font-bold rounded">{((batch2CA.ca1 + batch2CA.ca2 + batch2CA.ca3) / 3).toFixed(2)}</td>
                      <td className="text-center py-3 px-4 font-bold" style={{color: ((batch1CA.ca1 + batch1CA.ca2 + batch1CA.ca3) / 3) > ((batch2CA.ca1 + batch2CA.ca2 + batch2CA.ca3) / 3) ? '#4ade80' : '#ef4444'}}>
                        {(((batch1CA.ca1 + batch1CA.ca2 + batch1CA.ca3) / 3) - ((batch2CA.ca1 + batch2CA.ca2 + batch2CA.ca3) / 3)).toFixed(2)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </motion.div>
          </motion.div>

          {/* ==============================
              SECTION 2: SEMESTER ANALYSIS
              ============================== */}
          {(batch1CA.semester_marks > 0 || batch2CA.semester_marks > 0) && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="mb-8"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-1 h-8 bg-gradient-to-b from-green-400 to-emerald-400 rounded"></div>
                <h2 className="text-3xl font-bold text-white">🎓 Semester Analysis</h2>
              </div>

              {/* Semester KPI Section */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                {batch1CA.semester_marks > 0 && (
                  <CircularKPI
                    value={batch1CA.semester_marks}
                    maxValue={100}
                    label={`${batch1} Semester`}
                    icon={FaTrophy}
                    color="green"
                    delay={0}
                  />
                )}
                {batch2CA.semester_marks > 0 && (
                  <CircularKPI
                    value={batch2CA.semester_marks}
                    maxValue={100}
                    label={`${batch2} Semester`}
                    icon={FaTrophy}
                    color="emerald"
                    delay={0.1}
                  />
                )}
                {batch1PassFail && (
                  <div className="bg-gradient-to-br from-green-600 to-green-700 rounded-xl p-6 text-white text-center hover:scale-105 transition-transform">
                    <p className="text-sm opacity-80 mb-2">Batch {batch1} Pass Rate</p>
                    <h3 className="text-3xl font-bold">{batch1PassFail.passPercentage.toFixed(1)}%</h3>
                    <p className="text-xs opacity-70 mt-2">{batch1PassFail.passCount} passed</p>
                  </div>
                )}
                {batch2PassFail && (
                  <div className="bg-gradient-to-br from-emerald-600 to-emerald-700 rounded-xl p-6 text-white text-center hover:scale-105 transition-transform">
                    <p className="text-sm opacity-80 mb-2">Batch {batch2} Pass Rate</p>
                    <h3 className="text-3xl font-bold">{batch2PassFail.passPercentage.toFixed(1)}%</h3>
                    <p className="text-xs opacity-70 mt-2">{batch2PassFail.passCount} passed</p>
                  </div>
                )}
              </div>

              {/* Pass/Fail Visualization */}
              <motion.div 
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6"
              >
                {batch1PassFail && (
                  <motion.div variants={itemVariants} className="bg-gradient-to-br from-green-600/20 to-emerald-600/20 backdrop-blur-sm rounded-xl border border-green-500/30 p-6 hover:shadow-2xl hover:shadow-green-500/20 transition-all">
                    <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                      <FaCheckCircle className="text-green-400" />
                      Batch {batch1} - Pass/Fail Distribution
                    </h3>
                    <p className="text-xs text-gray-400 mb-4">Shows passing and failing student distribution</p>
                    <div className="h-80 flex items-center justify-center">
                      <div className="w-full max-w-sm">
                        <DoughnutChart data={batch1PassFailData} />
                      </div>
                    </div>
                    <div className="mt-4 grid grid-cols-2 gap-3">
                      <div className="bg-green-500/20 border border-green-500/40 rounded-lg p-3 text-center">
                        <p className="text-xs text-gray-400">Pass</p>
                        <p className="text-2xl font-bold text-green-400">{batch1PassFail.passPercentage.toFixed(1)}%</p>
                        <p className="text-xs text-gray-500 mt-1">{batch1PassFail.passCount} students</p>
                      </div>
                      <div className="bg-red-500/20 border border-red-500/40 rounded-lg p-3 text-center">
                        <p className="text-xs text-gray-400">Fail</p>
                        <p className="text-2xl font-bold text-red-400">{batch1PassFail.failPercentage.toFixed(1)}%</p>
                        <p className="text-xs text-gray-500 mt-1">{batch1PassFail.failCount} students</p>
                      </div>
                    </div>
                  </motion.div>
                )}

                {batch2PassFail && (
                  <motion.div variants={itemVariants} className="bg-gradient-to-br from-emerald-600/20 to-teal-600/20 backdrop-blur-sm rounded-xl border border-emerald-500/30 p-6 hover:shadow-2xl hover:shadow-emerald-500/20 transition-all">
                    <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                      <FaTimesCircle className="text-emerald-400" />
                      Batch {batch2} - Pass/Fail Distribution
                    </h3>
                    <p className="text-xs text-gray-400 mb-4">Shows passing and failing student distribution</p>
                    <div className="h-80 flex items-center justify-center">
                      <div className="w-full max-w-sm">
                        <DoughnutChart data={batch2PassFailData} />
                      </div>
                    </div>
                    <div className="mt-4 grid grid-cols-2 gap-3">
                      <div className="bg-green-500/20 border border-green-500/40 rounded-lg p-3 text-center">
                        <p className="text-xs text-gray-400">Pass</p>
                        <p className="text-2xl font-bold text-green-400">{batch2PassFail.passPercentage.toFixed(1)}%</p>
                        <p className="text-xs text-gray-500 mt-1">{batch2PassFail.passCount} students</p>
                      </div>
                      <div className="bg-red-500/20 border border-red-500/40 rounded-lg p-3 text-center">
                        <p className="text-xs text-gray-400">Fail</p>
                        <p className="text-2xl font-bold text-red-400">{batch2PassFail.failPercentage.toFixed(1)}%</p>
                        <p className="text-xs text-gray-500 mt-1">{batch2PassFail.failCount} students</p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </motion.div>

              {/* Semester Statistics Table */}
              <motion.div 
                variants={itemVariants}
                initial="hidden"
                animate="visible"
                className="bg-gradient-to-br from-emerald-600/10 to-teal-600/10 backdrop-blur-sm rounded-xl border border-emerald-500/30 p-6 mt-6"
              >
                <h3 className="text-xl font-semibold text-white mb-4">Semester Statistical Summary</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-emerald-500/20">
                        <th className="text-left py-3 px-4 text-gray-400">Metric</th>
                        {batch1CA.semester_marks > 0 && <th className="text-center py-3 px-4 text-green-400 font-semibold">Batch {batch1}</th>}
                        {batch2CA.semester_marks > 0 && <th className="text-center py-3 px-4 text-emerald-400 font-semibold">Batch {batch2}</th>}
                        {batch1CA.semester_marks > 0 && batch2CA.semester_marks > 0 && <th className="text-center py-3 px-4 text-green-400 font-semibold">Difference</th>}
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b border-emerald-500/10 hover:bg-emerald-500/5">
                        <td className="py-3 px-4 text-gray-300">Semester Average</td>
                        {batch1CA.semester_marks > 0 && <td className="text-center py-3 px-4 text-green-300 font-semibold">{batch1CA.semester_marks.toFixed(2)}</td>}
                        {batch2CA.semester_marks > 0 && <td className="text-center py-3 px-4 text-emerald-300 font-semibold">{batch2CA.semester_marks.toFixed(2)}</td>}
                        {batch1CA.semester_marks > 0 && batch2CA.semester_marks > 0 && (
                          <td className="text-center py-3 px-4 font-semibold" style={{color: batch1CA.semester_marks > batch2CA.semester_marks ? '#4ade80' : '#ef4444'}}>
                            {(batch1CA.semester_marks - batch2CA.semester_marks).toFixed(2)}
                          </td>
                        )}
                      </tr>
                      <tr className="border-b border-emerald-500/10 hover:bg-emerald-500/5">
                        <td className="py-3 px-4 text-gray-300">Pass Rate</td>
                        {batch1PassFail && <td className="text-center py-3 px-4 text-green-300 font-semibold">{batch1PassFail.passPercentage.toFixed(1)}%</td>}
                        {batch2PassFail && <td className="text-center py-3 px-4 text-emerald-300 font-semibold">{batch2PassFail.passPercentage.toFixed(1)}%</td>}
                        {batch1PassFail && batch2PassFail && (
                          <td className="text-center py-3 px-4 font-semibold" style={{color: batch1PassFail.passPercentage > batch2PassFail.passPercentage ? '#4ade80' : '#ef4444'}}>
                            {(batch1PassFail.passPercentage - batch2PassFail.passPercentage).toFixed(1)}%
                          </td>
                        )}
                      </tr>
                      <tr className="border-b border-emerald-500/10 hover:bg-emerald-500/5">
                        <td className="py-3 px-4 text-gray-300">Total Students</td>
                        {batch1Data && <td className="text-center py-3 px-4 text-green-300 font-semibold">{batch1Data.length}</td>}
                        {batch2Data && <td className="text-center py-3 px-4 text-emerald-300 font-semibold">{batch2Data.length}</td>}
                        {batch1Data && batch2Data && (
                          <td className="text-center py-3 px-4 font-semibold text-blue-400">{Math.abs(batch1Data.length - batch2Data.length)}</td>
                        )}
                      </tr>
                    </tbody>
                  </table>
                </div>
              </motion.div>
            </motion.div>
          )}

          {/* No Semester Data Message */}
          {batch1CA.semester === 0 && batch2CA.semester === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-6 mb-8"
            >
              <h3 className="text-lg font-semibold text-blue-300 mb-2 flex items-center gap-2">
                <span>⏳</span> Semester Data Coming Soon
              </h3>
              <p className="text-blue-200 text-sm">
                Semester marks are not yet available for these batches. Once uploaded, this section will show semester performance comparison, pass/fail rates, and subject-wise semester analysis.
              </p>
            </motion.div>
          )}

            </>
          )}
        </main>
      </div>
    </div>
  );
}
