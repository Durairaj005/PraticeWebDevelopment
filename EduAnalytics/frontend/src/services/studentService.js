import api from './api';

export const getStudentDashboard = async () => {
  const response = await api.get('/student/dashboard');
  return response.data;
};

export const getStudentAnalytics = async () => {
  const response = await api.get('/student/analytics');
  return response.data;
};

export const getClassPerformance = async () => {
  const response = await api.get('/student/class-performance');
  return response.data;
};

export const getLeaderboard = async (semester) => {
  const response = await api.get('/student/leaderboard', { params: { semester } });
  return response.data;
};
