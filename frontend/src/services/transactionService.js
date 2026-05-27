import api from './api';

export const getTransactions = async (filters = {}) => {
  const params = new URLSearchParams();
  
  if (filters.type) params.append('type', filters.type);
  if (filters.categoryId) params.append('categoryId', filters.categoryId);
  if (filters.startDate) params.append('startDate', filters.startDate);
  if (filters.endDate) params.append('endDate', filters.endDate);
  if (filters.search) params.append('search', filters.search);
  if (filters.page) params.append('page', filters.page);
  if (filters.limit) params.append('limit', filters.limit);

  const response = await api.get(`/transactions?${params.toString()}`);
  return response.data.data;
};

export const getTransactionById = async (id) => {
  const response = await api.get(`/transactions/${id}`);
  return response.data.data;
};

export const createTransaction = async (txnData) => {
  const response = await api.post('/transactions', txnData);
  return response.data.data;
};

export const updateTransaction = async ({ id, ...txnData }) => {
  const response = await api.put(`/transactions/${id}`, txnData);
  return response.data.data;
};

export const deleteTransaction = async (id) => {
  const response = await api.delete(`/transactions/${id}`);
  return response.data;
};
