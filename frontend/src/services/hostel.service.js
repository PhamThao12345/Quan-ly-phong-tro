import apiClient from './apiClient';

export const getHostels = async (search = '') => {
  const res = await apiClient.get('/hostels', { params: { search } });
  return res.data.data;
};

export const createHostel = async (data) => {
  const res = await apiClient.post('/hostels', data);
  return res.data.data;
};

export const updateHostel = async (id, data) => {
  const res = await apiClient.put(`/hostels/${id}`, data);
  return res.data.data;
};

export const deleteHostel = async (id) => {
  const res = await apiClient.delete(`/hostels/${id}`);
  return res.data.data;
};
