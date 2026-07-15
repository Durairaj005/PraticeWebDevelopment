import { FaTrophy, FaMedal } from 'react-icons/fa';

export default function StudentCard({ student, rank, showRank = true, type = 'ca' }) {
  const getRankBadge = (rank) => {
    if (rank === 1) return { icon: FaTrophy, color: 'text-yellow-400', bg: 'bg-yellow-500/20' };
    if (rank === 2) return { icon: FaMedal, color: 'text-gray-300', bg: 'bg-gray-500/20' };
    if (rank === 3) return { icon: FaMedal, color: 'text-orange-400', bg: 'bg-orange-500/20' };
    return null;
  };

  const badge = rank && getRankBadge(rank);
  
  // Get the appropriate average based on type
  const getAverageDisplay = () => {
    if (type === 'semester') {
      return student.semesterAverage || student.average || 0;
    }
    return student.caAverage || student.average || 0;
  };
  
  const averageValue = getAverageDisplay();

  return (
    <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-5 hover:bg-white/10 transition-all duration-200">
      <div className="flex items-center gap-4">
        {/* Rank */}
        {showRank && (
          <div className="flex-shrink-0">
            {badge ? (
              <div className={`w-12 h-12 ${badge.bg} rounded-lg flex items-center justify-center`}>
                <badge.icon className={`text-2xl ${badge.color}`} />
              </div>
            ) : (
              <div className="w-12 h-12 bg-white/5 rounded-lg flex items-center justify-center">
                <span className="text-xl font-bold text-gray-400">#{rank}</span>
              </div>
            )}
          </div>
        )}

        {/* Student Info */}
        <div className="flex-1 min-w-0">
          <h4 className="text-white font-semibold text-lg truncate">{student.name}</h4>
          <p className="text-gray-400 text-sm">{student.registerNo}</p>
        </div>

        {/* Average Score */}
        <div className="text-right">
          <div className="text-2xl font-bold text-white">
            {averageValue > 0 ? `${averageValue}%` : '--'}
          </div>
          <p className="text-xs text-gray-400">
            {averageValue > 0 ? (type === 'semester' ? 'Semester' : 'CA Avg') : 'No Data'}
          </p>
        </div>
      </div>
    </div>
  );
}
