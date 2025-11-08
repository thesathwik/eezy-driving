// Booking service for API calls
import { API, handleResponse, getHeaders } from '../config/api';

// Get all bookings
export const getAllBookings = async (filters = {}) => {
  try {
    const queryParams = new URLSearchParams();

    if (filters.status) queryParams.append('status', filters.status);
    if (filters.instructorId) queryParams.append('instructorId', filters.instructorId);
    if (filters.learnerId) queryParams.append('learnerId', filters.learnerId);

    const url = `${API.bookings.list}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: getHeaders(true),
    });

    const data = await handleResponse(response);
    return data;
  } catch (error) {
    throw {
      message: error.data?.message || error.message || 'Failed to fetch bookings',
    };
  }
};

// Get booking by ID
export const getBookingById = async (id) => {
  try {
    const response = await fetch(API.bookings.byId(id), {
      method: 'GET',
      headers: getHeaders(true),
    });

    const data = await handleResponse(response);
    return data;
  } catch (error) {
    throw {
      message: error.data?.message || error.message || 'Failed to fetch booking',
    };
  }
};

// Create a new booking
export const createBooking = async (bookingData) => {
  try {
    const response = await fetch(API.bookings.create, {
      method: 'POST',
      headers: getHeaders(true),
      body: JSON.stringify(bookingData),
    });

    const data = await handleResponse(response);
    return data;
  } catch (error) {
    throw {
      message: error.data?.message || error.message || 'Failed to create booking',
    };
  }
};

// Update booking
export const updateBooking = async (id, updates) => {
  try {
    const response = await fetch(API.bookings.update(id), {
      method: 'PUT',
      headers: getHeaders(true),
      body: JSON.stringify(updates),
    });

    const data = await handleResponse(response);
    return data;
  } catch (error) {
    throw {
      message: error.data?.message || error.message || 'Failed to update booking',
    };
  }
};

// Cancel booking
export const cancelBooking = async (id, reason) => {
  try {
    const response = await fetch(API.bookings.cancel(id), {
      method: 'POST',
      headers: getHeaders(true),
      body: JSON.stringify({ reason }),
    });

    const data = await handleResponse(response);
    return data;
  } catch (error) {
    throw {
      message: error.data?.message || error.message || 'Failed to cancel booking',
    };
  }
};
