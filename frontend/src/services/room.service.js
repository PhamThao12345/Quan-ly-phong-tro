import apiClient from './apiClient';

export const getRooms = async (page = 1, limit = 10, search = '') => {
  const res = await apiClient.get('/rooms', { params: { page, limit, search } });
  return res.data.data;
};

export const createRoom = async (data) => {
  const res = await apiClient.post('/rooms', data);
  return res.data.data;
};

export const updateRoom = async (id, data) => {
  const res = await apiClient.put(`/rooms/${id}`, data);
  return res.data.data;
};

export const deleteRoom = async (id) => {
  const res = await apiClient.delete(`/rooms/${id}`);
  return res.data.data;
};
