import apiClient from './apiClient';

const API_URL = '/invoices';

const getInvoices = async (params) => {
  const response = await apiClient.get(API_URL, { params });
  return response.data;
};

const calculatePreview = async (data) => {
  const response = await apiClient.post(`${API_URL}/calculate-preview`, data);
  return response.data;
};

const createInvoice = async (data) => {
  const response = await apiClient.post(API_URL, data);
  return response.data;
};

const updateInvoice = async (id, data) => {
  const response = await apiClient.put(`${API_URL}/${id}`, data);
  return response.data;
};

const getInvoiceById = async (id) => {
  const res = await apiClient.get(`/invoices/${id}`);
  return res.data;
};

const deleteInvoice = async (id) => {
  const response = await apiClient.delete(`${API_URL}/${id}`);
  return response.data;
};

const sendEmail = async (id) => {
  const response = await apiClient.post(`${API_URL}/${id}/send-email`, {});
  return response.data;
};

export {
  getInvoices,
  getInvoiceById,
  calculatePreview,
  createInvoice,
  updateInvoice,
  deleteInvoice,
  sendEmail
};
