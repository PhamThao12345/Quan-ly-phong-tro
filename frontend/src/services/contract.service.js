import apiClient from './apiClient';

export const getContracts = async (page = 1, limit = 10, search = '', filters = {}) => {
  const res = await apiClient.get('/contracts', { params: { page, limit, search, ...filters } });
  return res.data.data;
};

export const getContractById = async (id) => {
  const res = await apiClient.get(`/contracts/${id}`);
  return res.data.data;
};

export const createContract = async (data) => {
  const res = await apiClient.post('/contracts', data);
  return res.data.data;
};

export const updateContract = async (id, data) => {
  const res = await apiClient.put(`/contracts/${id}`, data);
  return res.data.data;
};

export const deleteContract = async (id) => {
  const res = await apiClient.delete(`/contracts/${id}`);
  return res.data.data;
};

export const getContractStats = async () => {
  const res = await apiClient.get('/contracts/stats');
  return res.data.data;
};

export const renewContract = async (id) => {
  const res = await apiClient.post(`/contracts/${id}/renew`);
  return res.data.data;
};

export const terminateContract = async (id) => {
  const res = await apiClient.post(`/contracts/${id}/terminate`);
  return res.data.data;
};

export const exportContractWord = async (id, fileName = 'hop_dong.docx') => {
  const res = await apiClient.get(`/contracts/${id}/export`, { responseType: 'blob' });
  const url = window.URL.createObjectURL(new Blob([res.data]));
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', fileName);
  document.body.appendChild(link);
  link.click();
  link.remove();
};

export const exportContractsBulk = async (filters = {}) => {
  const res = await apiClient.get('/contracts/export-bulk', { params: filters, responseType: 'blob' });
  const url = window.URL.createObjectURL(new Blob([res.data]));
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', 'danh_sach_hop_dong.csv');
  document.body.appendChild(link);
  link.click();
  link.remove();
};
