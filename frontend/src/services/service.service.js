import axios from 'axios';

const API_URL = 'http://localhost:5000/api/services';

const getAuthHeader = () => {
  const token = localStorage.getItem('access_token');
  return { Authorization: `Bearer ${token}` };
};

export const getServices = async () => {
  const response = await axios.get(API_URL, { headers: getAuthHeader() });
  return response.data;
};

export const createService = async (serviceData) => {
  const response = await axios.post(API_URL, serviceData, { headers: getAuthHeader() });
  return response.data;
};

export const updateService = async (id, serviceData) => {
  const response = await axios.put(`${API_URL}/${id}`, serviceData, { headers: getAuthHeader() });
  return response.data;
};

export const deleteService = async (id) => {
  const response = await axios.delete(`${API_URL}/${id}`, { headers: getAuthHeader() });
  return response.data;
};

export const applyServiceToRooms = async (serviceId, roomIds) => {
  const response = await axios.post(`${API_URL}/apply`, { serviceId, roomIds }, { headers: getAuthHeader() });
  return response.data;
};

export const removeServiceFromRoom = async (serviceId, roomId) => {
  const response = await axios.post(`${API_URL}/remove`, { serviceId, roomId }, { headers: getAuthHeader() });
  return response.data;
};
