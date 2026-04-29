import apiClient from './apiClient';

const reportService = {
  getDashboardReport: async (filterType = 'month', year, month) => {
    let url = `/reports/dashboard?filterType=${filterType}`;
    if (year) url += `&year=${year}`;
    if (month) url += `&month=${month}`;
    const response = await apiClient.get(url);
    return response.data;
  }
};

export default reportService;
