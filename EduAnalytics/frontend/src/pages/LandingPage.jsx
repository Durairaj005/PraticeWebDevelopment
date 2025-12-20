import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { FaGraduationCap, FaChartLine, FaUsers, FaClipboardCheck, FaLock, FaArrowRight } from 'react-icons/fa';

export default function LandingPage() {
  const features = [
    {
      icon: FaChartLine,
      title: 'Performance Analytics',
      description: 'Track and analyze student performance with detailed charts and insights'
    },
    {
      icon: FaClipboardCheck,
      title: 'CA Exam Tracking',
      description: 'Monitor CA1, CA2, CA3 and semester results in real-time'
    },
    {
      icon: FaUsers,
      title: 'Batch Comparison',
      description: 'Compare performance across different batches and semesters'
    },
    {
      icon: FaGraduationCap,
      title: 'Student Portal',
      description: 'Students can view their performance, rankings, and download reports'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-indigo-900 to-purple-900 overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{ duration: 8, repeat: Infinity }}
          className="absolute top-20 left-20 w-96 h-96 bg-indigo-500/30 rounded-full blur-3xl"
        />
        <motion.div
          animate={{
            scale: [1.2, 1, 1.2],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{ duration: 10, repeat: Infinity }}
          className="absolute bottom-20 right-20 w-96 h-96 bg-purple-500/30 rounded-full blur-3xl"
        />
      </div>

      {/* Navigation */}
      <nav className="relative z-10 flex justify-between items-center px-8 py-6">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-3"
        >
          <FaGraduationCap className="text-4xl text-indigo-400" />
          <span className="text-2xl font-bold text-white">EduAnalytics</span>
        </motion.div>
      </nav>

      {/* Hero Section */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-[calc(100vh-100px)] px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-center max-w-4xl"
        >
          <h1 className="text-6xl md:text-7xl font-bold text-white mb-6">
            Student Performance
            <span className="block bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
              Analytics Platform
            </span>
          </h1>
          <p className="text-xl text-gray-300 mb-12 max-w-2xl mx-auto">
            Comprehensive analytics dashboard for tracking student performance, CA exams, 
            and generating detailed reports with beautiful visualizations.
          </p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="flex flex-col sm:flex-row gap-6 justify-center items-center"
          >
            <Link to="/auth/student-login">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold rounded-xl shadow-2xl shadow-indigo-500/50 hover:shadow-indigo-500/70 transition-all"
              >
                <FaGraduationCap className="text-xl" />
                Student Login
                <FaArrowRight />
              </motion.button>
            </Link>

            <Link to="/auth/admin-login">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="flex items-center gap-3 px-8 py-4 bg-white/10 backdrop-blur-sm border-2 border-white/20 text-white font-semibold rounded-xl hover:bg-white/20 transition-all"
              >
                <FaLock className="text-xl" />
                Admin Login
                <FaArrowRight />
              </motion.button>
            </Link>
          </motion.div>
        </motion.div>

        {/* Features Grid */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-20 w-full max-w-6xl"
        >
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 + index * 0.1 }}
              whileHover={{ y: -5 }}
              className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6 hover:bg-white/10 transition-all"
            >
              <feature.icon className="text-4xl text-indigo-400 mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">{feature.title}</h3>
              <p className="text-sm text-gray-400">{feature.description}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>

      {/* Footer */}
      <div className="relative z-10 text-center py-8 text-gray-400 text-sm">
        <p>&copy; 2025 EduAnalytics. All rights reserved.</p>
      </div>
    </div>
  );
}
