import apiClient from './apiClient';

const getNotifications = async () => {
  const res = await apiClient.get('/notifications');
  return res.data;
};

const markAsRead = async (id) => {
  const res = await apiClient.put(`/notifications/${id}/read`);
  return res.data;
};

const markAllAsRead = async () => {
  const res = await apiClient.put('/notifications/read-all');
  return res.data;
};

export { getNotifications, markAsRead, markAllAsRead };
