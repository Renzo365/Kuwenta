import api from './api';

export const getCategories = async () => {
  const response = await api.get('/categories');
  return response.data.data;
};

export const createCategory = async (categoryData) => {
  const response = await api.post('/categories', categoryData);
  return response.data.data;
};
