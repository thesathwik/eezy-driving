// Real authentication service connected to backend API
import { API, handleResponse, getHeaders } from '../config/api';

const SESSION_STORAGE_KEY = 'eazydriving_session';

// Register a new user
export const registerUser = async (userData) => {
  try {
    const response = await fetch(API.auth.register, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({
        firstName: userData.firstName,
        lastName: userData.lastName,
        email: userData.email,
        password: userData.password,
        phone: userData.phone,
        role: userData.type, // 'learner' or 'instructor'
      }),
    });

    const data = await handleResponse(response);

    // NEW: Registration now requires email verification, so no token is returned
    // Backend returns: { success: true, message: "...", data: { email: "...", role: "..." } }
    if (data.success) {
      return {
        success: true,
        email: data.data.email,
        role: data.data.role,
        message: data.message
      };
    }

    return data;
  } catch (error) {
    throw {
      message: error.data?.message || error.message || 'Registration failed',
      field: error.data?.field,
    };
  }
};

// Login user
export const loginUser = async (email, password, userType) => {
  try {
    const response = await fetch(API.auth.login, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({
        email,
        password,
        role: userType, // 'learner' or 'instructor'
      }),
    });

    const data = await handleResponse(response);

    // Save session with token
    // Backend returns: { success: true, data: { user: {...}, token: "..." } }
    if (data.success && data.data) {
      const userSession = {
        ...data.data.user,
        token: data.data.token,
      };
      localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(userSession));
      return { success: true, user: data.data.user, token: data.data.token };
    }

    return data;
  } catch (error) {
    throw {
      message: error.data?.message || error.message || 'Login failed',
      field: error.data?.field,
    };
  }
};

// Get current session
export const getCurrentSession = () => {
  try {
    const session = localStorage.getItem(SESSION_STORAGE_KEY);
    return session ? JSON.parse(session) : null;
  } catch (error) {
    console.error('Error reading session:', error);
    return null;
  }
};

// Logout user
export const logoutUser = () => {
  try {
    localStorage.removeItem(SESSION_STORAGE_KEY);
    return true;
  } catch (error) {
    console.error('Error during logout:', error);
    return false;
  }
};

// Get current user from backend
export const getCurrentUser = async () => {
  try {
    const response = await fetch(API.auth.me, {
      method: 'GET',
      headers: getHeaders(true), // Include auth token
    });

    const data = await handleResponse(response);
    return data;
  } catch (error) {
    throw {
      message: error.data?.message || error.message || 'Failed to get user data',
    };
  }
};

// Update user profile
export const updateUserProfile = async (userId, updates) => {
  try {
    const session = getCurrentSession();
    const role = session?.role || 'learner';

    let endpoint;
    if (role === 'instructor') {
      endpoint = API.instructors.update(userId);
    } else {
      endpoint = API.learners.update(userId);
    }

    const response = await fetch(endpoint, {
      method: 'PUT',
      headers: getHeaders(true),
      body: JSON.stringify(updates),
    });

    const data = await handleResponse(response);

    // Update session with new data
    if (data.success && data.data) {
      const currentSession = getCurrentSession();
      const updatedSession = {
        ...currentSession,
        ...data.data,
      };
      localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(updatedSession));
    }

    return data;
  } catch (error) {
    throw {
      message: error.data?.message || error.message || 'Profile update failed',
    };
  }
};

// Check if email exists (for validation)
export const checkEmailExists = async (email) => {
  // This would need a backend endpoint to check email availability
  // For now, we'll let the registration handle duplicate detection
  return false;
};

// Password reset request
export const requestPasswordReset = async (email) => {
  try {
    // This would need a password reset endpoint in the backend
    // For now, return a success message
    return {
      success: true,
      message: 'Password reset functionality will be available soon',
    };
  } catch (error) {
    throw {
      message: error.data?.message || error.message || 'Password reset failed',
    };
  }
};

// Change password
export const changePassword = async (userId, currentPassword, newPassword) => {
  try {
    // This would need a password change endpoint in the backend
    // For now, return a success message
    return {
      success: true,
      message: 'Password change functionality will be available soon',
    };
  } catch (error) {
    throw {
      message: error.data?.message || error.message || 'Password change failed',
    };
  }
};

// Helper function to check if user is authenticated
export const isAuthenticated = () => {
  const session = getCurrentSession();
  return session && session.token;
};

// Helper function to get user role
export const getUserRole = () => {
  const session = getCurrentSession();
  return session?.role || null;
};

// Verify email with token
export const verifyEmail = async (token) => {
  try {
    const response = await fetch(API.auth.verifyEmail, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ token }),
    });

    const data = await handleResponse(response);

    // Save session with token after verification
    if (data.success && data.data) {
      const userSession = {
        ...data.data.user,
        token: data.data.token,
      };
      localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(userSession));
      return { success: true, user: data.data.user, token: data.data.token };
    }

    return data;
  } catch (error) {
    throw {
      message: error.data?.message || error.message || 'Email verification failed',
    };
  }
};

// Resend verification email
export const resendVerificationEmail = async (email) => {
  try {
    const response = await fetch(API.auth.resendVerification, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ email }),
    });

    const data = await handleResponse(response);
    return data;
  } catch (error) {
    throw {
      message: error.data?.message || error.message || 'Failed to resend verification email',
    };
  }
};
