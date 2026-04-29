import apiClient from './apiClient';

const activityService = {
  getActivities: async (limit = 50) => {
    const response = await apiClient.get(`/activities?limit=${limit}`);
    return response.data;
  },
  clearActivities: async () => {
    const response = await apiClient.delete('/activities');
    return response.data;
  }
};

export default activityService;
