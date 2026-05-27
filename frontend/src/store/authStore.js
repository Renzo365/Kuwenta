import { create } from 'zustand';
import api, { injectAuthStore } from '../services/api';

const useAuthStore = create((set, get) => ({
  user: null,
  accessToken: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,

  // Register a new user account
  register: async (username, email, password) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.post('/auth/register', { username, email, password });
      set({ isLoading: false });
      return response.data;
    } catch (error) {
      const message = error.response?.data?.message || 'Registration failed. Please try again.';
      set({ isLoading: false, error: message });
      throw new Error(message);
    }
  },

  // Log in user and establish session
  login: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.post('/auth/login', { email, password });
      const { accessToken, user } = response.data.data;
      
      set({
        user,
        accessToken,
        isAuthenticated: true,
        isLoading: false
      });
      
      return response.data;
    } catch (error) {
      const message = error.response?.data?.message || 'Login failed. Please verify credentials.';
      set({ isLoading: false, error: message });
      throw new Error(message);
    }
  },

  // Request new access token using HttpOnly refresh cookie
  refresh: async () => {
    try {
      const response = await api.post('/auth/refresh');
      const { accessToken, user } = response.data.data;
      
      set({
        user,
        accessToken,
        isAuthenticated: true,
        isLoading: false
      });
      
      return accessToken;
    } catch (error) {
      set({
        user: null,
        accessToken: null,
        isAuthenticated: false,
        isLoading: false
      });
      throw error;
    }
  },

  // End user session and clear cookies
  logout: async () => {
    set({ isLoading: true });
    try {
      // Best effort logout on server
      if (get().isAuthenticated) {
        await api.post('/auth/logout');
      }
    } catch (error) {
      console.warn('Backend logout failed:', error.message);
    } finally {
      set({
        user: null,
        accessToken: null,
        isAuthenticated: false,
        isLoading: false,
        error: null
      });
    }
  },

  // Auto-check for existing session on app startup
  checkAuth: async () => {
    set({ isLoading: true, error: null });
    try {
      await get().refresh();
    } catch (error) {
      // Ignored: no active session found
      set({ isLoading: false });
    }
  },

  // Clear any existing store errors
  clearError: () => set({ error: null }),

  // Update user info locally after settings/profile modifications
  updateUser: (updatedFields) => {
    const currentUser = get().user;
    if (currentUser) {
      set({
        user: { ...currentUser, ...updatedFields }
      });
    }
  }
}));

// Inject the store into the api client instance
injectAuthStore(useAuthStore);

export default useAuthStore;
