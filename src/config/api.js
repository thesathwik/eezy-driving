// API Configuration
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

// Helper function to handle API responses
export const handleResponse = async (response) => {
  const data = await response.json();

  if (!response.ok) {
    const error = new Error(data.message || 'Something went wrong');
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
};

// Helper function to get auth token
export const getAuthToken = () => {
  try {
    const session = localStorage.getItem('eazydriving_session');
    if (session) {
      const parsed = JSON.parse(session);
      return parsed.token;
    }
    return null;
  } catch (error) {
    console.error('Error getting auth token:', error);
    return null;
  }
};

// Helper function to create headers
export const getHeaders = (includeAuth = false) => {
  const headers = {
    'Content-Type': 'application/json',
  };

  if (includeAuth) {
    const token = getAuthToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }

  return headers;
};

// API endpoints
export const API = {
  // Auth endpoints
  auth: {
    register: `${API_BASE_URL}/auth/register`,
    login: `${API_BASE_URL}/auth/login`,
    me: `${API_BASE_URL}/auth/me`,
  },

  // Instructor endpoints
  instructors: {
    list: `${API_BASE_URL}/instructors`,
    byId: (id) => `${API_BASE_URL}/instructors/${id}`,
    create: `${API_BASE_URL}/instructors`,
    update: (id) => `${API_BASE_URL}/instructors/${id}`,
    availability: (id) => `${API_BASE_URL}/instructors/${id}/availability`,
  },

  // Learner endpoints
  learners: {
    list: `${API_BASE_URL}/learners`,
    byId: (id) => `${API_BASE_URL}/learners/${id}`,
    create: `${API_BASE_URL}/learners`,
    update: (id) => `${API_BASE_URL}/learners/${id}`,
  },

  // Booking endpoints
  bookings: {
    list: `${API_BASE_URL}/bookings`,
    byId: (id) => `${API_BASE_URL}/bookings/${id}`,
    create: `${API_BASE_URL}/bookings`,
    update: (id) => `${API_BASE_URL}/bookings/${id}`,
    cancel: (id) => `${API_BASE_URL}/bookings/${id}/cancel`,
  },

  // Review endpoints
  reviews: {
    list: `${API_BASE_URL}/reviews`,
    byInstructor: (id) => `${API_BASE_URL}/reviews/instructor/${id}`,
    create: `${API_BASE_URL}/reviews`,
  },

  // Availability endpoints
  availability: {
    byInstructor: (id) => `${API_BASE_URL}/availability/instructor/${id}`,
    create: `${API_BASE_URL}/availability`,
    update: (id) => `${API_BASE_URL}/availability/${id}`,
    delete: (id) => `${API_BASE_URL}/availability/${id}`,
  },
};

export default API_BASE_URL;
