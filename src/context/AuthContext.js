import React, { createContext, useState, useContext, useEffect } from 'react';
import {
  getCurrentSession,
  loginUser as loginService,
  registerUser as registerService,
  logoutUser as logoutService,
  updateUserProfile as updateProfileService,
  changePassword as changePasswordService
} from '../utils/authService';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user session exists
    const session = getCurrentSession();
    if (session) {
      setUser(session);
    }
    setLoading(false);
  }, []);

  const login = async (email, password, userType = 'learner') => {
    try {
      const response = await loginService(email, password, userType);
      setUser(response.user);
      return { success: true, user: response.user };
    } catch (error) {
      return { success: false, error: error.message, field: error.field };
    }
  };

  const signup = async (userData) => {
    try {
      const response = await registerService(userData);
      setUser(response.user);
      return { success: true, user: response.user };
    } catch (error) {
      return { success: false, error: error.message, field: error.field };
    }
  };

  const logout = () => {
    logoutService();
    setUser(null);
  };

  const updateProfile = async (updates) => {
    if (!user) return { success: false, error: 'No user logged in' };

    try {
      const response = await updateProfileService(user.id, updates);
      setUser(response.user);
      return { success: true, user: response.user };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const updatePassword = async (currentPassword, newPassword) => {
    if (!user) return { success: false, error: 'No user logged in' };

    try {
      await changePasswordService(user.id, currentPassword, newPassword);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const refreshUser = async () => {
    try {
      // Import getCurrentUser dynamically or move import to top if not circular
      const { getCurrentUser } = require('../utils/authService');
      const response = await getCurrentUser();
      if (response.success && response.data) {
        setUser(prev => {
          // Keep token if not returned, merge new data
          const newData = { ...prev, ...response.data };
          localStorage.setItem('eazydriving_session', JSON.stringify(newData));
          return newData;
        });
        return { success: true, user: response.data };
      }
      return { success: false };
    } catch (error) {
      console.error('Failed to refresh user:', error);
      return { success: false, error: error.message };
    }
  };

  const value = {
    user,
    loading,
    login,
    signup,
    logout,
    updateProfile,
    updatePassword,
    refreshUser,
    isAuthenticated: !!user,
    isLearner: user?.role === 'learner' || user?.type === 'learner',
    isInstructor: user?.role === 'instructor' || user?.type === 'instructor'
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
