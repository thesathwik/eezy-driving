// Review service for API calls
import { API, handleResponse, getHeaders } from '../config/api';

// Get all reviews
export const getAllReviews = async () => {
  try {
    const response = await fetch(API.reviews.list, {
      method: 'GET',
      headers: getHeaders(),
    });

    const data = await handleResponse(response);
    return data;
  } catch (error) {
    throw {
      message: error.data?.message || error.message || 'Failed to fetch reviews',
    };
  }
};

// Get reviews by instructor
export const getReviewsByInstructor = async (instructorId) => {
  try {
    const response = await fetch(API.reviews.byInstructor(instructorId), {
      method: 'GET',
      headers: getHeaders(),
    });

    const data = await handleResponse(response);
    return data;
  } catch (error) {
    throw {
      message: error.data?.message || error.message || 'Failed to fetch reviews',
    };
  }
};

// Create a new review
export const createReview = async (reviewData) => {
  try {
    const response = await fetch(API.reviews.create, {
      method: 'POST',
      headers: getHeaders(true),
      body: JSON.stringify(reviewData),
    });

    const data = await handleResponse(response);
    return data;
  } catch (error) {
    throw {
      message: error.data?.message || error.message || 'Failed to create review',
    };
  }
};
