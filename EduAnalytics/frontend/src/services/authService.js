import api from './api';

export const studentLogin = async (registerNo, password) => {
  const response = await api.post('/auth/student/login', { registerNo, password });
  return response.data;
};

export const adminLogin = async (googleToken) => {
  const response = await api.post('/auth/admin/login', { token: googleToken });
  return response.data;
};

export const logout = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
};
