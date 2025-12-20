import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Navbar from '../../components/common/Navbar';
import Sidebar from '../../components/common/Sidebar';
import StatCard from '../../components/cards/StatCard';
import CircularKPI from '../../components/cards/CircularKPI';
import BarChart from '../../components/charts/BarChart';
import LineChart from '../../components/charts/LineChart';
import DoughnutChart from '../../components/charts/DoughnutChart';
import RadarChart from '../../components/charts/RadarChart';
import { FaUsers, FaChartBar, FaDatabase, FaGraduationCap, FaClipboardCheck, FaBookOpen, FaTrophy, FaChartPie } from 'react-icons/fa';
import { calculateMarkDistribution, getDistributionStats } from '../../utils/markDistribution';

export default function AdminDashboard() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [markDistributionData, setMarkDistributionData] = useState(null);
  const [distributionStats, setDistributionStats] = useState(null);

  // Fetch all students' marks for distribution
  useEffect(() => {
    const fetchMarkDistribution = async () => {
      try {
        // Fetch all students
        const studentsRes = await fetch('http://localhost:8000/api/v1/admin/all-students?batch_year=2024');
        const studentsData = await studentsRes.json();
        
        let allMarks = [];
        
        // Fetch marks for each student
        for (const student of studentsData.students) {
          const marksRes = await fetch(`http://localhost:8000/api/v1/admin/students/${student.student_id}/marks`);
          const marksData = await marksRes.json();
          if (marksData.marks) {
            allMarks = [...allMarks, ...marksData.marks];
          }
        }

        // Calculate distribution
        const distribution = calculateMarkDistribution(allMarks);
        setMarkDistributionData(distribution);
        setDistributionStats(getDistributionStats(allMarks));
      } catch (err) {
        console.error('Error fetching mark distribution:', err);
      }
    };

    fetchMarkDistribution();
  }, []);

  const batchComparisonData = {
    labels: ['Math', 'Physics', 'Chemistry', 'CS', 'English'],
    datasets: [
      {
        label: 'Batch 2023',
        data: [75, 82, 78, 85, 80],
        backgroundColor: 'rgba(99, 102, 241, 0.7)',
      },
      {
        label: 'Batch 2024',
        data: [80, 85, 82, 88, 83],
        backgroundColor: 'rgba(168, 85, 247, 0.7)',
      }
    ]
  };

  const performanceTrendData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [{
      label: 'Class Average',
      data: [72, 75, 78, 80, 82, 85],
      borderColor: 'rgb(99, 102, 241)',
      backgroundColor: 'rgba(99, 102, 241, 0.1)',
      fill: true,
      tension: 0.4
    }]
  };

  const passRateData = {
    labels: ['Passed', 'Failed', 'Distinction'],
    datasets: [{
      data: [75, 10, 15],
      backgroundColor: [
        'rgba(34, 197, 94, 0.8)',
        'rgba(239, 68, 68, 0.8)',
        'rgba(99, 102, 241, 0.8)'
      ],
      borderWidth: 0
    }]
  };

  // CA Exam Analytics
  const hasSemesterData = true; // TODO: Replace with actual API check
  
  const caComparisonData = {
    labels: ['Math', 'Physics', 'Chemistry', 'CS', 'English'],
    datasets: [
      {
        label: 'CA1 Avg',
        data: [72, 75, 70, 78, 74],
        backgroundColor: 'rgba(249, 115, 22, 0.7)',
      },
      {
        label: 'CA2 Avg',
        data: [76, 78, 74, 82, 77],
        backgroundColor: 'rgba(168, 85, 247, 0.7)',
      },
      {
        label: 'CA3 Avg',
        data: [79, 81, 77, 85, 80],
        backgroundColor: 'rgba(34, 197, 94, 0.7)',
      },
      ...(hasSemesterData ? [{
        label: 'Semester Avg',
        data: [80, 85, 82, 88, 83],
        backgroundColor: 'rgba(59, 130, 246, 0.7)',
      }] : [])
    ]
  };

  // CA Progress Trend
  const caProgressData = {
    labels: ['CA1', 'CA2', 'CA3', 'Semester'],
    datasets: [{
      label: 'Overall Average',
      data: [74, 77, 80, 84],
      borderColor: 'rgb(34, 197, 94)',
      backgroundColor: 'rgba(34, 197, 94, 0.1)',
      fill: true,
      tension: 0.4,
      pointRadius: 6,
      pointHoverRadius: 8
    }]
  };

  // Subject-wise CA Performance Radar
  const subjectRadarData = {
    labels: ['Math', 'Physics', 'Chemistry', 'CS', 'English'],
    datasets: [
      {
        label: 'CA Average',
        data: [75.5, 78, 73.5, 81.5, 77],
        backgroundColor: 'rgba(168, 85, 247, 0.2)',
        borderColor: 'rgba(168, 85, 247, 1)',
        borderWidth: 2
      },
      {
        label: 'Semester Average',
        data: [80, 85, 82, 88, 83],
        backgroundColor: 'rgba(59, 130, 246, 0.2)',
        borderColor: 'rgba(59, 130, 246, 1)',
        borderWidth: 2
      }
    ]
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <Navbar user={{ name: 'Admin', role: 'Administrator' }} onMenuToggle={setMobileMenuOpen} />
      
      <div className="flex">
        <Sidebar isAdmin={true} mobileOpen={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} />
        
        <main className="flex-1 min-h-screen bg-gray-900 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          <div className="w-full max-w-7xl mx-auto">
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-8"
            >
              <h1 className="text-4xl font-bold text-white mb-2">Admin Dashboard 📊</h1>
              <p className="text-gray-400 text-lg">Monitor student performance, batch analytics, and system overview</p>
            </motion.div>

          <div className="mb-6">
            <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">Admin Dashboard</h1>
            <p className="text-sm sm:text-base text-gray-400">Overview of student performance and analytics</p>
          </div>

          {/* Stats Grid */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6"
          >
            <StatCard 
              title="Total Students"
              value="2,345"
              icon={FaUsers}
              color="indigo"
              trend={{ direction: 'up', value: '+12%' }}
            />
            <StatCard 
              title="Avg Performance"
              value="82.4%"
              icon={FaChartBar}
              color="green"
              trend={{ direction: 'up', value: '+5.2%' }}
            />
            <StatCard 
              title="Active Batches"
              value="8"
              icon={FaGraduationCap}
              color="purple"
            />
            <StatCard 
              title="Total Records"
              value="12.5K"
              icon={FaDatabase}
              color="blue"
            />
          </motion.div>

          {/* Circular KPIs for CA Performance */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <h2 className="text-2xl font-bold text-white mb-4">CA Exam Performance Overview</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
              <CircularKPI
                value={74}
                maxValue={100}
                label="CA1 Average"
                icon={FaClipboardCheck}
                color="orange"
                delay={0}
              />
              <CircularKPI
                value={77}
                maxValue={100}
                label="CA2 Average"
                icon={FaClipboardCheck}
                color="purple"
                delay={0.1}
              />
              <CircularKPI
                value={80}
                maxValue={100}
                label="CA3 Average"
                icon={FaClipboardCheck}
                color="green"
                delay={0.2}
              />
              <CircularKPI
                value={84}
                maxValue={100}
                label="Semester Average"
                icon={FaTrophy}
                color="blue"
                delay={0.3}
              />
            </div>
          </motion.div>

          {/* CA vs Semester Comparison */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6"
          >
            <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-6">
              <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                <FaBookOpen className="text-indigo-400" />
                CA Exams vs Semester Performance
              </h3>
              {!hasSemesterData && (
                <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3 mb-4">
                  <p className="text-yellow-400 text-sm flex items-center gap-2">
                    <span>📊</span>
                    <span>Semester data not yet updated - Displaying CA exam results only</span>
                  </p>
                </div>
              )}
              <div className="h-80">
                <BarChart data={caComparisonData} />
              </div>
            </div>

            <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-6">
              <h3 className="text-xl font-semibold text-white mb-4">CA Progress Trend</h3>
              <div className="h-80">
                <LineChart data={caProgressData} />
              </div>
            </div>
          </motion.div>

          {/* Charts Grid */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6"
          >
            <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-6">
              <h3 className="text-xl font-semibold text-white mb-4">Batch Comparison</h3>
              <div className="h-80">
                <BarChart data={batchComparisonData} />
              </div>
            </div>

            <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-6">
              <h3 className="text-xl font-semibold text-white mb-4">Performance Trend</h3>
              <div className="h-80">
                <LineChart data={performanceTrendData} />
              </div>
            </div>
          </motion.div>

          {/* Subject Radar & Pass Rate */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6"
          >
            <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-6">
              <h3 className="text-xl font-semibold text-white mb-4">Subject-wise Analysis</h3>
              <div className="h-80">
                <RadarChart data={subjectRadarData} />
              </div>
            </div>

            <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-6">
              <h3 className="text-xl font-semibold text-white mb-4">Pass Rate Distribution</h3>
              <div className="h-80 max-w-md mx-auto">
                <DoughnutChart data={passRateData} />
              </div>
            </div>
          </motion.div>

          {/* Mark Distribution */}
          {markDistributionData && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6"
            >
              <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-6">
                <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                  <FaChartPie className="text-yellow-400" />
                  Mark Distribution
                </h3>
                <div className="h-80">
                  <BarChart data={markDistributionData} />
                </div>
              </div>

              <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-6">
                <h3 className="text-xl font-semibold text-white mb-4">Distribution Statistics</h3>
                {distributionStats && (
                  <div className="space-y-4">
                    <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-lg p-4">
                      <p className="text-gray-400 text-sm">Average Mark</p>
                      <p className="text-3xl font-bold text-indigo-400">{distributionStats.average}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
                        <p className="text-gray-400 text-sm">Highest</p>
                        <p className="text-2xl font-bold text-green-400">{distributionStats.highest}</p>
                      </div>
                      <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
                        <p className="text-gray-400 text-sm">Lowest</p>
                        <p className="text-2xl font-bold text-red-400">{distributionStats.lowest}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
                        <p className="text-gray-400 text-sm">Pass Rate</p>
                        <p className="text-2xl font-bold text-blue-400">{distributionStats.passRate}%</p>
                      </div>
                      <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-4">
                        <p className="text-gray-400 text-sm">Distinction Rate</p>
                        <p className="text-2xl font-bold text-purple-400">{distributionStats.distinctionRate}%</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}
}
