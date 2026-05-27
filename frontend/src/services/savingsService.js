import api from './api';

export const getSavingsGoals = async () => {
  const response = await api.get('/savings');
  return response.data.data;
};

export const createSavingsGoal = async (goalData) => {
  const response = await api.post('/savings', goalData);
  return response.data.data;
};

export const updateSavingsGoal = async ({ id, ...goalData }) => {
  const response = await api.put(`/savings/${id}`, goalData);
  return response.data.data;
};

export const adjustSavingsBalance = async ({ id, amount, action }) => {
  const response = await api.patch(`/savings/${id}/deposit`, { amount, action });
  return response.data.data;
};

export const deleteSavingsGoal = async (id) => {
  const response = await api.delete(`/savings/${id}`);
  return response.data;
};
