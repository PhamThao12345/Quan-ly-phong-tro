import apiClient from './apiClient';

const userService = {
  getAllUsers: () => {
    return apiClient.get('/users');
  },
  
  getUserById: (id) => {
    return apiClient.get(`/users/${id}`);
  },

  createUser: (data) => {
    return apiClient.post('/users', data);
  },

  updateUser: (id, data) => {
    return apiClient.put(`/users/${id}`, data);
  },

  deleteUser: (id) => {
    return apiClient.delete(`/users/${id}`);
  },

  resetPassword: (id) => {
    return apiClient.post(`/users/${id}/reset-password`);
  }
};

export default userService;
