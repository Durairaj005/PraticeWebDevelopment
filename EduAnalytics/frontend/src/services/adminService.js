import api from './api';

export const uploadCSV = async (file, batchType) => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('batchType', batchType);
  
  const response = await api.post('/admin/upload-csv', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  return response.data;
};

export const getAdminDashboard = async () => {
  const response = await api.get('/admin/dashboard');
  return response.data;
};

export const compareStudents = async (student1Id, student2Id) => {
  const response = await api.get('/admin/compare-students', {
    params: { student1: student1Id, student2: student2Id }
  });
  return response.data;
};

export const compareBatches = async (batch1, batch2) => {
  const response = await api.get('/admin/compare-batches', {
    params: { batch1, batch2 }
  });
  return response.data;
};
