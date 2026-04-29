import apiClient from './apiClient';

export const getTenants = async (page = 1, limit = 10, search = '', filters = {}) => {
  const params = { page, limit, search, ...filters };
  // Xóa params rỗng
  Object.keys(params).forEach(k => { if (!params[k]) delete params[k]; });
  const res = await apiClient.get('/tenants', { params });
  return res.data.data;
};

export const getTenantById = async (id) => {
  const res = await apiClient.get(`/tenants/${id}`);
  return res.data.data;
};

export const createTenant = async (data) => {
  const res = await apiClient.post('/tenants', data);
  return res.data.data;
};

export const updateTenant = async (id, data) => {
  const res = await apiClient.put(`/tenants/${id}`, data);
  return res.data.data;
};

export const deleteTenant = async (id) => {
  const res = await apiClient.delete(`/tenants/${id}`);
  return res.data;
};

export const getTenantStats = async () => {
  const res = await apiClient.get('/tenants/stats');
  return res.data.data;
};

export const exportTenants = async (filters = {}) => {
  const params = { ...filters };
  Object.keys(params).forEach(k => { if (!params[k]) delete params[k]; });
  const res = await apiClient.get('/tenants/export', { params, responseType: 'blob' });
  // Tạo link download tự động
  const url = window.URL.createObjectURL(new Blob([res.data]));
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `danh-sach-khach-thue-${Date.now()}.csv`);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};
