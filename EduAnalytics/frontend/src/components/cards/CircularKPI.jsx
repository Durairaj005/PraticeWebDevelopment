import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

export default function CircularKPI({ 
  value, 
  maxValue = 100, 
  label, 
  icon: Icon, 
  color = 'indigo',
  delay = 0 
}) {
  const [displayValue, setDisplayValue] = useState(0);
  const percentage = (value / maxValue) * 100;
  const circumference = 2 * Math.PI * 45; // radius = 45
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  // Color variants
  const colors = {
    indigo: {
      gradient: 'from-indigo-500 to-purple-600',
      stroke: '#6366f1',
      glow: 'shadow-indigo-500/50'
    },
    purple: {
      gradient: 'from-purple-500 to-pink-600',
      stroke: '#a855f7',
      glow: 'shadow-purple-500/50'
    },
    green: {
      gradient: 'from-green-500 to-emerald-600',
      stroke: '#22c55e',
      glow: 'shadow-green-500/50'
    },
    orange: {
      gradient: 'from-orange-500 to-red-600',
      stroke: '#f97316',
      glow: 'shadow-orange-500/50'
    },
    blue: {
      gradient: 'from-blue-500 to-cyan-600',
      stroke: '#3b82f6',
      glow: 'shadow-blue-500/50'
    }
  };

  const colorScheme = colors[color] || colors.indigo;

  // Animate number counting
  useEffect(() => {
    const duration = 2000;
    const steps = 60;
    const increment = value / steps;
    let current = 0;
    
    const timer = setInterval(() => {
      current += increment;
      if (current >= value) {
        setDisplayValue(value);
        clearInterval(timer);
      } else {
        setDisplayValue(Math.floor(current));
      }
    }, duration / steps);

    return () => clearInterval(timer);
  }, [value]);

  return (
    <motion.div
      initial={{ scale: 0, rotate: -180 }}
      animate={{ scale: 1, rotate: 0 }}
      transition={{ 
        delay,
        type: 'spring',
        stiffness: 100,
        damping: 15
      }}
      whileHover={{ scale: 1.05 }}
      className={`relative bg-gradient-to-br ${colorScheme.gradient} p-6 rounded-2xl shadow-xl ${colorScheme.glow}`}
    >
      <div className="relative z-10 flex flex-col items-center">
        {/* Circular Progress */}
        <div className="relative w-32 h-32">
          {/* Background Circle */}
          <svg className="w-full h-full transform -rotate-90">
            <circle
              cx="64"
              cy="64"
              r="45"
              stroke="rgba(255,255,255,0.1)"
              strokeWidth="8"
              fill="none"
            />
            {/* Progress Circle */}
            <motion.circle
              cx="64"
              cy="64"
              r="45"
              stroke={colorScheme.stroke}
              strokeWidth="8"
              fill="none"
              strokeLinecap="round"
              strokeDasharray={circumference}
              initial={{ strokeDashoffset: circumference }}
              animate={{ strokeDashoffset }}
              transition={{ duration: 2, delay, ease: 'easeOut' }}
            />
          </svg>

          {/* Center Content */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <Icon className="text-3xl text-white mb-1" />
            <motion.span 
              className="text-2xl font-bold text-white"
              key={displayValue}
            >
              {displayValue}
              <span className="text-sm">/{maxValue}</span>
            </motion.span>
          </div>
        </div>

        {/* Label */}
        <motion.p 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: delay + 0.5 }}
          className="mt-4 text-white font-semibold text-center"
        >
          {label}
        </motion.p>

        {/* Percentage Badge */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: delay + 1, type: 'spring' }}
          className="mt-2 px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full"
        >
          <span className="text-sm text-white font-medium">
            {percentage.toFixed(1)}%
          </span>
        </motion.div>
      </div>
    </motion.div>
  );
}
