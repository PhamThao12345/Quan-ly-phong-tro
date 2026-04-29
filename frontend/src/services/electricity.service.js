import axios from 'axios';

const API_URL = 'http://localhost:5000/api/electricity';

const getAuthHeader = () => {
  const token = localStorage.getItem('access_token');
  return { Authorization: `Bearer ${token}` };
};

export const getMeterIndices = async (month, year) => {
  const response = await axios.get(`${API_URL}?month=${month}&year=${year}`, { headers: getAuthHeader() });
  return response.data;
};

export const updateMeterIndex = async (data) => {
  const response = await axios.post(`${API_URL}/update`, data, { headers: getAuthHeader() });
  return response.data;
};

export const saveBatchMeters = async (meters) => {
  const response = await axios.post(`${API_URL}/save-batch`, { meters }, { headers: getAuthHeader() });
  return response.data;
};
