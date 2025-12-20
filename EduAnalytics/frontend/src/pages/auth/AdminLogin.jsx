import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FaGoogle, FaShieldAlt } from 'react-icons/fa';
import { signInWithPopup } from 'firebase/auth';
import { auth, googleProvider } from '../../config/firebase';
import { useAuth } from '../../context/AuthContext';

export default function AdminLogin() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError('');
    
    try {
      // Sign in with Google using Firebase
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      
      // Get the Firebase ID token
      const idToken = await user.getIdToken();
      
      // Send the token to your backend
      const response = await fetch('http://localhost:8000/api/v1/auth/admin/google-login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id_token: idToken }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Login failed');
      }
      
      const data = await response.json();
      
      // Store the JWT token and user data
      login(data.access_token, {
        id: data.user_id,
        email: data.email,
        role: data.role
      });
      
      // Navigate to admin dashboard
      navigate('/admin/dashboard');
      
    } catch (err) {
      console.error('Login failed:', err);
      setError(err.message || 'Failed to sign in with Google. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated Background */}
      <motion.div
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.3, 0.5, 0.3],
        }}
        transition={{ duration: 10, repeat: Infinity }}
        className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl"
      />
      <motion.div
        animate={{
          scale: [1, 1.3, 1],
          opacity: [0.3, 0.5, 0.3],
        }}
        transition={{ duration: 12, repeat: Infinity }}
        className="absolute bottom-0 left-0 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl"
      />

      <div className="max-w-md w-full relative z-10">
        {/* Logo/Brand */}
        <motion.div 
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <motion.div
            animate={{ 
              rotateY: [0, 360],
            }}
            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
            className="inline-block mb-4"
          >
            <FaShieldAlt className="text-6xl text-indigo-400" />
          </motion.div>
          <h1 className="text-4xl font-bold text-white mb-2">EduAnalytics</h1>
          <p className="text-gray-400">Admin Portal</p>
        </motion.div>

        {/* Login Card */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="bg-white/5 backdrop-blur-lg rounded-2xl shadow-2xl p-8 border border-white/10"
        >
          <h2 className="text-2xl font-semibold text-white mb-6">Admin Login</h2>
          
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-gray-400 text-sm mb-6"
          >
            Sign in with your Google account to access the admin dashboard.
          </motion.p>

          {/* Error Message */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4 p-3 bg-red-500/10 border border-red-500/50 rounded-lg text-red-400 text-sm"
            >
              {error}
            </motion.div>
          )}

          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            whileHover={{ scale: 1.05, boxShadow: "0 20px 40px rgba(0,0,0,0.3)" }}
            whileTap={{ scale: 0.95 }}
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full py-3 bg-white hover:bg-gray-100 text-gray-900 font-semibold rounded-lg transition-all duration-200 flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed shadow-xl"
          >
            <FaGoogle className="text-xl text-red-500" />
            {loading ? 'Signing in...' : 'Sign in with Google'}
          </motion.button>

          {/* Student Login Link */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-6 text-center"
          >
            <Link 
              to="/auth/student-login" 
              className="text-gray-400 hover:text-gray-300 text-sm transition-colors"
            >
              ← Back to Student Login
            </Link>
          </motion.div>
        </motion.div>

        {/* Security Note */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="mt-4 text-center text-xs text-gray-500"
        >
          <FaShieldAlt className="inline mr-1" />
          Secure OAuth 2.0 Authentication
        </motion.div>
      </div>
    </div>
  );
}
