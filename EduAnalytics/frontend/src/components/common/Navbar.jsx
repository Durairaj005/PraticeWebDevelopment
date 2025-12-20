import { Link, useLocation, useNavigate } from 'react-router-dom';
import { FaUser, FaSignOutAlt, FaBars, FaTimes } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';

export default function Navbar({ user, onMenuToggle }) {
  const location = useLocation();
  const navigate = useNavigate();
  const isAdmin = location.pathname.startsWith('/admin');
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    if (isAdmin) {
      navigate('/auth/admin-login');
    } else {
      navigate('/auth/student-login');
    }
  };

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
    if (onMenuToggle) {
      onMenuToggle(!mobileMenuOpen);
    }
  };

  return (
    <motion.nav 
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: "spring", stiffness: 100, damping: 20 }}
      className={`sticky top-0 z-40 transition-all duration-300 ${
        scrolled 
          ? 'bg-gray-800/95 shadow-lg' 
          : 'bg-gray-800/90'
      } backdrop-blur-md border-b border-gray-700/50`}
    >
      {/* Simple bottom border accent */}
      <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-indigo-500/50 to-transparent" />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Mobile Menu Toggle */}
          <motion.button
            onClick={toggleMobileMenu}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="lg:hidden p-2 rounded-md bg-gray-700/50 hover:bg-gray-600/50 text-white transition-colors"
          >
            {mobileMenuOpen ? <FaTimes className="text-lg" /> : <FaBars className="text-lg" />}
          </motion.button>

          {/* Logo - Simplified */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
              <span className="font-bold text-white text-lg">EA</span>
            </div>
            
            <div className="hidden sm:block">
              <h1 className="text-lg font-bold text-white">
                EduAnalytics
              </h1>
              <p className="text-xs text-gray-400">
                {isAdmin ? 'Admin Portal' : 'Student Portal'}
              </p>
            </div>
          </div>

          {/* Action Buttons with advanced animations */}
          <div className="flex items-center gap-2">
            {/* User Profile with dropdown */}
            <div className="relative">
              <motion.button
                onClick={() => setShowUserMenu(!showUserMenu)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-700/50 hover:bg-gray-600/50 transition-colors"
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                  <FaUser className="text-white text-sm" />
                </div>
                
                <div className="hidden md:block text-left">
                  <p className="text-sm font-medium text-white">
                    {user?.name || 'User'}
                  </p>
                  <p className="text-xs text-gray-400">
                    {user?.role || (isAdmin ? 'Administrator' : 'Student')}
                  </p>
                </div>
              </motion.button>

              {/* User Dropdown Menu */}
              <AnimatePresence>
                {showUserMenu && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute right-0 mt-2 w-48 bg-gray-800 border border-gray-700 rounded-lg shadow-xl overflow-hidden"
                  >
                    <motion.button
                      whileHover={{ backgroundColor: 'rgba(239, 68, 68, 0.1)' }}
                      onClick={handleLogout}
                      className="w-full px-4 py-3 text-left text-sm text-red-400 hover:text-red-300 transition-colors flex items-center gap-3"
                    >
                      <FaSignOutAlt />
                      Logout
                    </motion.button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </motion.nav>
  );
}
