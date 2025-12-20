import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FaUser, FaCalendar, FaGraduationCap } from 'react-icons/fa';

export default function StudentLogin() {
  const [registerNo, setRegisterNo] = useState('');
  const [dob, setDob] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Format date from YYYY-MM-DD to DD-MM-YYYY
      let formattedDob = dob;
      if (dob.includes('-')) {
        const [year, month, day] = dob.split('-');
        formattedDob = `${day}-${month}-${year}`;
      }

      console.log('[STUDENT LOGIN] Credentials:', {
        register_no: registerNo,
        date_of_birth: formattedDob,
        original_dob: dob
      });

      // Call backend DOB-based login
      const response = await fetch('http://localhost:8000/api/v1/auth/student/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          register_no: registerNo,
          date_of_birth: formattedDob
        })
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.detail || 'Login failed');
      }

      const data = await response.json();
      
      // Store authentication data
      localStorage.setItem('token', data.access_token);
      localStorage.setItem('studentId', data.user_id);
      localStorage.setItem('registerNo', registerNo);
      localStorage.setItem('userEmail', data.email || '');
      
      // Fetch student data to get batch_year
      const dashboardRes = await fetch('http://localhost:8000/api/v1/student/dashboard', {
        headers: { 'Authorization': `Bearer ${data.access_token}` }
      });
      
      if (dashboardRes.ok) {
        const dashboardData = await dashboardRes.json();
        localStorage.setItem('batch', dashboardData.batch_year);
      }
      
      navigate('/student/dashboard');
    } catch (err) {
      setError(err.message || 'Invalid Register Number or Date of Birth');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-blue-900 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated Background Elements */}
      <motion.div
        animate={{
          scale: [1, 1.2, 1],
          rotate: [0, 90, 0],
        }}
        transition={{ duration: 20, repeat: Infinity }}
        className="absolute top-0 left-0 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl"
      />
      <motion.div
        animate={{
          scale: [1, 1.3, 1],
          rotate: [0, -90, 0],
        }}
        transition={{ duration: 15, repeat: Infinity }}
        className="absolute bottom-0 right-0 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl"
      />

      <div className="max-w-md w-full relative z-10">
        {/* Logo/Brand */}
        <motion.div 
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <motion.div
            animate={{ rotate: [0, 360] }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="inline-block mb-4"
          >
            <FaGraduationCap className="text-6xl text-white" />
          </motion.div>
          <h1 className="text-4xl font-bold text-white mb-2">EduAnalytics</h1>
          <p className="text-indigo-200">Student Performance Analytics</p>
        </motion.div>

        {/* Login Card */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl p-8 border border-white/20"
        >
          <h2 className="text-2xl font-semibold text-white mb-6">Student Login</h2>

          {error && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-200 text-sm"
            >
              {error}
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Register Number */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
            >
              <label className="block text-sm font-medium text-indigo-200 mb-2">
                Register Number
              </label>
              <div className="relative">
                <FaUser className="absolute left-3 top-1/2 -translate-y-1/2 text-indigo-300" />
                <input
                  type="text"
                  value={registerNo}
                  onChange={(e) => setRegisterNo(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                  placeholder="Enter your register number"
                  required
                />
              </div>
            </motion.div>

            {/* Date of Birth */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
            >
              <label className="block text-sm font-medium text-indigo-200 mb-2">
                Date of Birth
              </label>
              <div className="relative">
                <FaCalendar className="absolute left-3 top-1/2 -translate-y-1/2 text-indigo-300" />
                <input
                  type="date"
                  value={dob}
                  onChange={(e) => setDob(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                  required
                />
              </div>
            </motion.div>

            {/* Submit Button */}
            <motion.button
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
            >
              {loading ? 'Logging in...' : 'Login'}
            </motion.button>
          </form>

          {/* Admin Login Link */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="mt-6 text-center"
          >
            <Link 
              to="/auth/admin-login" 
              className="text-indigo-300 hover:text-indigo-200 text-sm transition-colors"
            >
              Login as Admin →
            </Link>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
