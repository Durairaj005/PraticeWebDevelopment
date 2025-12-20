import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import { 
  FaChartBar, 
  FaUser, 
  FaDatabase, 
  FaCompressArrowsAlt, 
  FaChartLine,
  FaCog,
  FaTrophy,
  FaUsers,
  FaExchangeAlt,
  FaTimes,
  FaEdit
} from 'react-icons/fa';

export default function Sidebar({ isAdmin, mobileOpen, onClose }) {
  const location = useLocation();
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const studentLinks = [
    { path: '/student/dashboard', icon: FaChartBar, label: 'Dashboard' },
    { path: '/student/analytics', icon: FaChartLine, label: 'My Analytics' },
    { path: '/student/class-performance', icon: FaUsers, label: 'Semester Analytics' },
    { path: '/student/leaderboard', icon: FaTrophy, label: 'Leaderboard' },
  ];

  const adminLinks = [
    { path: '/admin/database', icon: FaDatabase, label: 'Database Management' },
    { path: '/admin/marks-edit', icon: FaEdit, label: 'Marks Edit Dashboard' },
    { path: '/admin/comparison', icon: FaCompressArrowsAlt, label: 'Student Comparison' },
    { path: '/admin/batch-comparison', icon: FaExchangeAlt, label: 'Batch Comparison' },
  ];

  const links = isAdmin ? adminLinks : studentLinks;

  const containerVariants = {
    hidden: { opacity: 0, x: -50 },
    visible: {
      opacity: 1,
      x: 0,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { x: -20, opacity: 0 },
    visible: { x: 0, opacity: 1 }
  };

  return (
    <>
      {/* Mobile Overlay */}
      <AnimatePresence>
        {isMobile && mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside 
        initial={isMobile ? { x: -300 } : "visible"}
        animate={isMobile ? (mobileOpen ? { x: 0 } : { x: -300 }) : "visible"}
        variants={containerVariants}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className={`
          ${isMobile ? 'fixed left-0 top-0 bottom-0 z-50' : 'relative'}
          w-64 bg-gray-900/95 backdrop-blur-xl border-r border-white/10 min-h-screen overflow-y-auto
        `}
      >
        {/* Mobile Close Button */}
        {isMobile && (
          <div className="flex justify-end p-4 lg:hidden">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={onClose}
              className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-white"
            >
              <FaTimes className="text-xl" />
            </motion.button>
          </div>
        )}

        <div className="p-6 space-y-2">
        {links.map((link, index) => {
          const Icon = link.icon;
          const isActive = location.pathname === link.path;
          
          return (
            <motion.div
              key={link.path}
              variants={itemVariants}
              whileHover={{ scale: 1.05, x: 5 }}
              whileTap={{ scale: 0.95 }}
            >
              <Link
                to={link.path}
                onClick={() => isMobile && onClose && onClose()}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                  isActive
                    ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-500/50'
                    : 'text-gray-400 hover:bg-white/5 hover:text-white'
                }`}
              >
                <motion.div
                  animate={isActive ? { rotate: [0, 10, -10, 0] } : {}}
                  transition={{ duration: 0.5 }}
                >
                  <Icon className="text-lg" />
                </motion.div>
                <span className="font-medium">{link.label}</span>
              </Link>
            </motion.div>
          );
        })}
      </div>
    </motion.aside>    </>  );
}
