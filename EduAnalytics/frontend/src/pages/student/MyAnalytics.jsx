import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Navbar from '../../components/common/Navbar';
import Sidebar from '../../components/common/Sidebar';
import CircularKPI from '../../components/cards/CircularKPI';
import BarChart from '../../components/charts/BarChart';
import LineChart from '../../components/charts/LineChart';
import DoughnutChart from '../../components/charts/DoughnutChart';
import { FaClipboardCheck, FaTrophy, FaChartLine, FaBookOpen } from 'react-icons/fa';

export default function MyAnalytics() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [studentData, setStudentData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [studentMarks, setStudentMarks] = useState([]);
  const [classData, setClassData] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token');
        
        if (!token) {
          setLoading(false);
          return;
        }

        // Fetch dashboard summary
        const dashResponse = await fetch(
          `http://localhost:8000/api/v1/student/dashboard`,
          { headers: { 'Authorization': `Bearer ${token}` } }
        );

        // Fetch detailed marks
        const marksResponse = await fetch(
          `http://localhost:8000/api/v1/student/marks`,
          { headers: { 'Authorization': `Bearer ${token}` } }
        );

        if (dashResponse.ok && marksResponse.ok) {
          const dashData = await dashResponse.json();
          const marksData = await marksResponse.json();
          
          // Combine dashboard data with marks
          setStudentData({
            ...dashData,
            marks: marksData.marks || []
          });
        }
      } catch (err) {
        console.error('Failed to fetch analytics data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Fetch student marks and class data
  useEffect(() => {
    const fetchStudentMarks = async () => {
      try {
        const token = localStorage.getItem('token');
        const batch = localStorage.getItem('batch') || '2025';
        
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

        // Fetch class data
        const classRes = await fetch(
          `http://localhost:8000/api/v1/admin/all-students?batch_year=${batch}`
        );
        
        if (classRes.ok) {
          const classInfo = await classRes.json();
          let allStudentAverages = [];
          let allMarks = [];
          
          for (const student of classInfo.students) {
            const marksRes = await fetch(
              `http://localhost:8000/api/v1/admin/students/${student.student_id}/marks`
            );
            
            if (marksRes.ok) {
              const marksData = await marksRes.json();
              if (marksData.marks && marksData.marks.length > 0) {
                allMarks = allMarks.concat(marksData.marks);
                
                const avg = marksData.marks.reduce((sum, m) => {
                  const caAvg = ((m.ca1 || 0) + (m.ca2 || 0) + (m.ca3 || 0)) / 3;
                  return sum + caAvg;
                }, 0) / marksData.marks.length;
                
                allStudentAverages.push(avg);
              }
            }
          }
          
          const classAverage = allStudentAverages.length > 0 
            ? (allStudentAverages.reduce((a, b) => a + b, 0) / allStudentAverages.length).toFixed(1)
            : 0;
          
          setClassData({
            totalStudents: classInfo.students.length,
            classAverage: classAverage,
            allAverages: allStudentAverages,
            allMarks: allMarks
          });
        }
      } catch (err) {
        console.error('Error fetching marks:', err);
      }
    };
    
    fetchStudentMarks();
  }, []);

  // Calculate data from studentData if available
  const subjects = studentData?.marks?.map(m => ({
    name: m.subject_name,
    ca1: m.ca1,
    ca2: m.ca2,
    ca3: m.ca3,
    semester: m.semester_marks || 0
  })) || [];
  const semesterData = subjects.length > 0 ? {
    labels: subjects.map(s => s.name),
    datasets: [
      {
        label: 'CA1 Marks',
        data: subjects.map(s => s.ca1 || 0),
        borderColor: 'rgb(239, 68, 68)',
        backgroundColor: 'transparent',
        borderWidth: 3,
        fill: false,
        tension: 0.4,
        pointRadius: 6,
        pointBackgroundColor: 'rgb(239, 68, 68)',
        pointBorderColor: 'white',
        pointBorderWidth: 2,
        pointHoverRadius: 8
      },
      {
        label: 'CA2 Marks',
        data: subjects.map(s => s.ca2 || 0),
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'transparent',
        borderWidth: 3,
        fill: false,
        tension: 0.4,
        pointRadius: 6,
        pointBackgroundColor: 'rgb(59, 130, 246)',
        pointBorderColor: 'white',
        pointBorderWidth: 2,
        pointHoverRadius: 8
      },
      {
        label: 'CA3 Marks',
        data: subjects.map(s => s.ca3 || 0),
        borderColor: 'rgb(34, 197, 94)',
        backgroundColor: 'transparent',
        borderWidth: 3,
        fill: false,
        tension: 0.4,
        pointRadius: 6,
        pointBackgroundColor: 'rgb(34, 197, 94)',
        pointBorderColor: 'white',
        pointBorderWidth: 2,
        pointHoverRadius: 8
      }
    ]
  } : {
    labels: ['No Data'],
    datasets: [
      {
        label: 'CA1 Marks',
        data: [0],
        borderColor: 'rgb(239, 68, 68)',
        backgroundColor: 'transparent',
        borderWidth: 3,
        fill: false,
        tension: 0.4,
        pointRadius: 6,
        pointBackgroundColor: 'rgb(239, 68, 68)',
        pointBorderColor: 'white',
        pointBorderWidth: 2
      },
      {
        label: 'CA2 Marks',
        data: [0],
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'transparent',
        borderWidth: 3,
        fill: false,
        tension: 0.4,
        pointRadius: 6,
        pointBackgroundColor: 'rgb(59, 130, 246)',
        pointBorderColor: 'white',
        pointBorderWidth: 2
      },
      {
        label: 'CA3 Marks',
        data: [0],
        borderColor: 'rgb(34, 197, 94)',
        backgroundColor: 'transparent',
        borderWidth: 3,
        fill: false,
        tension: 0.4,
        pointRadius: 6,
        pointBackgroundColor: 'rgb(34, 197, 94)',
        pointBorderColor: 'white',
        pointBorderWidth: 2
    }]
  };

  const subjectComparison = subjects.length > 0 ? {
    labels: subjects.map(s => s.name),
    datasets: [{
      label: 'CA Average',
      data: subjects.map(s => {
        const caAvg = (s.ca1 + s.ca2 + s.ca3) / 3;
        return Math.round(caAvg);
      }),
      backgroundColor: 'rgba(99, 102, 241, 0.7)',
    }]
  } : {
    labels: [],
    datasets: []
  };

  // CA marks only comparison
  const hasSemesterData = subjects.some(s => s.semester > 0);
  
  const caVsSemesterData = subjects.length > 0 ? {
    labels: subjects.map(s => s.name),
    datasets: [
      {
        label: 'CA1',
        data: subjects.map(s => s.ca1),
        backgroundColor: 'rgba(249, 115, 22, 0.7)',
      },
      {
        label: 'CA2',
        data: subjects.map(s => s.ca2),
        backgroundColor: 'rgba(168, 85, 247, 0.7)',
      },
      {
        label: 'CA3',
        data: subjects.map(s => s.ca3),
        backgroundColor: 'rgba(34, 197, 94, 0.7)',
      }
    ]
  } : {
    labels: [],
    datasets: []
  };

  // CA Improvement - CA marks only
  const caImprovementLabels = ['CA1', 'CA2', 'CA3'];
  
  const caImprovementData = subjects.length > 0 ? {
    labels: caImprovementLabels,
    datasets: subjects.map((subject, idx) => ({
      label: subject.name,
      data: [subject.ca1, subject.ca2, subject.ca3],
      borderColor: `hsl(${idx * 60}, 70%, 50%)`,
      backgroundColor: `hsla(${idx * 60}, 70%, 50%, 0.1)`,
      fill: true,
      tension: 0.4
    }))
  } : {
    labels: caImprovementLabels,
    datasets: []
  };

  // Subject Distribution - CA Average only
  const subjectDistribution = subjects.length > 0 ? {
    labels: subjects.map(s => {
      const caAvg = (s.ca1 + s.ca2 + s.ca3) / 3;
      return `${s.name} (${Math.round(caAvg)}%)`;
    }),
    datasets: [{
      data: subjects.map(s => {
        const caAvg = (s.ca1 + s.ca2 + s.ca3) / 3;
        return Math.round(caAvg);
      }),
      backgroundColor: [
        'rgba(99, 102, 241, 0.8)',
        'rgba(168, 85, 247, 0.8)',
        'rgba(34, 197, 94, 0.8)',
        'rgba(59, 130, 246, 0.8)',
        'rgba(249, 115, 22, 0.8)'
      ],
      borderWidth: 0
    }]
  } : {
    labels: [],
    datasets: []
  };

  // My vs Class Average
  const subjectsForComparison = studentMarks?.map(m => ({
    name: m.subject_name,
    myAvg: Math.round(((m.ca1 || 0) + (m.ca2 || 0) + (m.ca3 || 0)) / 3)
  })) || [];

  const classAverageBySubject = classData && classData.allMarks ? 
    classData.allMarks.reduce((acc, mark) => {
      const subjectName = mark.subject_name;
      if (!acc[subjectName]) {
        acc[subjectName] = { total: 0, count: 0 };
      }
      const avg = ((mark.ca1 || 0) + (mark.ca2 || 0) + (mark.ca3 || 0)) / 3;
      acc[subjectName].total += avg;
      acc[subjectName].count += 1;
      return acc;
    }, {})
    : {};

  const myVsClassAverageData = subjectsForComparison.length > 0 ? {
    labels: subjectsForComparison.map(s => s.name),
    datasets: [
      {
        label: 'My Mark',
        data: subjectsForComparison.map(s => s.myAvg),
        type: 'bar',
        backgroundColor: 'rgba(186, 51, 211, 0.85)',
        borderColor: 'rgba(147, 20, 184, 1)',
        borderWidth: 2,
        yAxisID: 'y'
      },
      {
        label: 'Class Average',
        data: subjectsForComparison.map(s => classAverageBySubject[s.name] ? Math.round(classAverageBySubject[s.name].total / classAverageBySubject[s.name].count) : 0),
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <Navbar user={{ name: 'Student', role: 'Student' }} onMenuToggle={setMobileMenuOpen} />
      
      <div className="flex">
        <Sidebar isAdmin={false} mobileOpen={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} />
        
        <main className="flex-1 p-4 sm:p-6">
          {loading ? (
            <div className="flex items-center justify-center h-screen">
              <p className="text-white text-xl">Loading analytics data...</p>
            </div>
          ) : !studentData ? (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-6">
              <p className="text-red-400">Error: Unable to load student data. Please try again.</p>
            </div>
          ) : subjects.length === 0 ? (
            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-6">
              <p className="text-yellow-400">No marks data available. Please contact your instructor.</p>
            </div>
          ) : (
            <>
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">My Analytics</h1>
            <p className="text-sm sm:text-base text-gray-400">Detailed performance analysis with CA exam tracking</p>
          </motion.div>

          {/* CA Performance KPIs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <h2 className="text-xl sm:text-2xl font-bold text-white mb-4">CA Exam Performance</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6">
              <CircularKPI
                value={subjects.length > 0 ? Math.round(subjects.reduce((sum, s) => sum + s.ca1, 0) / subjects.length) : 0}
                maxValue={100}
                label="CA1 Average"
                icon={FaClipboardCheck}
                color="orange"
                delay={0}
              />
              <CircularKPI
                value={subjects.length > 0 ? Math.round(subjects.reduce((sum, s) => sum + s.ca2, 0) / subjects.length) : 0}
                maxValue={100}
                label="CA2 Average"
                icon={FaClipboardCheck}
                color="purple"
                delay={0.1}
              />
              <CircularKPI
                value={subjects.length > 0 ? Math.round(subjects.reduce((sum, s) => sum + s.ca3, 0) / subjects.length) : 0}
                maxValue={100}
                label="CA3 Average"
                icon={FaClipboardCheck}
                color="green"
                delay={0.2}
              />
              <CircularKPI
                value={subjects.length > 0 ? Math.round(subjects.reduce((sum, s) => sum + s.semester, 0) / subjects.length) : 0}
                maxValue={100}
                label="Semester Average"
                icon={FaTrophy}
                color="blue"
                delay={0.3}
              />
            </div>
          </motion.div>

          {/* Semester Progress and Distribution */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6"
          >
            <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-6">
              <h3 className="text-xl font-semibold text-white mb-2">📈 CA Trends</h3>
              <p className="text-xs text-gray-500 mb-4">Your CA progress across all three assessments</p>
              <div className="h-80">
                <LineChart data={semesterData} />
              </div>
            </div>

            <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-6">
              <h3 className="text-xl font-semibold text-white mb-4">Subject Score Distribution</h3>
              <div className="h-80 max-w-md mx-auto">
                <DoughnutChart data={subjectDistribution} />
              </div>
            </div>
          </motion.div>

          {/* My vs Class Average */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-6 mt-6"
          >
            <h3 className="text-xl font-semibold text-white mb-2">My vs Class Average (Per Subject)</h3>
            <p className="text-sm text-gray-400 mb-4">Compare your performance with class average on each subject</p>
            <div className="h-80 mb-4">
              {myVsClassAverageData.labels.length > 0 ? (
                <BarChart data={myVsClassAverageData} />
              ) : (
                <div className="flex items-center justify-center h-full text-gray-400">
                  No subject data available
                </div>
              )}
            </div>
            
            {/* Subject-wise Comparison Table */}
            {subjectsForComparison.length > 0 && (
              <div className="pt-4 border-t border-white/10">
                <h4 className="text-sm font-semibold text-white mb-3">Subject-wise Performance Comparison</h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-white/10">
                        <th className="text-left px-3 py-2 text-gray-400">Subject</th>
                        <th className="text-center px-3 py-2 text-gray-400">My Average</th>
                        <th className="text-center px-3 py-2 text-gray-400">Class Average</th>
                        <th className="text-center px-3 py-2 text-gray-400">Difference</th>
                      </tr>
                    </thead>
                    <tbody>
                      {subjectsForComparison.map((subject, idx) => {
                        const classAvg = classAverageBySubject[subject.name] 
                          ? Math.round(classAverageBySubject[subject.name].total / classAverageBySubject[subject.name].count)
                          : 0;
                        const difference = subject.myAvg - classAvg;
                        const isAbove = difference > 0;
                        
                        return (
                          <tr key={idx} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                            <td className="px-3 py-2 text-gray-300">{subject.name}</td>
                            <td className="text-center px-3 py-2">
                              <span className="inline-block px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 font-semibold">
                                {subject.myAvg}
                              </span>
                            </td>
                            <td className="text-center px-3 py-2">
                              <span className="inline-block px-3 py-1 rounded-full bg-red-500/20 text-red-300 font-semibold">
                                {classAvg}
                              </span>
                            </td>
                            <td className="text-center px-3 py-2">
                              <span className={`inline-block px-3 py-1 rounded-full font-semibold ${
                                isAbove ? 'bg-green-500/20 text-green-300' : 'bg-orange-500/20 text-orange-300'
                              }`}>
                                {isAbove ? '+' : ''}{difference}
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
          </motion.div>
            </>
          )}
        </main>
      </div>
    </div>
  );
}