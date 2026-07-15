import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Fingerprint, Loader2, Sparkles, ShieldCheck, TrendingUp } from 'lucide-react';
import { AreaChart, Area, Tooltip, ResponsiveContainer } from 'recharts';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const getDashboardPath = (role?: string) => {
  switch (role) {
    case 'admin':
      return '/admin-dashboard';
    case 'hod':
      return '/hod-dashboard';
    default:
      return '/dashboard';
  }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
};

const dummyChartData = [
  { name: 'Mon', resolved: 12 },
  { name: 'Tue', resolved: 19 },
  { name: 'Wed', resolved: 15 },
  { name: 'Thu', resolved: 22 },
  { name: 'Fri', resolved: 28 },
  { name: 'Sat', resolved: 25 },
  { name: 'Sun', resolved: 35 },
];

const Login = () => {
  const [email, setEmail] = useState('student@insightos.edu');
  const [password, setPassword] = useState('testpassword123');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const formData = new URLSearchParams();
      formData.append('username', email); // OAuth2 expects 'username'
      formData.append('password', password);

      const response = await api.post('/auth/login', formData, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      });

      const user = await login(response.data.access_token);
      navigate(getDashboardPath(user?.role), { replace: true });
    } catch (err: any) {
      console.error('Login Error:', err);
      
      let errorMessage = 'Failed to login. Please try again.';
      if (err.response?.data?.detail) {
        errorMessage = typeof err.response.data.detail === 'string' 
          ? err.response.data.detail 
          : JSON.stringify(err.response.data.detail);
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-slate relative overflow-hidden">
      {/* LEFT SIDE - BRANDING (Hidden on Mobile) */}
      <div className="hidden lg:flex w-1/2 relative flex-col justify-between p-12 overflow-hidden border-r border-white/5">
        {/* Dynamic Background Orbs */}
        <div className="absolute top-[20%] left-[10%] w-96 h-96 bg-primary/20 rounded-full blur-[120px] animate-orb" />
        <div className="absolute bottom-[20%] right-[10%] w-80 h-80 bg-secondary/20 rounded-full blur-[120px] animate-orb-delayed" />
        <div className="absolute top-[50%] left-[50%] w-64 h-64 bg-accent/10 rounded-full blur-[100px] animate-orb" style={{ animationDelay: '-3s' }} />

        {/* Top Logo Area */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8 }}
          className="relative z-10 flex items-center gap-3"
        >
          <div className="w-12 h-12 bg-gradient-to-tr from-primary to-secondary rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(0,240,255,0.3)]">
            <Sparkles className="text-white w-6 h-6" />
          </div>
          <span className="text-2xl font-bold tracking-tight text-white">InsightOS <span className="text-primary">Enterprise</span></span>
        </motion.div>

        {/* Middle Content */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="relative z-10 max-w-md"
        >
          <h1 className="text-5xl font-bold leading-tight mb-6 text-transparent bg-clip-text bg-gradient-to-br from-white to-white/60">
            Intelligent Campus Management
          </h1>
          <p className="text-lg text-white/70 mb-10 leading-relaxed">
            Experience the next generation of university administration. Powered by AI, designed for humans.
          </p>

          <div className="space-y-4">
            <div className="glass-panel p-4 flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-success/20 flex items-center justify-center border border-success/30">
                <ShieldCheck className="text-success w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold text-white">Bank-Grade Security</h3>
                <p className="text-sm text-white/50">Your data is encrypted and secure.</p>
              </div>
            </div>
            <div className="glass-panel p-4 flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-warning/20 flex items-center justify-center border border-warning/30">
                <TrendingUp className="text-warning w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold text-white">AI-Powered Analytics</h3>
                <p className="text-sm text-white/50">Real-time sentiment & trend analysis.</p>
              </div>
            </div>
          </div>

          {/* New Chart Section */}
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="mt-8 glass-panel p-6"
          >
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="font-semibold text-white">Issue Resolution Rate</h3>
                <p className="text-sm text-white/50">Weekly campus overview</p>
              </div>
              <div className="text-primary text-sm font-medium flex items-center gap-1 bg-primary/10 px-2 py-1 rounded-full">
                <TrendingUp className="w-3 h-3" /> +14%
              </div>
            </div>
            <div className="h-32 w-full" style={{ minHeight: 128 }}>
              <ResponsiveContainer width="100%" height="100%" minHeight={128}>
                <AreaChart data={dummyChartData}>
                  <defs>
                    <linearGradient id="colorResolved" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#00F0FF" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#00F0FF" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#12121A', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                    itemStyle={{ color: '#00F0FF' }}
                    cursor={{ stroke: 'rgba(255,255,255,0.1)' }}
                  />
                  <Area type="monotone" dataKey="resolved" stroke="#00F0FF" strokeWidth={2} fillOpacity={1} fill="url(#colorResolved)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </motion.div>
        </motion.div>

        {/* Bottom Footer */}
        <div className="relative z-10 text-white/40 text-sm">
          © {new Date().getFullYear()} InsightOS. All rights reserved.
        </div>
      </div>

      {/* RIGHT SIDE - AUTH FORM */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 relative">
        {/* Subtle background for right side mobile */}
        <div className="absolute inset-0 lg:hidden">
          <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-primary/20 rounded-full blur-[100px]" />
          <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-secondary/20 rounded-full blur-[100px]" />
        </div>

        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="show"
          className="w-full max-w-md z-10"
        >
          <motion.div variants={fadeUp} className="text-center mb-10">
            <div className="w-20 h-20 mx-auto bg-gradient-to-tr from-primary to-secondary rounded-2xl flex items-center justify-center shadow-lg shadow-primary/20 mb-6 relative overflow-hidden">
               <motion.div 
                 animate={{ scale: [1, 1.1, 1] }} 
                 transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
                 className="absolute inset-0 bg-white/20 blur-xl"
               />
              <Fingerprint className="text-white w-10 h-10 relative z-10" />
            </div>
            <h2 className="text-3xl font-bold text-white tracking-tight mb-2">Welcome Back</h2>
            <p className="text-white/60">Sign in to your InsightOS dashboard</p>
          </motion.div>

          <motion.div variants={fadeUp} className="glass-panel p-8">
            {error && (
              <div className="bg-danger/10 border border-danger/30 text-danger text-sm rounded-xl p-4 mb-6 flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-danger animate-pulse" />
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-white/80 mb-2 ml-1">Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input-field"
                  placeholder="you@university.edu"
                  required
                />
              </div>
              
              <div>
                <div className="flex justify-between items-center mb-2 ml-1">
                  <label className="block text-sm font-medium text-white/80">Password</label>
                  <a href="#" className="text-xs text-primary hover:text-white transition-colors">Forgot password?</a>
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-field tracking-widest"
                  placeholder="••••••••"
                  required
                />
              </div>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={isLoading}
                className="btn-primary w-full flex items-center justify-center mt-2 group"
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <span className="flex items-center gap-2">
                    Sign In
                    <Sparkles className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </span>
                )}
              </motion.button>
            </form>

            <div className="mt-8 pt-6 border-t border-white/5 text-center">
              <p className="text-sm text-white/50">
                Don't have an account?{' '}
                <Link to="/signup" className="text-primary hover:text-white font-medium transition-colors">
                  Create one now
                </Link>
              </p>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};

export default Login;
