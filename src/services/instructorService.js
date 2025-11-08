// Instructor service for API calls
import { API, handleResponse, getHeaders } from '../config/api';

// Get all instructors
export const getAllInstructors = async (filters = {}) => {
  try {
    const queryParams = new URLSearchParams();

    if (filters.location) queryParams.append('location', filters.location);
    if (filters.transmission) queryParams.append('transmission', filters.transmission);
    if (filters.minRating) queryParams.append('minRating', filters.minRating);

    const url = `${API.instructors.list}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: getHeaders(),
    });

    const data = await handleResponse(response);
    return data;
  } catch (error) {
    throw {
      message: error.data?.message || error.message || 'Failed to fetch instructors',
    };
  }
};

// Get instructor by ID
export const getInstructorById = async (id) => {
  try {
    const response = await fetch(API.instructors.byId(id), {
      method: 'GET',
      headers: getHeaders(),
    });

    const data = await handleResponse(response);
    return data;
  } catch (error) {
    throw {
      message: error.data?.message || error.message || 'Failed to fetch instructor',
    };
  }
};

// Create instructor profile
export const createInstructorProfile = async (instructorData) => {
  try {
    const response = await fetch(API.instructors.create, {
      method: 'POST',
      headers: getHeaders(true),
      body: JSON.stringify(instructorData),
    });

    const data = await handleResponse(response);
    return data;
  } catch (error) {
    throw {
      message: error.data?.message || error.message || 'Failed to create instructor profile',
    };
  }
};

// Update instructor profile
export const updateInstructorProfile = async (id, updates) => {
  try {
    const response = await fetch(API.instructors.update(id), {
      method: 'PUT',
      headers: getHeaders(true),
      body: JSON.stringify(updates),
    });

    const data = await handleResponse(response);
    return data;
  } catch (error) {
    throw {
      message: error.data?.message || error.message || 'Failed to update instructor profile',
    };
  }
};

// Get instructor availability
export const getInstructorAvailability = async (instructorId, date) => {
  try {
    const queryParams = date ? `?date=${date}` : '';
    const response = await fetch(`${API.availability.byInstructor(instructorId)}${queryParams}`, {
      method: 'GET',
      headers: getHeaders(),
    });

    const data = await handleResponse(response);
    return data;
  } catch (error) {
    throw {
      message: error.data?.message || error.message || 'Failed to fetch availability',
    };
  }
};

// Create availability slot
export const createAvailability = async (availabilityData) => {
  try {
    const response = await fetch(API.availability.create, {
      method: 'POST',
      headers: getHeaders(true),
      body: JSON.stringify(availabilityData),
    });

    const data = await handleResponse(response);
    return data;
  } catch (error) {
    throw {
      message: error.data?.message || error.message || 'Failed to create availability',
    };
  }
};

// Update availability slot
export const updateAvailability = async (id, updates) => {
  try {
    const response = await fetch(API.availability.update(id), {
      method: 'PUT',
      headers: getHeaders(true),
      body: JSON.stringify(updates),
    });

    const data = await handleResponse(response);
    return data;
  } catch (error) {
    throw {
      message: error.data?.message || error.message || 'Failed to update availability',
    };
  }
};

// Delete availability slot
export const deleteAvailability = async (id) => {
  try {
    const response = await fetch(API.availability.delete(id), {
      method: 'DELETE',
      headers: getHeaders(true),
    });

    const data = await handleResponse(response);
    return data;
  } catch (error) {
    throw {
      message: error.data?.message || error.message || 'Failed to delete availability',
    };
  }
};
