import api from './api';

export const getSummary = async (filters = {}) => {
  const params = new URLSearchParams();
  if (filters.startDate) params.append('startDate', filters.startDate);
  if (filters.endDate) params.append('endDate', filters.endDate);

  const response = await api.get(`/analytics/summary?${params.toString()}`);
  return response.data.data;
};

export const getCategoryBreakdown = async (filters = {}) => {
  const params = new URLSearchParams();
  if (filters.startDate) params.append('startDate', filters.startDate);
  if (filters.endDate) params.append('endDate', filters.endDate);

  const response = await api.get(`/analytics/categories?${params.toString()}`);
  return response.data.data;
};

export const getMonthlyTrends = async () => {
  const response = await api.get('/analytics/trends');
  return response.data.data;
};
